-- Disable this tool without deleting audit or reverting accounting history.
begin;
revoke execute on function platform_admin.operate(uuid,text,uuid,text,jsonb) from sms_admin_gateway;
revoke usage on schema platform_admin from sms_admin_gateway;
commit;
