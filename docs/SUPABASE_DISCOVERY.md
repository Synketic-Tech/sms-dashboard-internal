# Task 1.6 — Supabase discovery and project boundary

September 16, 2026. Status: Live metadata inspection completed through the connected Supabase integration; remaining auth/environment and business-definition decisions are listed below. Task 1.6A–B remain open; Task 1.6C has a documented boundary design. No hosted configuration or customer rows were changed or retrieved.

## Verified live findings after connection

| Area | Internal project | Customer project |
| --- | --- | --- |
| Name / status | SMS Dashboard / ACTIVE_HEALTHY | Synketic / ACTIVE_HEALTHY |
| Region | us-east-1 | us-west-2 |
| PostgreSQL | 17.6.1.127 | 17.6.1.127 |
| Organization | Synketic Motion Systems, Pro plan | Same organization and plan |
| Application relations | No tables/views/materialized views found in public, internal, or platform_admin; full non-system schema inventory shows managed auth/storage/realtime/vault objects | Existing organization, membership, subscription, entitlement, token-accounting, and clinical schemas/tables; clinical rows not inspected |
| Migration / functions | No recorded migrations; no Edge Functions | No Edge Functions; hosted migration history not inspected in this pass |
| Development branches | None returned | Not inspected |
| RLS / advisors | No application tables to evaluate; security advisor returned no notices | All four selected business tables have RLS enabled; selected policies/grants inspected, not a full security audit |

Internal installed extensions: pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1, uuid-ossp 1.1. Cron is not currently installed. No existing application-table collision was found for the Task 1.5 model in the inspected schemas. Empty application schemas do not prove that auth/storage contain no users or records; those rows were not queried.

Customer metadata establishes these candidate mappings:

- `organizations`: `id`, `name`, `is_active`, `created_at`, `updated_at`, plus subscription status/tier. Use ID/name and dates only as needed; exclude tax IDs, contact/address fields, and free-text notes from the initial reporting projection.
- `organization_users`: unique organization/user pair, membership status and role, joined timestamp. These are customer memberships, not internal-dashboard grants; no member rows were read.
- `subscriptions`: organization/location scope, status, plan, currency/price, start/renewal/end dates, and external billing identifiers. Multiple scopes mean subscription counts cannot substitute for distinct customer counts. Price is not realized revenue.
- `organization_entitlement_grants`: capability, source, effective/expiry/revocation windows and status. These establish commercial access, not internal security authority. Only service_role table grants were returned for this table; no policies were returned.

Organizations SELECT uses `user_is_org_member(id)` and UPDATE uses `user_is_org_admin(id)` with matching checks. Membership SELECT permits the current user or active organization members. Subscription SELECT requires organization-admin membership. The inspected helper functions check `auth.uid()` against active customer memberships; the admin helper additionally requires `organization_admin`. Neither supplies cross-company executive access.

Membership/subscription tables have broad anon/authenticated table grants, with RLS providing row filtering. Do not treat these grants as authorization or copy them into the internal model. They warrant a separate customer-project privilege review before building reporting; this pass made no privilege changes and did not test customer impersonation. The helper functions use SECURITY DEFINER with configured search paths; a complete privilege/function audit remains outside this scoped inspection.

### Remaining discovery gaps

The connected tools do not expose the project's safe auth configuration fields. Signup, MFA enforcement, SMTP configuration, redirects, session settings, and exposed API schemas remain unverified. The stale local management token was not reused. A read-only authenticated settings inspection or refreshed management access is still needed for Task 1.6A.

Confirm whether SMS Dashboard is the intended production internal project and designate a separate test environment/operator before migrations. Pro plan status does not prove configured backups or a tested restore. No paid branch was created.

For Task 1.6B, the CEO still needs to select the business meaning of an active customer: active organization, paying subscription, or enabled product entitlement. `organizations.created_at` supports registration date, not necessarily first paid date. Historical retention cannot be inferred from current status plus `updated_at`; leave it unavailable until a trustworthy history source is confirmed. Schema inspection and a minimum-field proposal are complete; these semantic decisions remain open.

## Evidence and access status

| Item | Observation |
| --- | --- |
| Internal project | User-supplied reference `ehjygkfgiqdolhzqikhp`; intended internal backend. |
| Customer project | User-supplied reference `jegmluwodwkuibreedcj`; authoritative customer application remains separate. |
| Connector discovery | Supabase plugin exists but was reported not installed; installation/connection suggested, not confirmed. |
| Local tooling | Supabase CLI found; `SUPABASE_ACCESS_TOKEN` is present. Token value was not printed or stored. |
| Live access attempt | GET `https://api.supabase.com/v1/projects` returned HTTP 401. No project metadata response was available. This does not establish that either project is missing or inaccessible to the user. |
| Local source evidence | PA-01 contains copied customer ledger migrations and explicit organization/environment grants. These describe local source/fixtures only and do not prove hosted deployment. |

The initial 401 above was superseded by successful connector access. The local token remains unverified/invalid; no need to reinstall the connected integration. Do not paste credentials into documentation or chat. No browser login or project authentication setting was changed.

## Task 1.6A — Internal-project inspection checklist

Once access works, restrict inspection to the supplied project reference and collect:

- Project name, status, region, PostgreSQL version, and designated environment. A name/status alone cannot establish whether real production data exists; confirm environment purpose with the project manager.
- Application table/column/constraint/index metadata; RLS enablement, policy definitions, relevant role/table/function privileges, and existing migration version identifiers. Check all proposed names in DATA_MODEL.md for collisions.
- Auth configuration through an allowlisted projection: signup enabled/disabled, email verification, site/redirect origins, password policy, TOTP settings, session timeout configuration, and whether custom SMTP is configured. Never export SMTP passwords, signing secrets, provider client secrets, API keys, or auth user rows.
- Relevant installed extensions, exposed API schemas, and existing function metadata. Inspect specific function/policy definitions only as required; redact hardcoded identifiers or secrets if encountered.
- Plan/backup capabilities and migration owner, without making purchases or configuration changes.

`scripts/discovery/catalog.sql` is a prepared catalog-only first pass, not an exhaustive RLS/security review. It contains no application-row SELECTs or executable changes. Run against one verified project at a time with the management API's read-only option or an explicitly read-only database session. Keep results scoped and sanitize before recording them.

Development arrangement: retain the PA-01 fixture database unchanged; use a separate local Supabase development stack and a separately designated hosted non-production environment when needed. Do not reset, seed, or migrate either supplied project during discovery. The internal repository owns future internal migrations; confirm the real deployment operator before applying them.

## Task 1.6B — Minimum customer information

These are candidate reporting requirements, not verified columns or authorized bulk extracts.

| Business question | Minimum proposed projection | Visibility | Refresh / retention proposal |
| --- | --- | --- | --- |
| How many active customers do we have? | Aggregate count, agreed status definition, as-of time, coverage | CEO; sales only under approved summary scope | Daily; latest snapshot initially |
| How many joined this period? | Aggregate count, reporting period, agreed start-event definition | CEO and approved sales summary | Daily; latest snapshot per selected period |
| Are customers remaining active? | Opening cohort count, retained count, completed period | CEO; sales grant to be decided | Conditional on historical source support; do not invent history |
| Which customer needs business follow-up? | Organization ID, display name, business lifecycle status, relevant business timestamp | CEO; explicitly scoped sales view | Daily; no bulk member emails or clinical fields |
| Is the reporting connection healthy? | Connection state, last success/attempt, sanitized error code | CEO and IT | Operational history retention to be set in Task 5.5 |

Inspect schema metadata to identify organization identity, lifecycle fields, and historical status availability. Do not inspect customer records to guess their meaning. Customer/user/subscription counts are distinct. Resolve definitions with the CEO before enabling metrics.

Exclude patient, case, clinical report, assessment, artifact, encrypted clinical payload, raw authentication, and provider-secret fields. PA-01 directory/account inspection remains a separately granted support workflow; it is not a reason to import those fields into CEO reporting caches.

Retain only the latest successful reporting snapshot initially; mark stale or unavailable explicitly. Detailed retention and historical trend storage require a later decision. Disconnect should remove normal-view access immediately; cancellation/deletion policy follows Task 5.5. No production data should be copied to development or previews.

## Task 1.6C — Selected boundary design

Select a narrow reporting endpoint owned by the customer application, backed by reviewed reporting functions in the customer project. Provision a dedicated database role with execute permission only on these functions; functions must expose only the approved non-clinical projections. The internal server uses a dedicated, revocable machine credential restricted to this endpoint. No customer service-role key or broad SQL access belongs in the internal dashboard.

The endpoint accepts allowlisted metric identifiers and validated date ranges, returns versioned minimum-field projections with source/as-of/coverage metadata, and enforces its own service authorization. Use HTTPS with a dedicated high-entropy bearer credential stored only in server secret stores, with revocation/rotation and rate limits; never accept a customer session as this credential. The customer server holds the restricted database connection. The internal server separately enforces member permissions before serving a result. Requests carry correlation IDs without exposing member credentials. Endpoint implementation and credential provisioning are Task 6.6 work, not part of discovery.

Dashboard member IDs belong to the internal identity provider. Aggregate reporting does not require mapping each internal member to a customer user. PA-01 operations do require verified actor mapping and explicit organization/environment grants, with mutations remaining in the ledger-owning database and production application disabled. Do not route token adjustments through the reporting interface.

Customer-side schema/interface changes belong to the customer repository and a separately scoped review. Internal schema changes belong here. Keep independent versioned migrations and deploy the compatible read-only source interface before the dependent internal adapter. No distributed transaction or direct cross-project foreign key is assumed.

## Completion and resumption

1. Verify authenticated access to both exact project references.
2. Run catalog-only inspection; inspect safe auth configuration and relevant policies/grants.
3. Record verified facts, missing source fields, and collisions against the logical model.
4. Confirm environment purpose, migration ownership, customer definitions, and scoped reporting transport.
5. Update Task 1.6 subtasks only when their required evidence exists. Live metadata and Task 1.6C boundary design are now recorded; auth/environment and business semantics above remain unresolved.

Task 2.1's sample-only application shell can proceed independently while live discovery is pending. Authentication implementation and hosted migrations must not treat this prepared document as completed discovery.

Reference: [Supabase management query API](https://supabase.com/docs/reference/api/v1-run-a-query) documents the `read_only` query option; [project listing](https://supabase.com/docs/reference/api/v1-list-all-projects) is the initial endpoint attempted. Subsequent connected-tool queries were SELECT-only catalog queries, with no application-row reads. The Supabase changelog index was also checked before inspection.
