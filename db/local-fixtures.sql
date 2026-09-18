-- Entirely synthetic, local-only. Never run against hosted Supabase.
insert into auth.users values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
insert into public.organizations values ('10000000-0000-4000-8000-000000000001','Synthetic Acme','test'),('10000000-0000-4000-8000-000000000002','Synthetic Restricted','test');
insert into platform_admin.directory values ('10000000-0000-4000-8000-000000000001','Synthetic Acme',array['operator@example.invalid']),('10000000-0000-4000-8000-000000000002','Synthetic Restricted',array['restricted@example.invalid']);
insert into platform_admin.grants select u.id,o.id,e from auth.users u cross join public.organizations o cross join unnest(array['sandbox','production']) e where u.id='00000000-0000-4000-8000-000000000001' or o.id='10000000-0000-4000-8000-000000000001';
select public.apply_fce_sandbox_report_token_adjustment(id,'synthetic:seed:'||id,'pilot_allocation',100,null) from public.organizations;
select public.apply_fce_report_token_adjustment(id,'synthetic:seed:'||id,'pilot_allocation',20,null) from public.organizations;
select public.reserve_fce_sandbox_report_tokens('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','synthetic:reservation:0001',10,now()+interval '6 days');
select public.consume_fce_sandbox_report_token('10000000-0000-4000-8000-000000000001','fce-sandbox-report-receipt:'||repeat('a',64),'synthetic:consumption:0001',null);
