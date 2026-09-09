
# Synketic Motion Systems Internal Dashboard

Internal workspace for managing Synketic Motion Systems Inc., bringing company information, connected business services, and company and personal goals into one application.

## Intended capabilities

- **Member access:** Authorized members can log in and access the dashboard.
- **Company information:** Members can find internal company information appropriate to their permissions.
- **Connected providers:** Display information from third-party services such as QuickBooks, Stripe, and HubSpot.
- **Goals:** Track company goals and personal goals, including ownership, progress, and status.

## Proposed foundation

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

- Developer/founder
- Sales director
- IT/systems architect, also responsible for technical help

### Proposed access model

The team composition above is confirmed. The permissions below are recommendations pending agreement.

| Area | Developer/founder | Sales director | IT/systems architect |
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

## Decisions still open

- Confirm or adjust the proposed role permissions, invitation authority, and support boundaries above.
- Confirm private-by-default personal goals and explicit sharing.
- What company information belongs in the first release?
- Which provider and metrics should be integrated first?
- What stack and deployment environment should host the application?

## Current status

Project scope only. No application, authentication, database, or provider integrations have been implemented.
