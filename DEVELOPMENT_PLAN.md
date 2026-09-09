# Development Plan

Synketic Motion Systems Inc. internal dashboard

Created: September 9, 2026

Status: Planning; development tasks below have not started.

## Purpose and scope

Build an internal dashboard where authorized members can log in, access company information, view approved information from QuickBooks, Stripe, and HubSpot, and track company and personal goals.

The initial team is the developer/founder, a sales director, and an IT/systems architect who also provides technical help. The role matrix in README.md is a starting proposal; detailed permissions, personal-goal privacy, technology choices, and provider priorities remain to be confirmed.

## Project management and task conventions

**The project manager expects to step in and provide course corrections once the UI is available.** Phase 2 intentionally delivers an early, navigable UI with sample data. Its review should shape subsequent implementation. Further UI reviews occur as real workflows become available; this plan is a living document.

- Task identifiers use `Task <phase>.<task><optional subtask letter>`. For example, Task 2.4C means Phase 2, Task 4, Subtask C.
- Checkboxes indicate completion. A parent task is complete only when its subtasks and acceptance conditions are complete.
- Preserve existing task identifiers when scope changes. Append new tasks or subtasks and mark replaced work as superseded rather than renumbering completed work.
- Record project-manager corrections with the date, affected task IDs, decision, and any impact on dependencies. Preserve completed evidence; reopen only work affected by a correction.
- Work in phase order unless dependencies permit otherwise. Select the next bounded task rather than treating a phase as one large implementation change.
- Completion evidence should identify the implemented behavior, relevant checks, and unresolved limitations. A sample UI, passing local tests, and a live validated integration are different milestones.
- No dates or delivery estimates are committed here. Estimate remaining work after the early UI review and provider discovery.

## Phase 1 — Requirements and technical foundation

Outcome: An agreed first-release scope and a runnable foundation.

- [ ] **Task 1.1 — Define the first-release workflows.** Describe what each initial team member needs to see and do; identify the first company-information content and goal workflows. Separate first-release requirements from later ideas.
- [ ] **Task 1.2 — Define membership and data visibility.**
  - [ ] **Task 1.2A — Confirm role permissions.** Decide invitation authority, content editing, goal assignment, business-data visibility, and technical-support privileges.
  - [ ] **Task 1.2B — Confirm personal-goal privacy.** Define default visibility, explicit sharing, revocation, and what administrators can access through the application.
  - [ ] **Task 1.2C — Define account lifecycle rules.** Cover initial founder provisioning, invitations, role changes, deactivation, and account recovery. Keep internal membership separate from customer billing entitlements.
- [ ] **Task 1.3 — Select and document the stack.** Choose application framework, authentication, database, deployment environment, and background-job approach. Evaluate operational fit, cost, and maintainability before installing the foundation.
- [ ] **Task 1.4 — Create the application foundation.** Establish local setup, environment-variable examples without secrets, formatting/linting, relevant automated checks, and a basic build pipeline.
- [ ] **Task 1.5 — Define the initial data model.** Model members, role/permission grants, company content, goals, sharing, provider connections, sync runs, and audit events. Document ownership and access boundaries; defer provider-specific fields until discovery.

Exit criteria: Requirements and permission decisions are recorded, unresolved decisions have explicit owners, and a clean local setup can run and build the application.

## Phase 2 — Early UI and project-manager review

Depends on: Phase 1 foundation and enough workflow decisions to build a reviewable prototype.

Outcome: A navigable interface that makes the product direction concrete before deeper implementation.

- [ ] **Task 2.1 — Build the application shell.** Create navigation, page layout, member menu, and responsive behavior for overview, company information, goals, integrations, and administration.
- [ ] **Task 2.2 — Build representative screens with clearly labeled sample data.** Include company information, company/personal goals, provider summaries, and connection status. Sample metrics must not appear to be live company data.
- [ ] **Task 2.3 — Demonstrate role and state variations.** Show representative founder, sales, and IT experiences along with loading, empty, unavailable, and permission-denied states. Any prototype role switcher is a preview aid, not authorization.
- [ ] **Task 2.4 — Review the UI with the project manager.**
  - [ ] **Task 2.4A — Present the working UI.** Provide a local or access-controlled preview and a short walkthrough of the main workflows.
  - [ ] **Task 2.4B — Capture course corrections.** Record feedback on navigation, information hierarchy, terminology, visual design, missing workflows, and priorities.
  - [ ] **Task 2.4C — Revise the UI and plan.** Incorporate agreed corrections, update affected tasks and dependencies, and record the direction for subsequent implementation.
- [ ] **Task 2.5 — Verify basic usability.** Check keyboard navigation, labels, contrast, and narrow-screen layouts on the revised UI.

Exit criteria: The project manager has reviewed the UI, corrections are recorded and addressed or scheduled, and the agreed direction is reflected in this plan. No real company data is required for this milestone.

## Phase 3 — Authentication and enforced permissions

Depends on: Phase 1 access decisions and Phase 2 UI direction.

Outcome: Authorized members can use a protected application with server-enforced access.

- [ ] **Task 3.1 — Implement authentication.** Add login, logout, session expiration, recovery, and the agreed MFA policy using the selected authentication system.
- [ ] **Task 3.2 — Implement membership administration.** Support secure founder setup, expiring invitations, invitation acceptance, role changes, and deactivation. Prevent accidental loss of the last membership administrator.
- [ ] **Task 3.3 — Enforce permissions on the server.** Apply membership, action, and record-visibility checks to every data path. Ensure role changes and deactivation affect active access under documented session rules.
- [ ] **Task 3.4 — Add support and audit foundations.** Record membership and permission changes without logging secrets; provide appropriate redacted account diagnostics. Document infrastructure access separately from application permissions.
- [ ] **Task 3.5 — Verify the access model.** Test direct requests as well as UI behavior for unauthenticated, unauthorized, deactivated, and authorized users. Verify private-goal access when goal storage is added in Phase 4.

Exit criteria: Initial members can be invited and sign in; negative authorization checks pass; hiding a UI control is never the only access control.

## Phase 4 — Company information and goals

Depends on: Phase 3 protected data access.

Outcome: The team can use the dashboard for internal information and goal tracking before provider connections are available.

- [ ] **Task 4.1 — Implement company information.** Add the agreed content types, viewing, editing, and archiving with permission checks and clear ownership/update information.
- [ ] **Task 4.2 — Implement company goals.** Support goal title, description, owner, target date, progress method, status, and progress updates. Define validation for numeric and manual progress; provide useful filters.
- [ ] **Task 4.3 — Implement personal goals and sharing.** Apply the agreed privacy policy to lists, detail views, updates, and overview summaries. Verify that revoking a share removes access.
- [ ] **Task 4.4 — Connect the overview to internal data.** Show relevant company information and goals for the signed-in member, with useful empty states and no sample/real-data ambiguity.
- [ ] **Task 4.5 — Review working workflows.** Have the project manager review content and goal flows, record corrections, and verify persistence, validation, editing permissions, and cross-member privacy.

Exit criteria: Company information and goals persist correctly, authorized members can complete their workflows, and privacy checks pass across all implemented surfaces.

## Phase 5 — Provider integration foundation

Depends on: Phase 3 permissions; can proceed independently of remaining Phase 4 content work after UI priorities are settled.

Outcome: A secure, observable connection and synchronization framework for read-only business data.

- [ ] **Task 5.1 — Confirm provider priorities and metrics.** Select the provider order and define first-release fields, calculations, date ranges, currencies, refresh expectations, and per-role visibility. Provider order below is a planning placeholder.
- [ ] **Task 5.2 — Verify current provider requirements.** Consult official documentation for account eligibility, available test environments, API authentication/scopes, quotas, and any review requirements. Record blockers before implementation.
- [ ] **Task 5.3 — Implement connection lifecycle management.** Keep credentials server-side with suitable protected storage; implement the provider-supported authorization flow, reconnect, disconnect, and credential rotation/expiration handling. Restrict connection administration separately from business-data viewing.
- [ ] **Task 5.4 — Implement reliable synchronization.** Add bounded retries, rate-limit handling, pagination, idempotent updates, and recoverable sync state. Use scheduled refresh initially unless discovery supports a different approach; authenticate and deduplicate webhook events if introduced.
- [ ] **Task 5.5 — Implement status and retention rules.** Show last successful refresh, failed attempts, and stale/disconnected states. Define what cached data is retained or removed after disconnect and who can view diagnostics.
- [ ] **Task 5.6 — Validate integration failure behavior.** Use fixtures or provider test environments to check expiration, partial failure, repeated jobs, and denied access. Confirm that credentials and sensitive payloads are absent from browser responses and logs.

Exit criteria: The common integration path is testable, access and retention rules are documented, and failures produce understandable status without presenting missing data as zero.

## Phase 6 — Read-only provider views

Depends on: Phase 5; implement one provider at a time in the agreed priority order. Task IDs remain stable if the order changes.

Outcome: Approved QuickBooks, Stripe, and HubSpot information is available to permitted members.

- [ ] **Task 6.1 — Integrate HubSpot.**
  - [ ] **Task 6.1A — Implement the approved sales data adapter.** Retrieve only the agreed records and fields using the common sync framework.
  - [ ] **Task 6.1B — Build sales views.** Display the agreed summaries with source and freshness information, respecting customer-data visibility.
  - [ ] **Task 6.1C — Validate HubSpot results.** Compare representative records and calculations against the provider and verify role access and failure states.
- [ ] **Task 6.2 — Integrate Stripe.**
  - [ ] **Task 6.2A — Implement the approved Stripe data adapter.** Distinguish test/live data and define treatment of currencies, refunds, and reporting periods for selected metrics.
  - [ ] **Task 6.2B — Build Stripe views.** Apply the agreed financial-detail and sales-summary permissions.
  - [ ] **Task 6.2C — Validate Stripe results.** Reconcile representative totals against the provider and test access and stale-data behavior.
- [ ] **Task 6.3 — Integrate QuickBooks.**
  - [ ] **Task 6.3A — Implement the approved QuickBooks data adapter.** Confirm the connected company and define report basis, periods, and currency handling for selected data.
  - [ ] **Task 6.3B — Build QuickBooks views.** Display approved financial information and source/report context under the agreed permissions.
  - [ ] **Task 6.3C — Validate QuickBooks results.** Compare representative reports against the provider and verify access, reconnection, and failure states.
- [ ] **Task 6.4 — Assemble the business overview.** Combine permitted provider summaries with internal goals and information. Keep source definitions visible and avoid adding overlapping Stripe and QuickBooks figures into an unsupported total.
- [ ] **Task 6.5 — Review with the project manager and initial team.** Confirm that the displayed information supports each role's work; record and implement agreed corrections.

Exit criteria: Each enabled provider has recorded validation evidence and accurate access/freshness behavior. A provider without live verification remains explicitly marked unvalidated or unavailable; fixtures do not establish live readiness.

## Phase 7 — Release preparation and initial rollout

Depends on: Phases 3–6 for the agreed release scope; any deferred provider must be explicitly recorded and unavailable in the release UI.

Outcome: A validated internal release with documented operating procedures.

- [ ] **Task 7.1 — Verify end-to-end workflows.** Exercise the initial roles across login, membership changes, company information, goals, integrations, and overview data. Complete relevant automated checks and a production build.
- [ ] **Task 7.2 — Verify release controls.** Review authorization coverage, secret handling, dependency findings, input validation, audit visibility, accessibility, and representative load behavior; resolve release-blocking findings.
- [ ] **Task 7.3 — Prepare operations.** Configure deployment environments, monitoring, backups, and rollback. Demonstrate a restore in a safe environment and document support procedures, connection recovery, and operational access.
- [ ] **Task 7.4 — Conduct acceptance review.** Give the project manager and initial team the release candidate; record accepted behavior, corrections, remaining limitations, and the rollout decision.
- [ ] **Task 7.5 — Deploy and onboard.** Deploy the accepted scope, invite the initial members, and perform live smoke checks for login, access boundaries, core workflows, and enabled provider freshness.

Exit criteria: The initial team can use the release, live checks are recorded, operational ownership is clear, and remaining limitations are documented separately from completed work.

## Phase 8 — Feedback and incremental improvements

Depends on: Initial rollout.

Outcome: Subsequent changes follow observed team needs and project-manager direction.

- [ ] **Task 8.1 — Collect actual-use feedback.** Review friction, missing information, support issues, and provider reliability with the initial team.
- [ ] **Task 8.2 — Prioritize the next iteration.** Turn accepted course corrections into bounded, numbered tasks with acceptance criteria and dependencies.
- [ ] **Task 8.3 — Deliver and verify improvements.** Implement prioritized changes, check affected permissions and workflows, and update operating documentation.

Exit criteria: Each iteration has recorded outcomes and an updated backlog. This phase repeats as needs evolve.

## Deferred scope

Provider write-back, payment actions, accounting changes, CRM editing, public registration, customer subscription gating, and advanced forecasting are outside the initial plan. Add them only through an explicit scope decision and corresponding tasks.

## Decision and course-correction log

| Date | Affected tasks | Decision or correction | Impact |
| --- | --- | --- | --- |
| 2026-09-09 | Task 2.4A–Task 2.4C; subsequent UI work | Plan for project-manager course corrections once the UI is available. | Deliver an early sample-data UI and revise downstream work after review. |
