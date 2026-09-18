-- Task 1.6: catalog metadata only. NOT a migration.
-- Verify project identity before execution. No application/customer rows read.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '15s';

SELECT current_database() AS database_name, current_setting('server_version') AS postgres_version;

SELECT n.nspname AS schema_name, c.relname AS relation_name,
       c.relkind AS relation_kind, c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE 'pg_%'
  AND c.relkind IN ('r', 'p', 'v', 'm')
ORDER BY 1, 2;

-- Inspect column names/types only for candidate business schemas.
SELECT table_schema, table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema IN ('public', 'internal', 'platform_admin')
ORDER BY table_schema, table_name, ordinal_position;

-- Policy names/roles are safe inventory; review expressions separately and redact literals.
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_catalog.pg_policies
WHERE schemaname IN ('public', 'internal', 'platform_admin')
ORDER BY schemaname, tablename, policyname;

SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema IN ('public', 'internal', 'platform_admin')
  AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')
ORDER BY table_schema, table_name, grantee, privilege_type;

SELECT extname, extversion FROM pg_catalog.pg_extension ORDER BY extname;

ROLLBACK;
