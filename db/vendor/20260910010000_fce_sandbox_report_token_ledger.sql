-- Provider-neutral FCE report-token ledger. Commercial data only: never store
-- patient, Evaluation Case, report, attachment, or clinical timestamp identity.

begin;

create table public.fce_sandbox_report_token_accounts (
  organization_id uuid primary key references public.organizations(id) on delete restrict,
  available_tokens integer not null default 0 check (available_tokens >= 0),
  reserved_tokens integer not null default 0 check (reserved_tokens >= 0),
  updated_at timestamptz not null default now()
);

create table public.fce_sandbox_report_token_reservations (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  quantity integer not null check (quantity > 0 and quantity <= 1000),
  remaining_tokens integer not null check (remaining_tokens >= 0 and remaining_tokens <= quantity),
  status text not null check (status in ('active', 'exhausted', 'released', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fce_sandbox_report_token_reservation_window check (expires_at > created_at)
);

-- Tombstones prevent a delayed reserve from allocating after cancellation.
create table public.fce_sandbox_report_token_cancellations (
  reservation_id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict
);
alter table public.fce_sandbox_report_token_cancellations enable row level security;
revoke all on public.fce_sandbox_report_token_cancellations from public, anon, authenticated;

create index fce_sandbox_report_token_reservations_active_index
on public.fce_sandbox_report_token_reservations (organization_id, expires_at)
where status = 'active';

create table public.fce_sandbox_report_token_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  event_key text not null unique check (event_key ~ '^[A-Za-z0-9:_-]{16,200}$'),
  event_type text not null check (event_type in (
    'purchase', 'subscription_allocation', 'pilot_allocation',
    'support_adjustment', 'refund', 'offline_reservation',
    'report_consumption', 'reservation_release'
  )),
  available_delta integer not null,
  reserved_delta integer not null,
  available_after integer not null check (available_after >= 0),
  reserved_after integer not null check (reserved_after >= 0),
  opaque_receipt text null check (opaque_receipt is null or opaque_receipt ~ '^fce-sandbox-report-receipt:[a-f0-9]{64}$'),
  reservation_id uuid null references public.fce_sandbox_report_token_reservations(id) on delete restrict,
  reason text null check (reason is null or char_length(reason) between 1 and 500),
  actor_id uuid null references auth.users(id) on delete set null,
  recorded_at timestamptz not null default now(),
  constraint fce_sandbox_report_token_ledger_effect check (available_delta <> 0 or reserved_delta <> 0),
  constraint fce_sandbox_report_token_ledger_receipt_scope check ((event_type = 'report_consumption') = (opaque_receipt is not null))
);

create index fce_sandbox_report_token_ledger_organization_index
on public.fce_sandbox_report_token_ledger_entries (organization_id, recorded_at desc, id);

create table public.fce_sandbox_report_token_consumptions (
  opaque_receipt text primary key check (opaque_receipt ~ '^fce-sandbox-report-receipt:[a-f0-9]{64}$'),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  reservation_id uuid null references public.fce_sandbox_report_token_reservations(id) on delete restrict,
  ledger_entry_id uuid not null unique references public.fce_sandbox_report_token_ledger_entries(id) on delete restrict,
  consumed_at timestamptz not null default now()
);

alter table public.fce_sandbox_report_token_accounts enable row level security;
alter table public.fce_sandbox_report_token_reservations enable row level security;
alter table public.fce_sandbox_report_token_ledger_entries enable row level security;
alter table public.fce_sandbox_report_token_consumptions enable row level security;

revoke all on table public.fce_sandbox_report_token_accounts from public, anon, authenticated;
revoke all on table public.fce_sandbox_report_token_reservations from public, anon, authenticated;
revoke all on table public.fce_sandbox_report_token_ledger_entries from public, anon, authenticated;
revoke all on table public.fce_sandbox_report_token_consumptions from public, anon, authenticated;

create function public.prevent_fce_sandbox_report_token_ledger_mutation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  raise exception using errcode = '42501', message = 'FCE report-token ledger is append-only';
end;
$$;

revoke all on function public.prevent_fce_sandbox_report_token_ledger_mutation() from public, anon, authenticated;

create trigger prevent_fce_sandbox_report_token_ledger_update
before update or delete on public.fce_sandbox_report_token_ledger_entries
for each row execute function public.prevent_fce_sandbox_report_token_ledger_mutation();

create trigger prevent_fce_sandbox_report_token_consumption_update
before update or delete on public.fce_sandbox_report_token_consumptions
for each row execute function public.prevent_fce_sandbox_report_token_ledger_mutation();

create function public.apply_fce_sandbox_report_token_adjustment(
  p_organization_id uuid,
  p_event_key text,
  p_event_type text,
  p_quantity_delta integer,
  p_reason text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  account_row public.fce_sandbox_report_token_accounts;
  existing_row public.fce_sandbox_report_token_ledger_entries;
begin
  if p_organization_id is null or p_event_key is null or p_event_type is null or p_quantity_delta is null or p_event_key !~ '^[A-Za-z0-9:_-]{16,200}$'
    or p_event_type not in ('purchase', 'subscription_allocation', 'pilot_allocation', 'support_adjustment', 'refund')
    or p_quantity_delta = 0 or abs(p_quantity_delta) > 100000
    or (p_event_type in ('purchase', 'subscription_allocation', 'pilot_allocation') and p_quantity_delta < 1)
    or (p_event_type = 'refund' and p_quantity_delta > -1)
    or (p_event_type = 'support_adjustment' and (p_reason is null or char_length(p_reason) not between 1 and 500)) then
    raise exception using errcode = '22023', message = 'FCE report-token adjustment is invalid';
  end if;

  -- Serialize same-organization operations BEFORE checking replay, then lock reservations.
  insert into public.fce_sandbox_report_token_accounts (organization_id) values (p_organization_id) on conflict do nothing;
  select * into account_row from public.fce_sandbox_report_token_accounts where organization_id = p_organization_id for update;
  select * into existing_row from public.fce_sandbox_report_token_ledger_entries where event_key = p_event_key;
  if found then
    if existing_row.organization_id <> p_organization_id or existing_row.event_type <> p_event_type or existing_row.available_delta <> p_quantity_delta then
      raise exception using errcode = '23505', message = 'FCE report-token event replay conflicts';
    end if;
    return jsonb_build_object('replayed', true, 'availableTokens', existing_row.available_after, 'reservedTokens', existing_row.reserved_after);
  end if;

  if account_row.available_tokens + p_quantity_delta < 0 then
    raise exception using errcode = '22003', message = 'FCE report-token balance is insufficient';
  end if;

  update public.fce_sandbox_report_token_accounts set available_tokens = available_tokens + p_quantity_delta, updated_at = now() where organization_id = p_organization_id returning * into account_row;
  insert into public.fce_sandbox_report_token_ledger_entries (organization_id, event_key, event_type, available_delta, reserved_delta, available_after, reserved_after, reason, actor_id)
  values (p_organization_id, p_event_key, p_event_type, p_quantity_delta, 0, account_row.available_tokens, account_row.reserved_tokens, p_reason, auth.uid());
  return jsonb_build_object('replayed', false, 'availableTokens', account_row.available_tokens, 'reservedTokens', account_row.reserved_tokens);
end;
$$;

create function public.reserve_fce_sandbox_report_tokens(
  p_organization_id uuid,
  p_reservation_id uuid,
  p_event_key text,
  p_quantity integer,
  p_expires_at timestamptz
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare account_row public.fce_sandbox_report_token_accounts; existing_row public.fce_sandbox_report_token_ledger_entries;
begin
  if p_organization_id is null or p_reservation_id is null or p_event_key is null or p_quantity is null or p_expires_at is null or p_event_key !~ '^[A-Za-z0-9:_-]{16,200}$' or p_quantity < 1 or p_quantity > 1000 or p_expires_at <= now() or p_expires_at > now() + interval '7 days' then raise exception using errcode = '22023', message = 'FCE report-token reservation is invalid'; end if;
  -- Serialize same-organization operations BEFORE checking replay, then lock reservations.
  insert into public.fce_sandbox_report_token_accounts (organization_id) values (p_organization_id) on conflict do nothing;
  select * into account_row from public.fce_sandbox_report_token_accounts where organization_id = p_organization_id for update;
  if exists (select 1 from public.fce_sandbox_report_token_cancellations where reservation_id = p_reservation_id) then raise exception using errcode = '23505', message = 'Sandbox reservation cancelled'; end if;
  select * into existing_row from public.fce_sandbox_report_token_ledger_entries where event_key = p_event_key;
  if found then
    if existing_row.organization_id <> p_organization_id or existing_row.event_type <> 'offline_reservation' or existing_row.reservation_id <> p_reservation_id or existing_row.available_delta <> -p_quantity then raise exception using errcode = '23505', message = 'FCE report-token event replay conflicts'; end if;
    return jsonb_build_object('replayed', true, 'availableTokens', existing_row.available_after, 'reservedTokens', existing_row.reserved_after, 'reservationId', p_reservation_id);
  end if;
  if account_row.available_tokens < p_quantity then raise exception using errcode = '22003', message = 'FCE report-token balance is insufficient'; end if;
  insert into public.fce_sandbox_report_token_reservations (id, organization_id, quantity, remaining_tokens, status, expires_at) values (p_reservation_id, p_organization_id, p_quantity, p_quantity, 'active', p_expires_at);
  update public.fce_sandbox_report_token_accounts set available_tokens = available_tokens - p_quantity, reserved_tokens = reserved_tokens + p_quantity, updated_at = now() where organization_id = p_organization_id returning * into account_row;
  insert into public.fce_sandbox_report_token_ledger_entries (organization_id, event_key, event_type, available_delta, reserved_delta, available_after, reserved_after, reservation_id)
  values (p_organization_id, p_event_key, 'offline_reservation', -p_quantity, p_quantity, account_row.available_tokens, account_row.reserved_tokens, p_reservation_id);
  return jsonb_build_object('replayed', false, 'availableTokens', account_row.available_tokens, 'reservedTokens', account_row.reserved_tokens, 'reservationId', p_reservation_id);
end;
$$;

create function public.consume_fce_sandbox_report_token(
  p_organization_id uuid,
  p_opaque_receipt text,
  p_event_key text,
  p_reservation_id uuid default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare account_row public.fce_sandbox_report_token_accounts; reservation_row public.fce_sandbox_report_token_reservations; existing_consumption public.fce_sandbox_report_token_consumptions; ledger_id uuid; available_change integer := 0; reserved_change integer := 0;
begin
  if p_organization_id is null or p_opaque_receipt is null or p_event_key is null or p_opaque_receipt !~ '^fce-sandbox-report-receipt:[a-f0-9]{64}$' or p_event_key !~ '^[A-Za-z0-9:_-]{16,200}$' then raise exception using errcode = '22023', message = 'FCE report-token consumption is invalid'; end if;
  -- Serialize same-organization operations BEFORE checking replay, then lock reservations.
  insert into public.fce_sandbox_report_token_accounts (organization_id) values (p_organization_id) on conflict do nothing;
  select * into account_row from public.fce_sandbox_report_token_accounts where organization_id = p_organization_id for update;
  select * into existing_consumption from public.fce_sandbox_report_token_consumptions where opaque_receipt = p_opaque_receipt;
  if found then
    if existing_consumption.organization_id <> p_organization_id or existing_consumption.reservation_id is distinct from p_reservation_id then raise exception using errcode = '23505', message = 'FCE report-token receipt replay conflicts'; end if;
    select * into account_row from public.fce_sandbox_report_token_accounts where organization_id = p_organization_id;
    return jsonb_build_object('replayed', true, 'consumed', 0, 'availableTokens', account_row.available_tokens, 'reservedTokens', account_row.reserved_tokens);
  end if;
  if p_reservation_id is null then
    if account_row.available_tokens < 1 then raise exception using errcode = '22003', message = 'FCE report-token balance is insufficient'; end if;
    available_change := -1;
  else
    select * into reservation_row from public.fce_sandbox_report_token_reservations where id = p_reservation_id and organization_id = p_organization_id for update;
    if not found or reservation_row.status <> 'active' or reservation_row.expires_at <= now() or reservation_row.remaining_tokens < 1 then raise exception using errcode = '22003', message = 'FCE report-token reservation is unavailable'; end if;
    reserved_change := -1;
    update public.fce_sandbox_report_token_reservations set remaining_tokens = remaining_tokens - 1, status = case when remaining_tokens = 1 then 'exhausted' else 'active' end, updated_at = now() where id = p_reservation_id;
  end if;
  update public.fce_sandbox_report_token_accounts set available_tokens = available_tokens + available_change, reserved_tokens = reserved_tokens + reserved_change, updated_at = now() where organization_id = p_organization_id returning * into account_row;
  insert into public.fce_sandbox_report_token_ledger_entries (organization_id, event_key, event_type, available_delta, reserved_delta, available_after, reserved_after, opaque_receipt, reservation_id)
  values (p_organization_id, p_event_key, 'report_consumption', available_change, reserved_change, account_row.available_tokens, account_row.reserved_tokens, p_opaque_receipt, p_reservation_id) returning id into ledger_id;
  insert into public.fce_sandbox_report_token_consumptions (opaque_receipt, organization_id, reservation_id, ledger_entry_id) values (p_opaque_receipt, p_organization_id, p_reservation_id, ledger_id);
  return jsonb_build_object('replayed', false, 'consumed', 1, 'availableTokens', account_row.available_tokens, 'reservedTokens', account_row.reserved_tokens);
end;
$$;

create function public.release_fce_sandbox_report_token_reservation(p_organization_id uuid, p_reservation_id uuid, p_event_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare account_row public.fce_sandbox_report_token_accounts; reservation_row public.fce_sandbox_report_token_reservations; existing_row public.fce_sandbox_report_token_ledger_entries; release_quantity integer;
begin
  if p_organization_id is null or p_reservation_id is null or p_event_key is null or p_event_key !~ '^[A-Za-z0-9:_-]{16,200}$' then raise exception using errcode = '22023', message = 'FCE report-token release is invalid'; end if;
  -- Serialize same-organization operations BEFORE checking replay, then lock reservations.
  insert into public.fce_sandbox_report_token_accounts (organization_id) values (p_organization_id) on conflict do nothing;
  select * into account_row from public.fce_sandbox_report_token_accounts where organization_id = p_organization_id for update;
  select * into existing_row from public.fce_sandbox_report_token_ledger_entries where event_key = p_event_key;
  if found then
    if existing_row.organization_id <> p_organization_id or existing_row.event_type <> 'reservation_release' or existing_row.reservation_id <> p_reservation_id then raise exception using errcode = '23505', message = 'FCE report-token event replay conflicts'; end if;
    return jsonb_build_object('replayed', true, 'availableTokens', existing_row.available_after, 'reservedTokens', existing_row.reserved_after);
  end if;
  select * into reservation_row from public.fce_sandbox_report_token_reservations where id = p_reservation_id and organization_id = p_organization_id for update;
  if not found or reservation_row.status not in ('active', 'exhausted') then raise exception using errcode = '22023', message = 'FCE report-token reservation is not releasable'; end if;
  release_quantity := reservation_row.remaining_tokens;
  if release_quantity < 1 then raise exception using errcode = '22023', message = 'FCE report-token reservation has no remainder'; end if;
  update public.fce_sandbox_report_token_reservations set remaining_tokens = 0, status = case when expires_at <= now() then 'expired' else 'released' end, updated_at = now() where id = p_reservation_id;
  update public.fce_sandbox_report_token_accounts set available_tokens = available_tokens + release_quantity, reserved_tokens = reserved_tokens - release_quantity, updated_at = now() where organization_id = p_organization_id returning * into account_row;
  insert into public.fce_sandbox_report_token_ledger_entries (organization_id, event_key, event_type, available_delta, reserved_delta, available_after, reserved_after, reservation_id)
  values (p_organization_id, p_event_key, 'reservation_release', release_quantity, -release_quantity, account_row.available_tokens, account_row.reserved_tokens, p_reservation_id);
  return jsonb_build_object('replayed', false, 'released', release_quantity, 'availableTokens', account_row.available_tokens, 'reservedTokens', account_row.reserved_tokens);
end;
$$;

create function public.get_organization_fce_sandbox_report_token_summary(p_organization_id uuid)
returns table (organization_id uuid, available_tokens integer, reserved_tokens integer, active_reservations bigint)
language plpgsql security definer set search_path = '' stable as $$
begin
  if not exists (select 1 from public.organization_users membership where membership.organization_id = p_organization_id and membership.user_id = auth.uid() and membership.status = 'active' and membership.role in ('organization_admin', 'billing_admin')) then raise exception using errcode = '42501', message = 'Organization FCE report-token access is not permitted'; end if;
  return query select account.organization_id, account.available_tokens, account.reserved_tokens, (select count(*) from public.fce_sandbox_report_token_reservations reservation where reservation.organization_id = p_organization_id and reservation.status = 'active' and reservation.expires_at > now()) from public.fce_sandbox_report_token_accounts account where account.organization_id = p_organization_id;
end;
$$;

revoke all on function public.apply_fce_sandbox_report_token_adjustment(uuid,text,text,integer,text) from public, anon, authenticated;
revoke all on function public.reserve_fce_sandbox_report_tokens(uuid,uuid,text,integer,timestamptz) from public, anon, authenticated;
revoke all on function public.consume_fce_sandbox_report_token(uuid,text,text,uuid) from public, anon, authenticated;
revoke all on function public.release_fce_sandbox_report_token_reservation(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.get_organization_fce_sandbox_report_token_summary(uuid) from public, anon, authenticated;
grant execute on function public.apply_fce_sandbox_report_token_adjustment(uuid,text,text,integer,text) to service_role;
grant execute on function public.reserve_fce_sandbox_report_tokens(uuid,uuid,text,integer,timestamptz) to service_role;
grant execute on function public.consume_fce_sandbox_report_token(uuid,text,text,uuid) to service_role;
grant execute on function public.release_fce_sandbox_report_token_reservation(uuid,uuid,text) to service_role;
grant execute on function public.get_organization_fce_sandbox_report_token_summary(uuid) to authenticated;


create function public.cancel_fce_sandbox_report_token_reservation(p_organization_id uuid, p_reservation_id uuid, p_event_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.fce_sandbox_report_token_reservations; owner_id uuid;
begin
  if p_organization_id is null or p_reservation_id is null or p_event_key is null or p_event_key !~ '^[A-Za-z0-9:_-]{16,200}$' then raise exception using errcode='22023', message='Sandbox cancellation invalid'; end if;
  insert into public.fce_sandbox_report_token_accounts(organization_id) values(p_organization_id) on conflict do nothing;
  perform 1 from public.fce_sandbox_report_token_accounts where organization_id=p_organization_id for update;
  select organization_id into owner_id from public.fce_sandbox_report_token_cancellations where reservation_id=p_reservation_id;
  if found then
    if owner_id <> p_organization_id then raise exception using errcode='23505', message='Sandbox cancellation scope conflict'; end if;
    return jsonb_build_object('cancelled',true,'replayed',true);
  end if;
  select * into r from public.fce_sandbox_report_token_reservations where id=p_reservation_id for update;
  if found then
    if r.organization_id <> p_organization_id then raise exception using errcode='23505', message='Sandbox cancellation scope conflict'; end if;
    if exists(select 1 from public.fce_sandbox_report_token_consumptions where reservation_id=p_reservation_id) then raise exception using errcode='23505', message='Sandbox consumption requires reconciliation'; end if;
    if r.status in ('active','exhausted') then
      perform public.release_fce_sandbox_report_token_reservation(p_organization_id,p_reservation_id,p_event_key);
    end if;
  end if;
  insert into public.fce_sandbox_report_token_cancellations values(p_reservation_id,p_organization_id);
  return jsonb_build_object('cancelled',true,'replayed',false);
end;
$$;
revoke all on function public.cancel_fce_sandbox_report_token_reservation(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.cancel_fce_sandbox_report_token_reservation(uuid,uuid,text) to service_role;

commit;
