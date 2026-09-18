"use client";
import Link from "next/link";
import styles from "./page.module.css";
export type PreviewRole = "ceo" | "sales" | "it";
export type PreviewState =
  "ready" | "loading" | "empty" | "unavailable" | "denied";
export const roleNames = {
  ceo: "Founder, CEO",
  sales: "Sales director",
  it: "IT / systems architect",
};
export function PreviewContent({
  role,
  state,
  path,
  onReset,
  children,
}: {
  role: PreviewRole;
  state: PreviewState;
  path: string;
  onReset: () => void;
  children: React.ReactNode;
}) {
  const denied =
    state === "denied" || (role === "sales" && path === "/administration");
  if (state !== "ready" || denied) {
    const heading = denied
      ? "Access restricted"
      : state === "loading"
        ? "Loading your workspace"
        : state === "empty"
          ? "Nothing to show yet"
          : "Information is unavailable";
    return (
      <section className={styles.card}>
        <p className={styles.eyebrow}>SIMULATED UI STATE · {roleNames[role]}</p>
        <h1>{heading}</h1>
        <p role="status">
          {denied
            ? "This preview demonstrates a permission boundary. A real account would need an explicit grant."
            : state === "loading"
              ? "This is a paused loading demonstration. No network request is running."
              : state === "empty"
                ? "There are no records in this sample scenario. Missing records are not zero-valued business results."
                : "The sample source could not be refreshed. No current value can be reported."}
        </p>
        {state !== "ready" && (
          <button type="button" onClick={onReset}>
            Return to ready preview
          </button>
        )}
        {denied && (
          <p>
            <Link href="/">Return to overview</Link>
          </p>
        )}
      </section>
    );
  }
  if (role === "ceo") return children;
  const sales = role === "sales";
  return (
    <>
      <p className={styles.eyebrow}>
        {sales ? "SALES WORKSPACE" : "TECHNICAL SUPPORT WORKSPACE"}
      </p>
      <h1>
        {path === "/"
          ? sales
            ? "Move the right conversations forward."
            : "Keep the company running."
          : path === "/goals"
            ? "Goals & priorities"
            : path === "/company"
              ? "Company information"
              : path === "/integrations"
                ? "Connection visibility"
                : "Support & administration"}
      </h1>
      <p className={styles.sample}>
        SAMPLE DATA · Fictional {roleNames[role]} experience. This role
        selection changes the display only; it does not enforce security.
      </p>
      <div className={styles.grid}>
        {path === "/" && (
          <>
            <section className={styles.card}>
              <h2>{sales ? "Sales pipeline" : "Connection health"}</h2>
              <p>
                {sales
                  ? "$62,000 across 8 open deals · Expected close: September 2026 · USD"
                  : "4 sample connections · HubSpot stale; customer reporting partial"}
              </p>
              <p>
                {sales
                  ? "HubSpot sample snapshot Sep 14, 2026 · Stale. Unweighted pipeline, not revenue."
                  : "QuickBooks and Stripe show sample-current status. No provider is actually connected."}
              </p>
              <Link href="/integrations">Review source status →</Link>
            </section>
            <section className={styles.card}>
              <h2>Your next priority</h2>
              <p>
                {sales
                  ? "Complete four remaining discovery conversations by Sep 25."
                  : "Confirm the recovery rehearsal window before Sep 20."}
              </p>
              <Link href="/goals">Review your goals →</Link>
            </section>
          </>
        )}
        {path === "/goals" && (
          <>
            <section className={styles.card}>
              <h2>
                {sales
                  ? "Complete 10 discovery conversations"
                  : "Verify the recovery runbook"}
              </h2>
              <p>
                {sales
                  ? "60% · Needs attention · Due Sep 25"
                  : "40% · Blocked · Due Sep 20"}
                , 2026
              </p>
              <p>
                Assigned to {roleNames[role]}. Progress updates are
                preview-only.
              </p>
            </section>
            <section className={styles.card}>
              <h2>My personal goals</h2>
              <p>Private · {roleNames[role]} preview only</p>
              <p>
                {sales
                  ? "Practice two discovery interview techniques."
                  : "Complete a weekly systems learning session."}
              </p>
              <p>No other member’s private goals are displayed.</p>
            </section>
          </>
        )}
        {path === "/company" && (
          <>
            <section className={styles.card}>
              <h2>Shared company direction</h2>
              <p>
                Prepare repeatable onboarding and gather prospective customer
                feedback.
              </p>
            </section>
            <section className={styles.card}>
              <h2>{sales ? "Sales resources" : "Technical procedures"}</h2>
              <p>
                {sales
                  ? "Consolidate discovery notes and prepare the next customer conversations."
                  : "Maintain the recovery runbook and review integration diagnostics."}
              </p>
            </section>
          </>
        )}
        {path === "/integrations" && (
          <>
            <section className={styles.card}>
              <h2>
                {sales
                  ? "HubSpot source status"
                  : "Redacted connection diagnostics"}
              </h2>
              <p>Sample stale · Last success Sep 14, 2026, 09:00 ET</p>
              <p>
                {sales
                  ? "Pipeline summaries are available in this preview. Connection administration is not granted."
                  : "Sample diagnostic: refresh overdue. Credentials and customer payloads are not exposed."}
              </p>
            </section>
            <section className={styles.card}>
              <h2>{sales ? "Financial summaries" : "Business records"}</h2>
              <p>
                {sales
                  ? "No financial summary grant is configured in this role preview."
                  : "Technical support does not automatically grant access to financial or customer records."}
              </p>
            </section>
          </>
        )}
        {path === "/administration" && (
          <>
            <section className={styles.card}>
              <h2>Account support</h2>
              <p>
                Minimal member status and recovery initiation are planned. Role
                grants remain under CEO authority.
              </p>
            </section>
            <section className={styles.card}>
              <h2>Platform Administration</h2>
              <p>
                IT requires explicit organization/environment grants. This role
                preview grants none. The separate local tool remains unchanged;
                production adjustments are disabled.
              </p>
            </section>
          </>
        )}
      </div>
    </>
  );
}
