import Link from "next/link";
import styles from "./page.module.css";

export const sampleGoals = [
  {
    id: "launch",
    title: "Prepare the customer launch",
    owner: "Founder, CEO",
    progress: 65,
    status: "On track",
    due: "Sep 30",
    next: "Finalize onboarding checklist",
  },
  {
    id: "sales",
    title: "Complete 10 discovery conversations",
    owner: "Sales director",
    progress: 60,
    status: "Needs attention",
    due: "Sep 25",
    next: "Schedule the remaining four conversations",
  },
  {
    id: "recovery",
    title: "Verify the recovery runbook",
    owner: "IT / systems architect",
    progress: 40,
    status: "Blocked",
    due: "Sep 20",
    next: "Confirm a rehearsal window",
  },
];
export const sources = [
  {
    name: "QuickBooks",
    state: "Sample current",
    time: "Sep 16, 2026 · 08:00 ET",
    description: "Cash, revenue, expenses, and receivables",
  },
  {
    name: "Stripe",
    state: "Sample current",
    time: "Sep 16, 2026 · 09:00 ET",
    description: "Successful payments and refunds",
  },
  {
    name: "HubSpot",
    state: "Sample stale",
    time: "Sep 14, 2026 · 09:00 ET",
    description: "Pipeline is illustrative and two days old",
  },
  {
    name: "Customer reporting",
    state: "Sample partial",
    time: "Sep 16, 2026 · 08:00 ET",
    description: "Organization counts only; retention unavailable",
  },
];
export function SampleNotice() {
  return (
    <p className={styles.sample}>
      SAMPLE DATA · All figures, organizations, goals, and updates are
      fictional. No provider is connected. As of September 16, 2026, 09:00 ET.
    </p>
  );
}
export function GoalCards() {
  return (
    <div className={styles.goalList}>
      {sampleGoals.map((goal) => (
        <article className={styles.card} key={goal.id} id={goal.id}>
          <div className={styles.row}>
            <h3>{goal.title}</h3>
            <span className={styles.tag}>{goal.status}</span>
          </div>
          <p>
            {goal.owner} · Due {goal.due}, 2026
          </p>
          <label className={styles.progressLabel}>
            {goal.progress}% · Manual progress
            <progress value={goal.progress} max={100} />
          </label>
          <details>
            <summary>Review next step</summary>
            <p>{goal.next}. Last sample update: Sep 16, 2026.</p>
          </details>
        </article>
      ))}
    </div>
  );
}
export function SampleSection({ section }: { section: string }) {
  if (section === "goals")
    return (
      <>
        <SampleNotice />
        <h2>Company goals</h2>
        <GoalCards />
        <h2 className={styles.sectionTitle}>My personal goals</h2>
        <article className={styles.card}>
          <span className={styles.tag}>Private · CEO preview only</span>
          <h3 className={styles.sectionTitle}>
            Protect time for strategic planning
          </h3>
          <p>2 of 4 weekly sessions completed · 50% · Due Sep 30, 2026</p>
          <p>
            Only this fictional preview member’s personal goal is shown. Sharing
            and persistence are not implemented.
          </p>
        </article>
      </>
    );
  if (section === "integrations")
    return (
      <>
        <SampleNotice />
        <div className={styles.grid}>
          {sources.map((source) => (
            <article className={styles.card} key={source.name}>
              <h2>{source.name}</h2>
              <span className={styles.tag}>{source.state}</span>
              <p>{source.description}</p>
              <p>Sample refresh: {source.time}</p>
              <details>
                <summary>Connection details</summary>
                <p>
                  Actual connection: not configured. The status above
                  demonstrates the planned reporting experience; it is not a
                  live sync result.
                </p>
              </details>
            </article>
          ))}
        </div>
      </>
    );
  if (section === "company")
    return (
      <>
        <SampleNotice />
        <div className={styles.grid}>
          <article className={styles.card}>
            <p className={styles.eyebrow}>COMPANY UPDATE · CEO</p>
            <h2>Focus for the month</h2>
            <p>
              Prepare a repeatable onboarding experience and gather feedback
              from prospective customers.
            </p>
            <details>
              <summary>Read sample update</summary>
              <p>
                Sales will consolidate discovery notes. IT will document
                recovery steps. The CEO will review launch readiness at the next
                company check-in.
              </p>
            </details>
          </article>
          <article className={styles.card}>
            <p className={styles.eyebrow}>OPERATIONS · IT</p>
            <h2>Recovery rehearsal pending</h2>
            <p>Impact: medium · Owner: IT / systems architect</p>
            <Link href="/goals#recovery">Review linked goal →</Link>
          </article>
          <article className={styles.card}>
            <h2>Sales workspace</h2>
            <p>
              6 of 10 discovery conversations complete. Next step: schedule the
              remaining four.
            </p>
            <Link href="/goals#sales">Review sales commitment →</Link>
          </article>
          <article className={styles.card}>
            <h2>Technical support workspace</h2>
            <p>
              Review sample connection health and follow up on the stale
              pipeline refresh.
            </p>
            <Link href="/integrations">Review connection status →</Link>
          </article>
        </div>
      </>
    );
  return null;
}
export default function SampleOverview() {
  return (
    <>
      <p className={styles.eyebrow}>EXECUTIVE OVERVIEW</p>
      <h1>Your company, in view.</h1>
      <p className={styles.intro}>
        Performance, priorities, and the decisions ahead.
      </p>
      <SampleNotice />
      <div className={styles.period}>
        September 1–16, 2026 · USD · America/New_York
      </div>
      <div className={styles.metrics}>
        {[
          [
            "Recorded cash",
            "$84,200",
            "As of Sep 16 · QuickBooks",
            "Selected cash-account balances; not live bank availability.",
          ],
          [
            "Revenue",
            "$24,800",
            "Sep 1–16 · QuickBooks",
            "Accrual-basis sample revenue. Aug 1–16: $21,400; change +15.9%.",
          ],
          [
            "Expenses",
            "$18,300",
            "Sep 1–16 · QuickBooks",
            "Same sample accounting basis as revenue. Aug 1–16: $17,800; change +2.8%.",
          ],
          [
            "Open pipeline",
            "$62,000",
            "Snapshot Sep 14 · HubSpot · Stale",
            "8 open deals expected to close in September. Unweighted; not a revenue forecast.",
          ],
        ].map(([title, value, context, definition]) => (
          <article className={styles.card} key={title}>
            <h2 className={styles.metricTitle}>{title}</h2>
            <strong className={styles.value}>{value}</strong>
            <p>{context}</p>
            <details>
              <summary>Definition & comparison</summary>
              <p>{definition}</p>
            </details>
          </article>
        ))}
      </div>
      <div className={styles.sectionHeader}>
        <h2>Needs your attention</h2>
        <span>2 commitments · 1 data issue</span>
      </div>
      <div className={styles.attention}>
        <Link href="/goals#recovery">
          <strong>Recovery rehearsal is blocked</strong>
          <span>IT / systems architect · Due Sep 20 →</span>
        </Link>
        <Link href="/goals#sales">
          <strong>Four discovery conversations remain</strong>
          <span>Sales director · Due Sep 25 →</span>
        </Link>
        <Link href="/integrations">
          <strong>Pipeline data needs a refresh</strong>
          <span>Sample HubSpot snapshot is two days old →</span>
        </Link>
      </div>
      <div className={styles.sectionHeader}>
        <h2>Business performance</h2>
        <Link href="/integrations">Source status →</Link>
      </div>
      <div className={styles.grid}>
        <article className={styles.card}>
          <h3>Revenue & expenses</h3>
          <p>Comparable periods · USD · QuickBooks sample</p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Period</th>
                <th>Revenue</th>
                <th>Expenses</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Aug 1–16</td>
                <td>$21,400</td>
                <td>$17,800</td>
              </tr>
              <tr>
                <td>Sep 1–16</td>
                <td>$24,800</td>
                <td>$18,300</td>
              </tr>
            </tbody>
          </table>
          <p>
            Receivables: $9,600 outstanding, including $2,400 overdue. Snapshot
            Sep 16.
          </p>
        </article>
        <article className={styles.card}>
          <h3>Customers & payments</h3>
          <p>18 active organizations · 3 registered Sep 1–16</p>
          <p>
            Sample definition: active organization flag, not paying customers.
            Retention: unavailable — history not verified.
          </p>
          <details>
            <summary>Payment detail</summary>
            <p>
              Stripe sample · Sep 1–16: $22,100 successful payments; $600
              refunds. Refresh Sep 16, 09:00 ET. These are payment events, not
              recognized revenue, and are not added to QuickBooks totals.
            </p>
          </details>
        </article>
      </div>
      <div className={styles.sectionHeader}>
        <h2>Company priorities</h2>
        <Link href="/goals">All goals →</Link>
      </div>
      <GoalCards />
      <div className={styles.sectionHeader}>
        <h2>Team & operations</h2>
        <Link href="/company">Company workspace →</Link>
      </div>
      <div className={styles.grid}>
        <article className={styles.card}>
          <h3>Sales focus</h3>
          <p>
            Qualify the September pipeline and finish discovery conversations.
          </p>
          <Link href="/company">Read the team update →</Link>
        </article>
        <article className={styles.card}>
          <h3>Operational focus</h3>
          <p>
            Confirm the recovery rehearsal window and review stale integration
            data.
          </p>
          <Link href="/integrations">Review integrations →</Link>
        </article>
      </div>
    </>
  );
}
