"use client";
import Link from "next/link";
import { useState } from "react";
import {
  PreviewContent,
  roleNames,
  type PreviewRole,
  type PreviewState,
} from "./preview-content";
import { usePathname } from "next/navigation";
import styles from "./shell.module.css";
const links = [
  ["/", "Overview"],
  ["/company", "Company"],
  ["/goals", "Goals"],
  ["/integrations", "Integrations"],
  ["/administration", "Administration"],
];
export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<PreviewRole>("ceo");
  const [state, setState] = useState<PreviewState>("ready");
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main-content">
        Skip to content
      </a>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/">
          SYNKETIC<small>Motion Systems Inc.</small>
        </Link>
        <p className={styles.caption}>COMPANY WORKSPACE</p>
        <nav aria-label="Main navigation">
          {links.map(([href, label], i) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
            >
              <span aria-hidden="true">0{i + 1}</span>
              {label}
            </Link>
          ))}
        </nav>
        <p className={styles.motto}>
          A shared view.
          <br />A clear direction.
        </p>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <span>Development preview · No live data</span>
          <details className={styles.member}>
            <summary>{roleNames[role]} ▾</summary>
            <div>
              <strong>{roleNames[role]} preview</strong>
              <p>
                This is a preview identity. Sign-in and permissions are not
                active.
              </p>
              <Link href="/goals">View goals</Link>
              <Link href="/administration">Membership &amp; access</Link>
            </div>
          </details>
        </header>
        <main id="main-content" tabIndex={-1} className={styles.content}>
          <section
            className={styles.previewControls}
            aria-label="UI preview controls"
          >
            <label>
              Preview role
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as PreviewRole);
                  setState("ready");
                }}
              >
                {Object.entries(roleNames).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preview state
              <select
                value={state}
                onChange={(event) =>
                  setState(event.target.value as PreviewState)
                }
              >
                <option value="ready">Ready</option>
                <option value="loading">Loading</option>
                <option value="empty">Empty</option>
                <option value="unavailable">Unavailable</option>
                <option value="denied">Permission denied</option>
              </select>
            </label>
            <p>
              UI demonstrations only. No authentication or authorization.
              Selections reset on reload.
            </p>
          </section>
          <PreviewContent
            role={role}
            state={state}
            path={pathname}
            onReset={() => setState("ready")}
          >
            {children}
          </PreviewContent>
        </main>
        <footer className={styles.footer}>
          Synketic Motion Systems Inc. · Internal workspace preview
        </footer>
      </div>
    </div>
  );
}
