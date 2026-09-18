# First-release requirements

Task 1.1 — Define the first-release workflows

Prepared September 12, 2026. Status: Requirements baseline for UI development; proposed details remain subject to project-manager course corrections. No application behavior or source availability has been validated.

## Confirmed direction and working assumptions

The Founder, CEO is the primary user. The dashboard must support comprehensive business oversight while also serving the sales director and IT/systems architect responsible for technical help. Scope includes company information, company/personal goals, QuickBooks, Stripe, HubSpot, and a likely customer-dashboard connection. The internal Supabase project is the intended backend.

The workflow access mapping in Task 1.1C was approved by the project manager on September 16, 2026. The detailed Task 1.2 policy is also approved and documented in [Membership and access](docs/MEMBERSHIP_AND_ACCESS.md). Metric definitions and source availability remain proposals pending discovery. The first UI uses labeled sample data; the project manager will review and correct it in Task 2.4.

## Task 1.1A — Executive information requirements

The first screen should answer: How is the business doing? What changed? What requires my attention? Who owns the next action?

| Priority | Business question | Required information | Supporting detail |
| --- | --- | --- | --- |
| Primary | How are finances performing? | Recorded cash position, revenue, expenses, outstanding/overdue receivables | Reporting period, accounting basis, currency, account/report breakdown |
| Primary | What needs a decision or follow-up? | Blocked/overdue company goals, manually flagged business issues, failed or stale data connections | Owner, due date, status, last update, linked goal or source |
| Primary | Are strategic commitments progressing? | Active company goals, progress, deadlines, blockers | Goal history and assigned owner |
| Supporting | What business may close next? | Open pipeline amount/count by stage and expected close period | Permitted deal details and owner |
| Supporting | Are customers joining and remaining? | Customer counts and period changes, once a customer definition is agreed | Defined customer status and source coverage |
| Supporting | Are payments and operations healthy? | Payment/refund summaries; manually maintained operational issues and integration health | Source-specific details, impact, owner, next step |

“Supporting” determines initial screen emphasis, not whether the CEO can access the information. The overview should link to complete permitted domain views.

### Proposed metric catalog

Refresh targets below are initial product requirements to evaluate against provider constraints, not implemented service guarantees. Use the company reporting timezone, to be confirmed; use labeled America/New_York sample dates for the prototype. Compare matching periods and report each currency separately until a conversion policy is defined.

| Metric | Proposed definition | Candidate source, unverified | Period and target freshness | Limitations / validation needed |
| --- | --- | --- | --- | --- |
| Recorded cash position | Sum of balances of explicitly selected cash/bank accounts as of the source report timestamp | QuickBooks | Latest available snapshot; daily refresh | Account mapping required; accounting records may lag bank availability. Do not label as live bank cash. |
| Revenue | Revenue total from the selected source report on the agreed accounting basis | QuickBooks | Month to date; same elapsed prior-month comparison; daily | Confirm basis and revenue accounts. Stripe receipts are not an additional revenue total. |
| Expenses | Expense total from the same reporting basis and period as revenue | QuickBooks | Month to date; matching comparison; daily | Confirm expense categories and whether selected report includes cost of sales; label consistently. |
| Receivables / overdue receivables | Remaining unpaid invoice balance as of the snapshot; overdue subset has due date before reporting date | QuickBooks | Latest snapshot; daily | Verify treatment of partial payments, credits, voids, and missing due dates. |
| Open pipeline | Sum and count of open deals, grouped by stage, currency, and expected close period | HubSpot | Current snapshot, current-month close filter; hourly target | Confirm stage mapping; exclude closed won/lost. Missing close dates get a separate bucket. Not a revenue forecast. |
| Successful payments / refunds | Separate totals of successful payments and refunds using each event's reporting date | Stripe | Month to date; hourly target | Confirm statuses and amount fields; exclude test data. Fees, payouts, receipts, and recognized revenue remain distinct. |
| Active / new customers | Distinct customer organizations meeting an agreed active rule; new organizations meeting an agreed start rule within period | Customer Supabase project; ownership to confirm | Latest count / month to date; daily | Definition and schema unknown. Users, subscriptions, and customer organizations are not interchangeable. Remains unavailable until defined. |
| Customer retention | Opening active-customer cohort still active at period end divided by opening cohort | Customer Supabase project; history to confirm | Last completed month; daily | Requires historical status and agreed active definition. Empty opening cohort is not applicable. Deferred from live release if history is missing. |
| Company goal progress | Per-goal stored manual percentage or progress against a defined numeric target | Internal Supabase | Current saved state; refresh after successful update | Show progress method and last update. Do not average unrelated goals into an unsupported company score. |
| At-risk commitments | Count/list of non-completed company goals marked blocked or past their due date | Internal Supabase | Current saved state, evaluated against reporting date | Missing due date is shown explicitly. Manual risk flags remain visibly manual. |
| Open operational issues | Unresolved manually entered issues, grouped by impact and owner | Internal company information | Current saved state; refresh after update | No ticketing or uptime integration assumed. Record next step and last update. |
| Connection health | Latest attempt result, latest successful refresh, and age against that connection's agreed target | Internal sync records | Latest available job state | A healthy sync does not establish business health or prove source completeness. |

Every metric/detail view must distinguish sample, current, stale, unavailable, and not applicable states. Display source, reporting period/as-of time, last successful refresh, and definition. Unknown amounts must never become zero. Partial coverage must be visible.

### Source readiness and decision owners

| Open item | Owner | Resolution task | Behavior until resolved |
| --- | --- | --- | --- |
| Which metrics apply to current business operations; reporting timezone/currency and financial basis | Founder, CEO | Task 1.1A / Task 5.1 | Use labeled sample definitions; do not publish live totals based on assumptions. |
| Internal schema and configuration | Developer with IT | Task 1.6A | No live-data claims or migrations. |
| Customer entity, lifecycle history, minimum fields, and visibility | CEO with developer/IT | Task 1.6B–Task 1.6C | Customer metrics remain conditional. |
| QuickBooks, Stripe, HubSpot data coverage and current API constraints | Developer with relevant business owner | Task 5.1–Task 5.2 | Candidate sources only; validate before integration. |
| Detailed grants and personal-goal privacy | Founder, CEO | Task 1.2A–Task 1.2B | Prototype permissions are illustrative only. |

Source availability and final applicability remain open; Task 1.1A is not fully complete until those checks are recorded. This does not prevent the sample-data UI from being designed.

## Task 1.1B — Executive actions and priorities

### CEO daily review

1. Sign in and land on the executive overview showing the reporting period and data freshness.
2. Review attention items before detailed charts: high-impact flagged issues, blocked/overdue company goals, and unavailable/stale sources affecting decisions.
3. Inspect the relevant financial, sales, customer, or operational detail. Preserve the selected reporting context when navigating.
4. Create or update a company goal for the follow-up, assigning an owner, target date, next step, and optional source reference. Short follow-ups use the goal workflow in the initial release; a separate task-management system is deferred.
5. Review subsequent owner updates and mark the commitment complete when resolved. Viewing a source record does not change it.

Within each attention category, show high impact first, then overdue/nearest due dates, with a stable tie-breaker. Keep connection failures distinguishable from business problems. No invented financial warning thresholds; configurable financial alerts can be scoped later.

### CEO weekly review

1. Select the review period and inspect comparable financial and payment summaries without combining overlapping sources.
2. Review open pipeline and customer changes, including unknown or incomplete data.
3. Review company goals by owner, blocked status, and upcoming deadlines.
4. Adjust goals, priorities, owners, and next steps; publish a company update where appropriate.
5. Review operational issues and assign follow-ups. Keep underlying accounting, billing, and CRM edits in their source systems for the initial release.

### Sales director workflow

Sign in to a role-appropriate overview; inspect permitted pipeline/customer information and assigned company goals; update goal progress and sales information; raise a business issue for CEO attention. Sales summaries remain limited by the grants confirmed in Task 1.2. Deal editing stays in HubSpot.

### IT/systems architect workflow

Review connection status and assigned technical goals; inspect redacted diagnostics; maintain technical company information and operational issue updates; perform approved account/connection support. Escalate business impact with an owner and next step. Financial/customer-record access is independently granted.

### First company-information content

Use a small set of content categories: company updates, strategy/priorities, team responsibilities and contact references, sales resources, technical/support procedures, and operational issues. Common fields are title, body, category, owner, visibility, updated timestamp, and archived status. Operational issues additionally need impact, status, next step, and optional linked goal. Validate this modest issue workflow in Task 4.1; defer a full ticketing system.

### Goal workflow

Create a company or personal goal with title, description, owner, target date, status, and progress method; record progress updates and blockers; inspect history; complete or archive. Company goals support CEO assignment and owner updates. Personal goals use the same basic workflow with the separate visibility policy. Numeric goals require units, baseline, target, and direction; manual percentage must be between 0 and 100. Avoid division by zero or implicit completion from a percentage alone.

## Task 1.1C — CEO and team workflow access mapping

Approved by the project manager September 16, 2026. This is the accepted business-workflow access mapping. The approved [Task 1.2 policy](docs/MEMBERSHIP_AND_ACCESS.md) specifies permissions, personal-goal privacy, and lifecycle rules; implementation and verification remain separate work.

| Domain / workflow | Founder, CEO | Sales director | IT/systems architect |
| --- | --- | --- | --- |
| Executive overview and business detail | All required business domains and supporting records | Permitted sales/customer summaries and shared goals | Operational summaries and shared goals |
| Financial information | Required reports, summaries, and underlying approved business detail | Specifically granted sales summaries | No financial-record access from support role alone |
| Sales and customer information | Required business oversight and detail | Relevant sales/customer records under agreed scope | Connection diagnostics; customer records only under separate grant |
| Company information | View/manage business content | Read shared content; maintain sales content | Read shared content; maintain technical/support content |
| Company goals and operational follow-ups | Create, assign, reprioritize, update, complete, and archive | Update assigned goals/issues | Update assigned goals/issues |
| Personal goals | Own goals and explicitly shared read-only goals under the approved Task 1.2 policy | Same | Same |
| Membership and access | Membership/permission administration | No default administration | Approved account support; role grants separately determined |
| Provider maintenance | Connection authority and business-data oversight | No default maintenance | Approved connection maintenance and redacted diagnostics |

Apply restrictions to list, detail, search, summaries, and any future exports. The CEO's business access spans all listed domains; individual personal-goal privacy remains explicit. Customer-dashboard accounts do not become internal members automatically.

## Acceptance scenarios for later implementation

- CEO can navigate from each primary overview area to supporting details and create an owned goal/follow-up without changing provider data.
- A missing or stale provider produces an explicit state while internal goals and information remain usable.
- A review period and currency remain identifiable in summary and detail; comparisons use matching definitions.
- An assigned team member can update a goal and the CEO can see the saved change and its timestamp.
- Sales and IT views support their workflows and deny access outside their grants, including direct data requests.
- A private personal goal does not appear in another member's list, overview count, or detail without the agreed access.
- UI review can use sample cases for healthy business data, missing customer history, a blocked goal, an overdue follow-up, and a failed connection.

## First-release boundary and completion evidence

First release includes the executive overview, supporting domain views, company content, goals/follow-ups, membership, and validated read-only integrations. Source-dependent cards are enabled only after discovery and validation. The early UI demonstrates these workflows with labeled samples.

Deferred: forecast/runway models, automated business recommendations, configurable financial alerts, a separate task/ticketing system, provider write-back, and historical customer metrics without sufficient source history.

Task 1.1B and Task 1.1C have documented baseline deliverables above. Task 1.1A and parent Task 1.1 remain open for applicability/source confirmation. Review evidence for this documentation consists of consistency with README.md and DEVELOPMENT_PLAN.md, coverage of the listed workflows, and a whitespace/diff check. No runtime, integration, or authorization tests apply to this documentation-only change.
