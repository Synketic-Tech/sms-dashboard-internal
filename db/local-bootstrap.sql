-- LOCAL TEST ONLY. Minimal dependencies, not the hosted schema.
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
do $$ begin
 if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
 if not exists(select from pg_roles where rolname='service_role') then create role service_role; end if;
 if not exists(select from pg_roles where rolname='sms_admin_gateway') then create role sms_admin_gateway login; end if;
end $$;
create table public.organizations(id uuid primary key,name text,organization_type text);
create table public.organization_users(organization_id uuid,user_id uuid,status text,role text);
