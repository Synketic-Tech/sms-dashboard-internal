-- Candidate migration. Apply only after review to the database owning the token ledger.
-- sms_admin_gateway must be provisioned by an operator; no hosted role creation here.
begin;
create schema platform_admin;
revoke all on schema platform_admin from public;
create table platform_admin.grants (
 actor uuid not null, organization_id uuid not null references public.organizations(id),
 environment text not null check(environment in ('production','sandbox')),
 primary key(actor,organization_id,environment)
);
-- Sanitized directory fed by a reviewed identity adapter, never a clinical join.
create table platform_admin.directory (
 organization_id uuid primary key references public.organizations(id),
 display_name text not null, user_emails text[] not null default '{}'
);
create table platform_admin.requests (
 id uuid primary key, organization_id uuid not null, environment text not null,
 amount integer not null check(amount<>0 and amount between -100000 and 100000),
 reason text not null check(length(trim(reason)) between 1 and 400),
 category text not null check(category in ('internal_test_grant','customer_support_correction','approved_removal')),
 requester uuid not null, revision integer not null default 1,
 status text not null default 'pending' check(status in ('pending','approved','applied')),
 approval_hash text, expires_at timestamptz, approver uuid,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 result jsonb
);
create table platform_admin.audit (
 id bigint generated always as identity primary key, request_id uuid,
 organization_id uuid not null, environment text not null, actor uuid not null,
 action text not null, detail jsonb not null, recorded_at timestamptz not null default now()
);
create trigger immutable_admin_audit before update or delete on platform_admin.audit
 for each row execute function public.prevent_fce_report_token_ledger_mutation();
alter table platform_admin.grants enable row level security;
alter table platform_admin.directory enable row level security;
alter table platform_admin.requests enable row level security;
alter table platform_admin.audit enable row level security;
revoke all on all tables in schema platform_admin from public,anon,authenticated,sms_admin_gateway;

-- Identity is supplied only by the trusted server after authentication. Customers
-- cannot execute this function or set an identity through any HTTP payload.
create function platform_admin.operate(p_actor uuid,p_action text,p_org uuid,p_env text,p_body jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare r platform_admin.requests; old_r platform_admin.requests; data jsonb; account jsonb;
 ledger jsonb; reservations jsonb; history jsonb; audit_rows jsonb; secret text; prefix text;
 before_available integer; before_reserved integer; err text;
begin
 if p_actor is null or p_env is null or p_env not in ('production','sandbox') then raise exception 'Access denied' using errcode='42501'; end if;
 if p_action='lookup' then
  select coalesce(jsonb_agg(x),'[]') into data from (
   select d.organization_id,d.display_name,d.user_emails from platform_admin.directory d
   where exists(select 1 from platform_admin.grants g where g.actor=p_actor and g.organization_id=d.organization_id and g.environment=p_env)
   and (d.display_name ilike '%' || left(coalesce(p_body->>'query',''),100) || '%'
     or exists(select from unnest(d.user_emails) e where e ilike '%' || left(coalesce(p_body->>'query',''),100) || '%'))
   order by d.display_name limit 50
  ) x; return data;
 end if;
 if not exists(select from platform_admin.grants where actor=p_actor and organization_id=p_org and environment=p_env) then raise exception 'Access denied' using errcode='42501'; end if;
 prefix:=case p_env when 'sandbox' then 'fce_sandbox_report_token_' else 'fce_report_token_' end;
 if p_action='inspect' then
  execute format('select to_jsonb(x) from (select available_tokens,reserved_tokens,updated_at from public.%I where organization_id=$1) x',prefix||'accounts') into account using p_org;
  -- Exclude opaque receipts, reservation IDs and free-text source reasons.
  execute format('select coalesce(jsonb_agg(x),''[]'') from (select event_type,available_delta,reserved_delta,available_after,reserved_after,recorded_at from public.%I where organization_id=$1 order by recorded_at desc limit 100) x',prefix||'ledger_entries') into ledger using p_org;
  execute format('select coalesce(jsonb_agg(x),''[]'') from (select quantity,remaining_tokens,status,expires_at from public.%I where organization_id=$1 order by created_at desc limit 100) x',prefix||'reservations') into reservations using p_org;
  select coalesce(jsonb_agg(to_jsonb(q)-'approval_hash'),'[]') into history from (select * from platform_admin.requests where organization_id=p_org and environment=p_env order by created_at desc limit 100) q;
  select coalesce(jsonb_agg(to_jsonb(q)),'[]') into audit_rows from (select * from platform_admin.audit where organization_id=p_org and environment=p_env order by id desc limit 100) q;
  return jsonb_build_object('account',account,'ledger',ledger,'reservations',reservations,'requests',history,'audit',audit_rows,'asOf',now(),'limit',100,'productionApplicationEnabled',false);
 end if;
 -- A failed command rolls back its mutation but records a sanitized failure.
 begin
 if p_action is null or p_action not in ('create','edit','preview','issue_mock','confirm_mock','apply') then raise exception 'Unsupported operation'; end if;
 if p_action='create' then
  perform pg_advisory_xact_lock(hashtextextended(p_body->>'id',0));
  select * into r from platform_admin.requests where id=(p_body->>'id')::uuid for update;
  if found then
   if r.organization_id<>p_org or r.environment<>p_env or r.requester<>p_actor or r.amount is distinct from (p_body->>'amount')::integer or r.reason is distinct from p_body->>'reason' or r.category is distinct from p_body->>'category' then raise exception 'Idempotency conflict'; end if;
   return to_jsonb(r)-'approval_hash';
  end if;
  insert into platform_admin.requests(id,organization_id,environment,amount,reason,category,requester)
   values((p_body->>'id')::uuid,p_org,p_env,(p_body->>'amount')::integer,p_body->>'reason',p_body->>'category',p_actor) returning * into r;
 else
  select * into r from platform_admin.requests where id=(p_body->>'id')::uuid and organization_id=p_org and environment=p_env for update;
  if not found then raise exception 'Request unavailable in this organization and environment'; end if;
  if r.requester<>p_actor then raise exception 'Only the requesting administrator may operate this local request'; end if;
  if p_action='apply' and r.status='applied' then return to_jsonb(r)-'approval_hash'; end if;
  if r.revision is distinct from (p_body->>'revision')::integer then raise exception 'Request changed: refresh before continuing'; end if;
  old_r:=r;
  if p_action='edit' then
   if r.status='applied' then raise exception 'Applied requests are immutable'; end if;
   update platform_admin.requests set amount=(p_body->>'amount')::integer,reason=p_body->>'reason',category=p_body->>'category',revision=revision+1,status='pending',approval_hash=null,expires_at=null,approver=null,updated_at=now() where id=r.id returning * into r;
  elsif p_action='preview' then
   execute format('select available_tokens,reserved_tokens from public.%I where organization_id=$1',prefix||'accounts') into before_available,before_reserved using p_org;
   return jsonb_build_object('request',to_jsonb(r)-'approval_hash','availableBefore',before_available,'availableAfter',before_available+r.amount,'reservedBefore',before_reserved,'reservedAfter',before_reserved,'productionApplicationEnabled',false,'warning','Preview only; balance is checked again atomically at application. Tokens do not grant subscription access.');
  elsif p_action='issue_mock' then
   if p_env<>'sandbox' or r.status='applied' then raise exception 'Mock approval is sandbox-only'; end if;
   secret:=gen_random_uuid()::text||gen_random_uuid()::text;
   update platform_admin.requests set approval_hash=encode(sha256(convert_to(secret,'UTF8')),'hex'),expires_at=clock_timestamp()+interval '15 minutes',approver=null,status='pending',updated_at=now() where id=r.id returning * into r;
  elsif p_action='confirm_mock' then
   if p_env<>'sandbox' or r.status<>'pending' or r.expires_at is null or r.expires_at<=clock_timestamp() or r.approval_hash is null or r.approval_hash is distinct from encode(sha256(convert_to(p_body->>'secret','UTF8')),'hex') then raise exception 'Approval expired, invalid, or already used'; end if;
   update platform_admin.requests set approver=p_actor,status='approved',approval_hash=null,updated_at=now() where id=r.id returning * into r;
  elsif p_action='apply' then
   if p_env='production' then raise exception 'Production application disabled pending email policy and explicit activation'; end if;
   if r.status<>'approved' or r.approver is null or r.expires_at is null or r.expires_at<=clock_timestamp() then raise exception 'A current approval is required'; end if;
   -- Same account lock as reservation/consumption RPCs; adjustment touches available only.
   select available_tokens,reserved_tokens into before_available,before_reserved from public.fce_sandbox_report_token_accounts where organization_id=p_org for update;
   if not found then raise exception 'Account unavailable; investigate before adjustment'; end if;
   if r.expires_at<=clock_timestamp() then raise exception 'Approval expired while waiting for account lock'; end if;
   perform set_config('request.jwt.claim.sub',p_actor::text,true);
   data:=public.apply_fce_sandbox_report_token_adjustment(p_org,'platform-admin:'||r.id::text,'support_adjustment',r.amount,'['||r.category||'] '||r.reason);
   update platform_admin.requests set status='applied',updated_at=now(),result=jsonb_build_object('beforeAvailable',before_available,'beforeReserved',before_reserved,'ledger',data,'appliedAt',clock_timestamp(),'requester',r.requester,'approver',r.approver,'idempotencyKey','platform-admin:'||r.id::text) where id=r.id returning * into r;
  else raise exception 'Unsupported operation'; end if;
 end if;
 if (r.category='internal_test_grant' and r.amount<0) or (r.category='approved_removal' and r.amount>0) then raise exception 'Category does not match adjustment direction'; end if;
 insert into platform_admin.audit(request_id,organization_id,environment,actor,action,detail) values(r.id,p_org,p_env,p_actor,p_action,jsonb_build_object('request',to_jsonb(r)-'approval_hash','previous',case when old_r.id is null then null else to_jsonb(old_r)-'approval_hash' end,'delivery',case when p_action in ('issue_mock','confirm_mock') then 'MOCK ONLY - no email sent' else null end));
 return (to_jsonb(r)-'approval_hash') || case when secret is null then '{}'::jsonb else jsonb_build_object('mockSecret',secret,'delivery','MOCK ONLY - no email sent') end;
 exception when others then
  err:=case when sqlstate in ('P0001','22003') then sqlerrm else 'Invalid request; check amount, category, reason and request identity' end;
  insert into platform_admin.audit(request_id,organization_id,environment,actor,action,detail) values(r.id,p_org,p_env,p_actor,'failed:'||coalesce(p_action,'unknown'),jsonb_build_object('error',err));
  return jsonb_build_object('error',err);
 end;
end $$;
revoke all on function platform_admin.operate(uuid,text,uuid,text,jsonb) from public,anon,authenticated;
grant usage on schema platform_admin to sms_admin_gateway;
grant execute on function platform_admin.operate(uuid,text,uuid,text,jsonb) to sms_admin_gateway;
commit;
