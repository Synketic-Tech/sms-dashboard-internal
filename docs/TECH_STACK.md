# Task 1.3 — Technology stack decision

September 16, 2026. Status: Selected implementation baseline; no dependencies installed, services purchased, deployment created, or hosted configuration changed by this task. Revisit through the project-manager decision log when requirements change.

## Selected stack

| Layer | Selection | Reason and tradeoff |
| --- | --- | --- |
| Dashboard | Next.js App Router, React, TypeScript in `apps/dashboard` | One application for UI and server endpoints; typed domain contracts. More framework lifecycle maintenance than the small existing HTTP prototype. |
| UI | CSS Modules plus shared CSS design tokens; native semantic controls initially | Supports the early CEO UI review without committing to a large component/theme system. Add accessible specialist components only when needed. |
| Runtime/package management | Node.js 24 baseline and npm lockfile | Aligns with the local prototype's documented runtime. Verify supported patched versions and pin compatible packages when scaffolding. |
| Database | Existing internal Supabase PostgreSQL project `ehjygkfgiqdolhzqikhp` | Central storage for internal membership, permissions, content, goals, sync metadata, and audits, subject to Task 1.6 discovery. |
| Data access | `@supabase/supabase-js`, generated database types, versioned SQL migrations | Keeps RLS and SQL transactions explicit. No additional ORM initially. Multi-write invariants belong in transactional database functions. |
| Identity | Supabase Auth in the internal project; `@supabase/ssr` for the Next.js session integration | Invitation-only email/password login plus TOTP MFA. Membership is separately enforced. |
| Web hosting | Vercel Pro, planned target | Managed Next.js deployments reduce operations for the three-person team; incurs recurring/usage costs. No subscription or deployment is authorized by this document alone. |
| Scheduled sync | Supabase Cron invoking authenticated TypeScript Edge Function workers | Scheduling and durable sync records near the data; introduces a second runtime boundary and bounded execution constraints. |
| Verification | TypeScript checks, ESLint, Vitest for domain logic, Playwright for dashboard workflows, isolated SQL/RLS tests | Test access boundaries and real behavior. Preserve existing Node/PostgreSQL admin tests independently. |
| CI | GitHub Actions | Run clean install, checks, tests, and dashboard production build. Keep database integration checks explicit when their isolated prerequisites are unavailable. |

Next.js supports Node-server deployment, so the hosting choice does not require a Vercel-only application architecture. Static export is unsuitable for the planned authenticated server endpoints. See [Next.js deployment options](https://nextjs.org/docs/app/getting-started/deploying).

## Existing application and preservation strategy

Current `package.json` runs the local PA-01 Node HTTP server and its PostgreSQL tests using `pg`. `server.mjs` deliberately binds to localhost, uses fixture keys, and calls the restricted database gateway. These are current observed files, not the future dashboard authentication system.

Task 1.4 should add the dashboard as a separate package in `apps/dashboard`, with its own lockfile initially. Preserve root `npm.cmd start`, `npm.cmd test`, `server.mjs`, `public`, `db`, and existing tests. Add clearly named dashboard commands if useful; do not replace the admin commands or publish the root prototype on Vercel. Configure the future deployment root to `apps/dashboard`.

Do not copy fixture sessions, mock approvals, seed records, or local gateway configuration into the dashboard. Port any admin workflow only through a later bounded task that preserves its explicit actor/organization/environment grants and production restrictions. A CEO role alone is not a Platform Administration grant.

## Authentication and authorization design

Use Supabase's request-scoped SSR client pattern and server-validated identity; do not trust browser session data or UI role selectors as authorization. The SDK's cookie/session integration needs to follow the current [official Next.js SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs).

Disable public self-enrollment when configuring the real project. Implement the approved invitation policy with an application invitation record and atomic membership acceptance. Identity-provider invitations do not alone establish the required role grant, inviter checks, email binding, and 72-hour lifecycle.

Require TOTP enrollment and verified MFA assurance before business-data access; allow only the minimal enrollment/recovery screens beforehand. Enforce MFA in server/data policies as appropriate, not just in the UI. Supabase documents both enrollment and the need to enforce assurance in authorization. See [MFA documentation](https://supabase.com/docs/guides/auth/auth-mfa).

Keep current membership and permissions in internal database records and check them on protected requests, including any server path with elevated credentials. RLS protects client-accessible tables; narrowly scoped functions handle transactional invariants. Do not use a privileged key for ordinary member reads. Personalized responses must not enter shared public caches.

Session design baseline: eight-hour absolute application session, 30-minute inactivity timeout, and reauthentication within five minutes for role changes or connection authorization. Enforce these server-side if the selected account tier cannot enforce them natively. Tokens alone cannot preserve access after membership deactivation. Provider-native recovery and secure SMTP are required before real invitations; mail-provider selection and named founder-recovery operator remain rollout dependencies, not reasons to block a sample UI.

## Environments and customer-project boundary

- Local dashboard starts with synthetic, explicitly labeled data. Sample mode must not be deployable as an authenticated production data source by accident.
- Use a separate isolated local Supabase development stack for schema/auth tests once tooling is available; do not reuse or reset the PA-01 PostgreSQL database.
- Use a distinct non-production Supabase environment for hosted previews that need data. Never attach arbitrary preview builds to real company/customer records. A sample-only preview can precede that environment.
- Internal hosted project's current environment purpose, schema, plan, region, and auth configuration remain unverified. Task 1.6 precedes any migrations or real identity setup.
- Customer project `jegmluwodwkuibreedcj` remains separately owned. Access only an approved server-side reporting interface with minimum fields. Do not share sessions, assume equal user IDs, place customer privileged credentials in a browser, or create a broad cross-project database connection by default.
- Keep secrets in environment-specific server secret stores; publishable project configuration is distinct from privileged credentials. Commit examples containing names/placeholders only.

## Background jobs and integrations

Use Cron as a trigger, not the durable job state. Workers authenticate the trigger, claim a per-provider job lease, fetch a bounded page/batch, persist results and cursor atomically, and record attempt/success timestamps. Store retry count and next eligible run; back off for transient failures and rate limits. Expired leases permit recovery. Duplicate triggers must be harmless through idempotent writes and job uniqueness constraints.

Manual refresh enqueues eligible work; it does not run an unbounded import in a web request. Provider tokens stay server-side in protected storage; grant workers only the scopes needed. No member's session token is used as a scheduler credential. Webhooks, when added, require provider signature verification and deduplication.

[Supabase Cron](https://supabase.com/docs/guides/cron) can invoke HTTP functions and records scheduler runs. [Edge Function limits](https://supabase.com/docs/guides/functions/limits) require short, resumable workers. Keep business sync status separate from trigger status. If discovery shows a workload cannot fit these limits, move that adapter to a dedicated worker while retaining the same durable job contract; do not add a second queue platform in advance.

## Operational fit and cost

The selected stack concentrates persistent state and identity in Supabase, with managed web hosting. Costs still depend on existing account subscriptions, compute, storage, egress, function usage, developer seats, SMTP, and any extra preview environment. Three dashboard members are not necessarily three hosting developer seats.

- Vercel Hobby is designated for personal/non-commercial use; plan commercial hosting on Pro. Verify the team's exact seat and usage quote before provisioning. See [Vercel pricing](https://vercel.com/pricing).
- Supabase currently lists Pro from $25/month with additional project/usage costs. This is a published starting price, not an estimate of incremental cost for the supplied projects. Free projects may pause after inactivity; verify the existing paid organization and project allocation before rollout. See [Supabase pricing](https://supabase.com/pricing).
- Initial development can use local sample data without purchasing hosting. Define a spending threshold and usage alerts when provisioning; do not assume unlimited jobs or free staging.

Source pages checked September 16, 2026. Recheck pricing and runtime compatibility at provisioning/install time. Current hosted configuration and account bills were not inspected.

## Alternatives considered

| Alternative | Decision |
| --- | --- |
| Extend the raw Node/vanilla JS prototype for the whole dashboard | Retain it for PA-01; a multi-page role-aware dashboard benefits from the selected typed UI/server framework. Avoid rewriting validated admin behavior during scaffolding. |
| Vite SPA plus a separate API | Feasible, but adds separate routing/session/API deployment concerns without a present requirement. |
| Self-host Next.js on a Node server | Portable fallback if managed hosting cost or policy is unsuitable; adds patching, process supervision, TLS, and deployment responsibilities. |
| Separate identity provider or custom passwords | Supabase is already the intended backend; extra identity infrastructure is unnecessary initially. |
| ORM, Redis, external queue, full UI kit | Defer until demonstrated need; explicit SQL and bounded durable jobs cover the initial scope. |

## Handoff and completion

Task 1.3 is complete as a stack decision. Task 1.4 can scaffold `apps/dashboard`, pin compatible versions, document local commands, add placeholder environment examples and CI, and verify a sample-only build without hosted credentials. Phase 2 then creates the reviewable CEO UI.

Task 1.6 resolves hosted environment/schema and customer interface facts before live access. Phase 3 implements/tests the approved authorization and session policies. Phase 5 verifies provider workloads and protected credential storage. Phase 7 verifies hosting costs, SMTP, recovery ownership, backups, and rollout readiness. Platform Administration's unresolved real-email approval and disabled production adjustments remain separate.

This task changed documentation only. No runtime/build/authorization checks were executed or claimed for the selected stack; source review and documentation consistency are the evidence for this decision.
