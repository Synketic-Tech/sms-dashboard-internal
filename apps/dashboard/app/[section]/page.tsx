import { notFound } from "next/navigation";
import { SampleSection } from "../sample-views";
import styles from "../page.module.css";
const pages = {
  company: {
    title: "Company information",
    intro: "A shared foundation for the way we work.",
    cards: [
      [
        "Strategy & updates",
        "Company direction, decisions, and team announcements.",
      ],
      ["Team resources", "Sales resources and technical support procedures."],
    ],
  },
  goals: {
    title: "Goals & priorities",
    intro: "Keep commitments visible and progress clear.",
    cards: [
      [
        "Company goals",
        "Shared priorities, accountable owners, and progress updates.",
      ],
      [
        "Personal goals",
        "Private by default, with explicit read-only sharing.",
      ],
    ],
  },
  integrations: {
    title: "Business connections",
    intro: "Bring the right information into your business view.",
    cards: [
      ["QuickBooks", "Financial reporting · Not connected"],
      ["Stripe", "Payment reporting · Not connected"],
      ["HubSpot", "Sales pipeline · Not connected"],
      ["Customer dashboard", "Scoped customer reporting · Not connected"],
    ],
  },
  administration: {
    title: "Administration",
    intro: "Manage the workspace and support the platform.",
    cards: [
      [
        "Membership & access",
        "Founder/CEO, Sales director, and IT/systems architect. Real membership management is not implemented.",
      ],
      [
        "Platform Administration",
        "Intended for Founder/CEO and IT with explicit organization/environment grants. Sales has no default access. The separate local admin prototype runs on port 4317; production adjustments remain disabled.",
      ],
    ],
  },
} as const;
export function generateStaticParams() {
  return Object.keys(pages).map((section) => ({ section }));
}
export const dynamicParams = false;
export default async function Section({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!Object.hasOwn(pages, section)) notFound();
  const page = pages[section as keyof typeof pages];
  return (
    <>
      <p className={styles.eyebrow}>COMPANY WORKSPACE</p>
      <h1>{page.title}</h1>
      <p className={styles.intro}>{page.intro}</p>
      {section !== "administration" ? (
        <SampleSection section={section} />
      ) : (
        <div className={styles.grid}>
          {page.cards.map(([title, text]) => (
            <section key={title} className={styles.card}>
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
        </div>
      )}
      <p className={styles.note}>
        Page preview · Workflows and live information will be added in later
        tasks.
      </p>
    </>
  );
}
