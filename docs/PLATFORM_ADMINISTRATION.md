# Platform Administration — PA-01 local vertical slice

Implemented September 15, 2026. This is a running local application backed by PostgreSQL, with synthetic identities and accounting fixtures. It is not a hosted integration or production-ready authentication system. Production token application is unconditionally disabled in the database function. No hosted migrations, real emails, payments, clinical functionality, or FCE Task 9H changes were made.

## Purpose and who can use the tool

Access policy documented September 16, 2026, following project-manager approval of Task 1.2. Platform Administration supports non-clinical organization lookup, token-account and ledger inspection, and audited token-adjustment requests. The local sandbox can preview and apply an approved adjustment through the ledger workflow; it never directly overwrites balances or changes reserved tokens.

| Person / role | Access policy | Current implementation |
| --- | --- | --- |
| Founder, CEO | Intended administrator, with an explicit grant for each authorized organization and environment | Synthetic owner fixture can access both fixture organizations in both environment selections; production application is disabled. |
| IT/systems architect | Intended technical-support administrator, limited to explicitly granted organizations and environments | Synthetic architect fixture can access Synthetic Acme in both environment selections; Synthetic Restricted is denied. Production application is disabled. |
| Sales director | No default Platform Administration access | No sales administrator fixture or automatic dashboard-role grant. |
| Other internal members or customer users | No access by default; dashboard membership or a customer subscription is insufficient | Every scoped operation requires an explicit actor/organization/environment grant. |

Real users have not been provisioned. Job titles and dashboard roles alone never grant tool access. Future grants must identify the verified person, authorized organization, and environment; the Founder/CEO authorizes their scope, with grant changes and revocations audited. Removing internal membership must remove tool access when production identity integration is implemented. The current local keys are test credentials, not real user accounts.

Authorized operators can inspect only the permitted non-clinical fields described below. They can create and preview requests within their grant scope; sandbox application additionally requires the existing request-bound mock-approval workflow. Neither administrator can bypass approval, clinical-data restrictions, or the production write gate. Selecting the production environment currently refers to local production-shaped fixtures, not a connection to the live customer system.

The project manager's approval of dashboard roles and personal-goal privacy does not settle the separate real-email approver question or authorize production token adjustments. The deployment prerequisites below remain in force.

## Source inspection and architecture

This checkout initially contained only README, FIRST_RELEASE_REQUIREMENTS and DEVELOPMENT_PLAN. There was no application stack, authentication, schema or installed provider integration to extend. The small Node HTTP server and PostgreSQL gateway establish a bounded runnable slice without changing the proposed CEO dashboard roadmap.

Read-only inspection of the adjacent `synketic-dashboard` found:

| Source | Finding and reuse |
| --- | --- |
| `supabase/migrations/20260901010000_fce_report_token_ledger.sql` | Organization accounts hold separate available/reserved counts. Append-only ledger, purchase/support adjustment/reservation/consumption/release RPCs. Mutations granted to service_role, not customers. Production ledger replay check precedes account lock; broad concurrency qualification remains necessary before any future production integration. |
| `supabase/migrations/20260910010000_fce_sandbox_report_token_ledger.sql` | Separate sandbox tables and RPCs. Account lock before replay; adjustment affects available only. Copied unchanged into `db/vendor` and executed locally. |
| `lib/billing/fce-token-ledger-routing.ts` | Existing routing depends on trusted deployment/billing configuration, not browser authorization. This tool chooses from a closed environment set and independently checks explicit administrator grants for that environment. |
| `app/api/fce/sandbox-tokens/route.ts` | Validates authenticated identity, internal test allowlist, active organization membership and organization assertion before server RPC. It does not expose a funding action. This new administration endpoint is separate. |
| `lib/supabase/service.ts` | Privileged Supabase credentials are server-only. This slice instead uses a dedicated PostgreSQL login with only gateway execute permission. |
| `lib/domain/product-access.ts` | `canAccess` checks commercial capability entitlements. It is never an administration permission. |
| `lib/billing/fce-stripe-token-adapter.ts` | Stripe purchase/refund commands have their own signature, event identity and payment validation; the inspected adapter denies live-mode events. Administration uses `support_adjustment` and a category, not a simulated purchase. |
| `docs/task-12-sandbox-token-accounting.md` | Prior sandbox implementation and qualification boundaries; source is not evidence of hosted deployment. |

Vendor hashes and original paths are in `db/vendor/source-register.json`. No files in the customer project were edited. Hosted Supabase schema/auth configuration was not inspected; this slice intentionally has no hosted client. The copied migrations and minimal dependency schema are the actual local test baseline, not a full Supabase clone.

## Permission model and data boundary

Every HTTP operation requires a server-owned, one-hour session established with a random local fixture key. Same-origin JSON, a session-bound CSRF token, HttpOnly/SameSite cookie, request-size limits and login throttling protect the local server. It binds only to 127.0.0.1 and refuses alternate database configuration. Static shell files contain no operational records or credentials. Local keys are not Supabase identities or MFA; they must be replaced before deployment.

The server supplies actor identity; client-supplied identity is ignored. PostgreSQL independently checks `(actor, organization, environment)` grants for every scoped operation. Lookup returns only authorized organizations. No implicit owner/job-title/customer/subscription authority exists. The initial fixtures represent owner and architect; the architect lacks access to the second organization so isolation can be exercised. Real identities and grants remain to be provisioned explicitly.

The gateway role has no direct table access or ledger mutation execute permission. `platform_admin.operate` uses a fixed search path, parameterized values, and environment-selected table names from a closed list. Customer `anon`/`authenticated` roles cannot execute it. Its owner is a migration administrator locally; a production deployment must use a reviewed function-owner role and audit inherited/PUBLIC privileges. The trusted gateway can assert an actor, so its credential is a security boundary and never belongs in a browser.

Permitted output: organization UUID/name, directory user email, account totals/timestamps, commercial event type/deltas/post-balances/timestamps, reservation quantity/remainder/status/expiry, administration requests and audits. No joins or routes access patient/case/report/clinical tables. Opaque receipts and reservation identifiers are omitted from inspection. Free-text reasons from the pre-existing ledger are omitted. New administrator reasons are operational text only; the app cannot semantically guarantee that a person will never paste clinical text. Operators must follow the no-clinical-data instruction, and production data handling needs review.

Latest-100 history is explicitly bounded; lookup is limited to 50 organizations. Empty history means no returned records; missing account data remains unavailable, never zero. Reads are current database snapshots, not a completeness claim about upstream systems. Failed administrator commands and unresolved requests are inspectable. Upstream failures that never reached these ledgers, Local-device recovery queues and clinical artifact diagnostics are not imported; their status is unavailable.

## Adjustment and approval contract

Create persists a UUID request/idempotency identity, explicit organization/environment, nonzero integer delta bounded to ±100000, mandatory reason (1–400 characters), category, requester and timestamps. Organization/environment cannot be edited; create a new request for a different target. Editing amount/category/reason increments revision, clears approval and records before/after request details. A reused creation identity with a changed payload conflicts.

Preview reads balance and predicts available-after while preserving reserved tokens. It does not mutate balances. Account lock and sufficient-available validation are repeated at application time. Preview balances may change due to normal use before application; approval binds to the exact adjustment rather than a promised final balance.

Mock approval uses a random challenge stored only as SHA-256, expires after 15 minutes and is bound through the locked request and revision. Issuing a new challenge invalidates the earlier one. Confirmation consumes the challenge; application separately consumes the approved state. Opening a URL cannot confirm or execute. Confirmation and application require explicit POST actions. Expiry is checked again after waiting for the account lock. The local sandbox fixture deliberately exercises requesting-administrator confirmation; this is not a decision about real email policy.

The owner was asked whether email confirmation must come from the requesting administrator, affected customer, or both. No answer has been recorded. Real email delivery and production approval/application remain disabled. A both-party policy would require independently attributed approvals and recipient identity validation before production activation; do not treat this single-approver fixture as satisfying it.

Application locks the request and existing sandbox account, calls the original `apply_fce_sandbox_report_token_adjustment` with event type `support_adjustment`, and atomically persists result plus audit. Ledger event key is `platform-admin:<request UUID>`. Concurrent same-request retries return the original result; distinct requests serialize on the account. Failed adjustments roll back changes, record a sanitized error when the transaction can complete, and preserve the request for recovery. Connection loss/database outage cannot guarantee a failure audit; inspect the durable request and retry with its original identity.

Categories distinguish internal test grants, support corrections and approved removals. Internal test grants must be positive; approved removals negative. The environment distinguishes sandbox from proposed production test grants. No payment record or subscription change is made. Token balance alone does not satisfy commercial capability entitlements, internal test configuration, organization membership or server authorization. Those independent existing checks are not bypassed by this tool. Real production test grants can be requested/previewed locally but cannot be applied.

## Local operator guide

Requirements: Node 24, npm, PostgreSQL 18 on 127.0.0.1 with local bootstrap administrator access. On this machine the existing local pgpass configuration supplies setup/test credentials. No credential is committed.

```powershell
npm.cmd ci
npm.cmd run db:setup
npm.cmd test
npm.cmd start
```

Setup creates only `sms_platform_admin_local`, refuses to overwrite an existing database, and creates the `sms_admin_gateway` local role if absent. Do not rerun setup against the existing instance. Open http://127.0.0.1:4317 and use `ownerKey` or `architectKey` from ignored `.local/config.json`. These keys authorize synthetic local data only. Never commit that file or use these fixture keys for deployment.

1. Select environment and search `Synthetic Acme` or `operator@example.invalid`. Confirm the organization UUID.
2. Inspect available/reserved counts, ledger and reservation history.
3. Enter amount/category/reason; save and review the exact preview.
4. In sandbox, create MOCK approval, explicitly confirm MOCK approval, then apply. No email is sent at any step.
5. Inspect the result and audit. Refresh or resume a request from its button. Applied requests are immutable; create a separate corrective request if needed.

After an uncertain response, refresh and resume the same request. Do not create another request to retry a potentially committed change. An expired approval requires a new challenge. An insufficient-balance error means the requested removal exceeds available tokens; reduce the request and approve the new revision. Reserved tokens remain unavailable for removal. For a revision conflict, refresh and resume the current request before editing. Form inputs survive recoverable fetch/session errors while the page stays open; persisted requests survive server restart. Unsaved text does not survive tab closure/reload and is not stored in browser storage.

## Synthetic-data and configuration register

| Item | Current fixture | Replacement before live use |
| --- | --- | --- |
| Identity | UUIDs `00000000-0000-4000-8000-000000000001/2`; random owner/architect keys | Verified internal identity provider sessions, approved real subject IDs, MFA/re-authentication policy, secure HTTPS cookies |
| Directory | Synthetic Acme / Synthetic Restricted, `example.invalid` emails, UUIDs beginning `10000000` | Reviewed non-clinical organization/user projection from the authoritative customer identity source |
| Authorization | Explicit fixture grants for both environments; architect only Acme | Independently approved real actor/org/environment grants and revocation process |
| Database | Local minimal auth/users/organizations/membership definitions plus two unchanged ledger migrations | Inspect authoritative hosted schema, qualify migration drift and cross-project identity mapping |
| Accounts | Each organization seeded with sandbox 100 and production-fixture 20 via ledger allocation RPCs | Never seed live balances from fixtures; read authoritative accounts |
| Reservations/consumption | Acme reserves 10 for six days, consumes one available token using an all-a opaque receipt | Read existing commercial ledger fields only |
| Test records | Tests create random UUID requests, purchases, reservations, consumption, failures and audit rows; retained locally and identified by Synthetic reasons / generated event keys | Never migrate test rows; reconcile real operations under reviewed source adapters |
| Browser fixture | `5052b775-4ba9-491e-9d6b-b2bbd2d1fa60`, +3 sandbox tokens, reason `Synthetic browser acceptance grant` | Acceptance evidence only; do not copy |
| Privacy canary | Empty `public.synthetic_patient_canary` used solely to prove denied table access | No clinical test data needed or allowed |
| Approval | In-browser mock challenge; requesting-administrator confirmation; 15-minute expiry | Confirm business policy, verified recipient mapping, real delivery/outbox, separate approvals if required; remove mock endpoints |
| Configuration | `.local/config.json`, localhost:4317, fixed local database; package lock pins dependencies | Reviewed server secret store, trusted environment mapping, session lifecycle and deployment configuration |
| Upstream diagnostics | No Local recovery queue or provider failure source | Non-clinical, scoped diagnostic projection if separately approved; continue showing unavailable until then |

## Acceptance evidence and limits

`npm.cmd test`: 12/12 tests passed on Node 24.11.1 / PostgreSQL 18.4. Actual database connections exercised table/RPC privilege denial, customer denial, actor spoofing via HTTP, cross-organization/environment isolation, read-only production preview/gate, tampering, requester binding, edit invalidation, expiry/replay, six concurrent creates, eight concurrent applications, competing removals, post-lock expiry, audit completeness/immutability, insufficient available funds, and existing purchase/reserve/consume/release/retry compatibility. Reserved balance stayed unchanged for adjustments. A clinical-table canary was inaccessible. Additional checks verified snapshot hashes, missing-account nulls, immediate grant revocation and transactional rollback-disable behavior. Source snapshot tests do not qualify all production privileges or the full customer application.

Browser acceptance completed through the rendered UI: local sign-in, user-email lookup, account inspection, request/preview, mock issue/confirm and sandbox application. Available moved 111 → 114 and reserved stayed 10; result and audit showed the same request and identities. Automated suite initially had one unsupported-operation error-message expectation failure; the gateway now explicitly rejects unknown actions and all tests pass. A pgpass deprecation warning is non-fatal.

Not verified: hosted Supabase schema/auth/RLS, real emails or recipient ownership, real owner/architect identities, real Stripe checkout, physical Local-device recovery, exhaustive lock graphs, full FCE clinical/application regression, deployment rollback on hosted infrastructure, and production application. These are activation dependencies, not completed functionality.

## Deployment and rollback plan

1. Keep production writes disabled. Decide email confirmation policy and real administrators/organization scopes. Review this migration with the systems architect; local implementation review is not independent security sign-off.
2. Read-only inspect actual internal/customer Supabase schema, auth issuers, token RPC versions and grants. Decide the trusted identity bridge: requests/ledger transaction must execute in the database that owns the ledger. Do not treat an internal-project subject as a customer-project auth subject without verified mapping.
3. Replace fixture login/directory and implement the approved email policy with verified recipients, durable delivery/retry state and token redaction. Remove mock operations in deployable builds. Use least-privilege function ownership and gateway role, audit all inherited/PUBLIC execute rights, configure TLS and revoke customer execution. Do not give the gateway service_role or table access.
4. Rehearse `db/001-platform-admin.sql` on an isolated schema-matched clone. Existing vendor migrations are dependencies, not migrations to rerun on a hosted system. Review production ledger concurrency separately; the current application has no production apply path. Re-run qualification with real identity-verification adapters, revocation, email expiry and scanner-prefetch tests, and original token regression suites.
5. Obtain explicit authorization for hosted migration and real email delivery. Deploy a read-only/request-preview stage first. Inspect grants and audit results. Production application requires a separately reviewed code/migration change and explicit activation authorization; no environment switch in this build can enable it.

Rollback: stop the administration server and revoke gateway execution using `db/rollback-disable.sql`; retain requests, audit and token ledger unchanged. Rehearse the revoke inside a transaction in a local clone before deployment. Do not delete history or overwrite balances to roll back an adjustment. An incorrect applied adjustment requires a separately requested, approved compensating ledger entry after checking available funds. Restore executable access only through a reviewed deployment. Local test database removal is optional operator cleanup, not part of automatic setup or rollback.
