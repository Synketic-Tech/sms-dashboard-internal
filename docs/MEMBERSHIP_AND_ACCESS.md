# Task 1.2 — Membership and data visibility

Prepared September 16, 2026. Status: Policy baseline approved by the project manager September 16, 2026. Lifecycle design is documented; no production authorization or authentication implementation is claimed.

The Founder, CEO has comprehensive business visibility and management authority. Sales and IT have useful role-specific access. These application roles remain separate from infrastructure access, customer billing entitlements, and Platform Administration grants.

## Task 1.2A — Role permissions

Roles group explicit permissions; one member may hold multiple roles. Every request requires a verified identity, active internal membership, the relevant permission, and any record scope. Missing grants deny access. Grants from multiple roles combine, but never override inactive membership, private-goal rules, or Platform Administration restrictions.

| Capability | Founder, CEO | Sales director | IT/systems architect |
| --- | --- | --- | --- |
| Executive/business information | All available business domains and approved supporting detail | Sales/customer information and explicitly granted financial summaries | Operational information and redacted diagnostics |
| Company content | Create, view, edit, archive all business content | View shared content; maintain sales content | View shared content; maintain technical/support content |
| Company goals | Create, assign, edit, reprioritize, complete, archive | View shared/assigned goals; update progress, blockers, status on assigned goals | Same as sales |
| Restricted company goals/content | All business records | Explicitly granted records only | Explicitly granted records only |
| Operational issues | Manage all | Create issues; update own/assigned issues | Create issues; update own/assigned issues |
| Personal goals | Own goals and explicitly shared goals | Same | Same |
| Invitations and membership | Invite, revoke invitations, change roles, deactivate/reactivate | None | View minimal member/support status; initiate recovery through established flow |
| Financial detail | Full required business access | No raw financial records by default | No raw financial records by default |
| Sales/customer records | Full approved business scope | Approved sales/customer scope | No customer records from support role alone |
| Provider connections | Authorize scope, connect/disconnect, maintain | None | Retry sync and maintain approved connections; scope changes/disconnect require CEO authority |
| Audit | Business/security administration events, excluding private goal contents | Own relevant business activity | Redacted support and integration events |
| Platform Administration | Separate explicit organization/environment grant required | No default grant | Separate explicit organization/environment grant required |

Proposed initial role identifiers are `founder_ceo`, `sales_director`, and `systems_architect`. Examples of distinct capabilities are `members.manage`, `finance.read`, `sales.read`, `customers.read`, `company_content.manage`, `company_goals.manage`, `connections.maintain`, and `connections.authorize`. Record-scoped operations such as assigned-goal updates still require ownership/assignment checks. The final permission catalog belongs with the implementation and schema in Tasks 1.5 and 3.3.

### Scope and editing rules

- Shared company content is readable by all active internal members. Restricted content names permitted roles/members; the CEO retains business access. Editors may not expand visibility beyond their authority. Sales/technical content editing does not permit editing strategy or membership policy.
- Company goals are shared by default. Restricted goals are visible to the CEO, the assigned owner, and explicitly granted members. Only the CEO changes assignment, scope, target, deadline, or archive state; assignees update progress, blockers, and status. Reassignment removes access derived solely from the previous assignment.
- Sales financial summaries start with no grant. The CEO selects named summaries and their fields before enabling them; granting a summary does not grant its underlying transactions.
- Customer access starts with the approved business field list from Task 1.6, not all customer-project tables. Clinical records are outside this dashboard's access scope. Business access does not imply clinical access.
- Provider data remains read-only in the general dashboard. Credentials are never returned to members. Approved connection maintenance is distinct from business-record reads and provider writes.
- Enforce the same rules on detail, lists, counts, search, aggregates, caches, attachments, and future exports. UI visibility is not authorization. Client-supplied identity, roles, organization, or environment cannot establish a grant.

### Existing Platform Administration boundary

The current PA-01 prototype is local-only and uses synthetic sessions with explicit `(actor, organization, environment)` grants. See [PLATFORM_ADMINISTRATION.md](PLATFORM_ADMINISTRATION.md). Its owner/architect fixtures do not establish production roles or real member identities.

This policy does not grant token adjustment authority through `founder_ceo` or `systems_architect`. Existing sandbox adjustment operations retain their request/revision, approval, idempotency, ledger, and audit requirements. Production application remains disabled, and the real email-approval policy remains unresolved. Internal membership deactivation must also block future Platform Administration requests when real identity integration is implemented. No changes to that prototype are part of Task 1.2.

## Task 1.2B — Personal-goal privacy

Approved policy: private to the owner by default, with explicit read-only sharing to named active internal members. No automatic CEO, manager, or IT access through the application.

- Only the owner creates, edits, completes, archives, shares, and unshares their personal goal. Shared readers can view the goal and its progress history; no delegated editing or commenting in the first release.
- The sharing UI must explain that existing and future updates are visible to selected readers. Sharing never implicitly shares other goals or unrelated records.
- Revocation takes effect on the next protected request. Invalidate scoped server caches and stop refresh/subscription delivery. Already viewed or copied information cannot be recalled.
- The CEO's overview and company metrics exclude private goals unless explicitly shared. Administrative counts/search/errors must not reveal their titles, contents, or existence to unauthorized members.
- Record access-control audit metadata without copying private goal text into broad audit feeds. Audit access must not become a route around goal privacy.
- Deactivation removes all access and active sharing grants to/from that member. Reactivation does not restore old shares automatically. Their private goals remain retained and inaccessible through ordinary administration pending the eventual retention/deletion policy.
- Converting a personal goal into a company goal requires an explicit owner action with a visibility warning; omit conversion from the initial release if not implemented. Company goals must not silently become personal goals to hide business records.
- Application privacy does not mean infrastructure administrators cannot access database contents. Operational access requires separate controls and audit; no promise of end-to-end encryption is made.

## Task 1.2C — Account lifecycle

### Provisioning and invitations

1. Bootstrap the first Founder/CEO using an out-of-band verified identity and a one-time, server-controlled setup. Never use “first public signup becomes administrator.” Record who authorized setup and disable bootstrap after success.
2. Only an active member with `members.manage` can invite, revoke, or resend an invitation. Bind each invitation to an exact normalized email and intended roles. No domain-wide auto-admission and no public self-enrollment.
3. Invitation lifetime is 72 hours. Tokens must be random, single-use, and protected at rest; resending invalidates the previous token. Never log invitation/recovery tokens.
4. Acceptance requires an authenticated, verified matching email and a valid invitation. Recheck inviter authority and the intended grant when accepting; revoked, expired, superseded, or already-consumed invitations cannot admit a member.
5. Create membership and consume the invitation atomically. Concurrent accepts create only one membership. Existing active membership is not silently upgraded by an invitation; role changes use the audited role-management flow.

### States and transitions

| State | Allowed transition | Required authority and effect |
| --- | --- | --- |
| Invited | Active | Matching verified identity accepts valid invitation |
| Invited | Expired/revoked | Expiration or membership administrator revocation; no access |
| Active | Active with changed roles | Membership administrator; audit old/new grants; invalidate stale authorization |
| Active | Inactive | Membership administrator; immediately deny subsequent protected requests and revoke sessions |
| Inactive | Active | Membership administrator; revalidate identity and explicitly select roles; do not replay old shares or support grants |

Invitation records and membership state should be modeled separately. Recovery cannot reactivate an inactive member. Customer-project registration, a subscription, or `canAccess` entitlement never creates internal membership.

### Role changes and deactivation

- Prevent removal/deactivation of the last active membership administrator with a transactional check, including concurrent requests. No unsupported sole-administrator self-demotion path.
- Check current membership and grants on protected requests rather than relying on long-lived role claims alone. Role removal and deactivation must deny the next request; revoke sessions and clear permission-sensitive caches. Already completed operations are not undone.
- Recheck authorization at the transaction boundary for writes and sensitive queued work. Stop user-scoped subscriptions and prevent queued actions from proceeding on stale authority.
- Preserve historical authorship/audit records. Reassign company goals and operational issues to an active member during offboarding, or mark them visibly unassigned for CEO follow-up. Do not transfer private personal goals to the CEO.
- Do not hard-delete member records as a deactivation shortcut. Retention and deletion scheduling are a later explicit policy decision.

### Login and recovery

- Use the selected identity provider's verified recovery flow; IT may initiate it but cannot read reset links, set a known password, impersonate the user, alter verified email, or bypass MFA.
- First-release policy is MFA for all three internal roles. Require recent reauthentication for membership/role changes and sensitive connection authorization. Mechanism and session limits are finalized with Task 1.3; no specific provider capability is assumed here.
- A password reset or email change does not add roles. Reverify changed email and revoke existing sessions after recovery or identity changes.
- Sole-founder lockout recovery uses a documented out-of-band identity verification and audited operator process. It must not expose a public administrative bypass. Define the named recovery operator before hosted rollout.
- Use generic recovery responses and rate limiting. Sessions, tokens, credentials, and private content must not appear in support logs.

## Implementation acceptance checklist

These are future test requirements, not test results.

- Every initial role can perform its allowed actions; direct unauthorized API/database requests fail.
- CEO can reach all required business domains; CEO/IT cannot read another member's unshared personal goal.
- Role combinations do not override goal privacy, inactive membership, or Platform Administration grants.
- Sharing grants read-only access; revocation removes list/detail/count/cache access on the next request.
- Expired, revoked, replayed, wrong-email, and unauthorized-inviter invitations fail; concurrent acceptance is atomic.
- Concurrent administrator removals cannot leave the system without an active membership administrator.
- Deactivation and grant removal stop subsequent access with an existing session; recovery does not bypass inactivity.
- Customer login/billing entitlement cannot authorize internal or Platform Administration actions.
- Connection maintenance cannot widen provider scope, reveal secrets, or perform provider writes.
- Audit events preserve actor, target, action, time, outcome, and relevant grant changes without exposing private goal content or tokens.

## Confirmation and handoff

The project manager approved the role matrix and personal-goal privacy policy on September 16, 2026. Task 1.2 and its subtasks are complete as policy/design work. Implementation and verification remain in later phases.

The Platform Administration tool and intended operators are documented in [PLATFORM_ADMINISTRATION.md](PLATFORM_ADMINISTRATION.md#purpose-and-who-can-use-the-tool): Founder/CEO and IT/systems architect, each requiring explicit organization/environment grants; sales has no default access. This policy approval does not provision real users, resolve the separate real-email approver policy, or enable production adjustments. Task 1.3 is next; hosted policies and real identity mapping remain unimplemented.
