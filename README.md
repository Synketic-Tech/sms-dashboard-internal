
# Synketic Motion Systems Internal Dashboard

Internal workspace for managing Synketic Motion Systems Inc., bringing company information, connected business services, and company and personal goals into one application.

## Primary product direction: CEO dashboard

The primary experience is a dashboard for the **Founder, CEO**, who is also the developer. Prioritize the information and workflows needed to run the business; the sales director and IT/systems architect retain useful views appropriate to their responsibilities.

The CEO should have comprehensive access to business information and management capabilities needed for company oversight, including financial performance, sales pipeline, customer health, company goals, and operational issues. Build the executive overview first, with supporting detail views and clear next actions. Specific metrics and workflows will be defined during requirements and refined through the project manager's UI reviews.

Candidate executive questions include: How is the business performing? What changed? What needs attention? Which goals are off track? What decisions or follow-ups are needed? Data sources, reporting periods, freshness, and unavailable information must be clear. Candidate metrics are planning inputs, not claims about data already available.

## Intended capabilities

- **Member access:** Authorized members can log in and access the dashboard.
- **Company information:** Members can find internal company information appropriate to their permissions.
- **Connected providers:** Display information from third-party services such as QuickBooks, Stripe, and HubSpot.
- **Goals:** Track company goals and personal goals, including ownership, progress, and status.

## Proposed foundation

### Available Supabase projects

- [Internal dashboard](https://supabase.com/dashboard/project/ehjygkfgiqdolhzqikhp): `ehjygkfgiqdolhzqikhp`, supplied by the project manager as the available internal backend.
- [Customer dashboard](https://supabase.com/dashboard/project/jegmluwodwkuibreedcj): `jegmluwodwkuibreedcj`, a likely additional data source; required data and connection design remain to be determined.

These are project references supplied by the project manager. Access, schema, authentication configuration, and environment purpose have not been verified. No connection has been configured.

The proposed approach is to keep internal membership and company/goals data in the internal project and expose only explicitly approved customer information through a restricted server-side integration. Customer-dashboard access does not automatically grant internal membership. See DEVELOPMENT_PLAN.md for discovery and implementation tasks.

### Architecture recommendations

These are initial recommendations, not implemented features or finalized architecture decisions.

- Use invitation-based membership and server-enforced permissions. Logging in establishes identity; membership and permissions determine access to company data.
- Define access to company, financial, customer, and goal information explicitly. Personal-goal visibility needs a clear policy before implementation.
- Keep provider connections and credentials on the server. Begin with read-only integrations and grant only the provider access needed for approved views.
- Show when provider data was last refreshed and distinguish unavailable or stale data from zero values.
- Keep internal member access separate from customer subscription or billing entitlements.

## Proposed build order

1. Define member roles, information visibility, and the first dashboard views; select the application, authentication, and storage stack.
2. Build login, invitations, membership management, and a protected application shell.
3. Add company information and company/personal goal tracking.
4. Connect one provider at a time, with agreed metrics, access rules, refresh behavior, and connection status.
5. Assemble the overview dashboard from validated internal and provider data.

## Initial team

The initial team consists of:

- Founder, CEO (also developer)
- Sales director
- IT/systems architect, also responsible for technical help

### Proposed access model

The team composition above is confirmed. The permissions below are recommendations pending agreement.

| Area | Founder, CEO | Sales director | IT/systems architect |
| --- | --- | --- | --- |
| Shared company information | View and manage | View; maintain sales content | View; maintain technical/support content |
| Membership and role grants | Invite members and manage permissions | No administration by default | Account support; no role grants by default |
| Company goals | Create, assign, and manage | View shared goals; update assigned goals | View shared goals; update assigned goals |
| Personal goals | Manage own goals | Manage own goals | Manage own goals |
| HubSpot information | View approved business data | View approved sales/customer data | Connection health and redacted diagnostics by default |
| QuickBooks and Stripe information | View approved financial data | Explicitly approved sales summaries only | Connection health and redacted diagnostics by default |
| Provider connections | Authorize connections and access scope | No connection administration by default | Maintain approved connections and troubleshoot sync |

- Personal goals should be private to their owner by default, with explicit sharing. Founder or support roles should not automatically expose private goals through the application.
- Technical administration should be a separate permission from access to financial or customer records. Support should use connection status and redacted diagnostics wherever possible.
- Infrastructure or database access can exceed application permissions; define and audit that operational access separately before describing personal data as inaccessible to administrators.
- Roles should group explicit permissions rather than rely on job titles embedded throughout the application. One person may hold more than one role.
- All initial provider views remain read-only. Maintaining a connection does not grant permission to change provider records or expose credentials.
- CEO access should cover all business domains needed for management, including the approved customer-dashboard integration. Personal-goal privacy remains a separate policy decision; comprehensive business visibility does not silently change that policy. Provider write-back remains outside the initial scope.

## Decisions still open

- Confirm or adjust the proposed role permissions, invitation authority, and support boundaries above.
- Confirm private-by-default personal goals and explicit sharing.
- What company information belongs in the first release?
- Which provider and metrics should be integrated first?
- What stack and deployment environment should host the application?

## Current status

Phase 1 requirements are in progress. [FIRST_RELEASE_REQUIREMENTS.md](FIRST_RELEASE_REQUIREMENTS.md) defines the CEO and team workflow baseline, proposed metrics, access needs, and outstanding discovery decisions for Task 1.1. See [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for task status. No application, authentication, database, or provider integrations have been implemented.
