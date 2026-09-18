# Internal dashboard foundation

Task 1.4 adds an independent Next.js App Router / TypeScript package. The home page is a development placeholder with no live records or login. The CEO interface is Phase 2 work.

Task 2.1 adds the responsive CEO-first shell with Overview, Company, Goals, Integrations, and Administration routes, active navigation, a skip link, and a preview member menu. These are page previews, not working authenticated business workflows. Formatting, lint, type checks, production build, and all five HTTP routes passed; browser checks covered desktop, 390px width, Company navigation, and the member menu. Task 2.2 will add representative sample-data views.

## Local setup

Task 2.3 adds a preview-role and preview-state selector above page content. Choose CEO, Sales, or IT and Ready, Loading, Empty, Unavailable, or Permission denied. Selection persists during navigation and resets on reload. Sales Administration is always shown as restricted in this preview. Role-specific personal goals are fictional. This is client-side presentation only: sample CEO content can still exist in delivered assets; never use these controls or components to authorize real data. Replace them with tested server-side permissions before real records are added.

Validation: formatting, lint, type checks, production build, browser role/state transitions, return-to-ready, cross-page role persistence, and mobile overflow checks passed locally. This is UI evidence, not authorization testing. Task 2.4 begins project-manager review.

Use Node 24 and npm. From the repository root:

```powershell
cd apps/dashboard
npm.cmd ci
npm.cmd run dev
```

Open http://127.0.0.1:3000. No environment file, Supabase credentials, PostgreSQL, or paid services are required. `.env.example` documents future public configuration; do not add live secrets for this foundation. The Supabase SDK and auth integration are intentionally deferred to their implementation tasks.

## Checks and production-mode smoke check

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd start
```

`check` runs Prettier, ESLint, and generated-route TypeScript checks. `format` applies formatting. `start` serves the built app locally on port 3000; this is not a deployment or production-readiness claim. No unit tests are added for the static placeholder; meaningful domain, authorization, and browser tests accompany those features in later tasks.

The dashboard has its own exact dependency versions and lockfile. ESLint 9.39.5 is temporarily pinned because the Next.js React/import/accessibility plugins do not yet support ESLint 10; npm reports its upstream deprecation. Revisit the toolchain together when compatible releases are available. Do not override peer dependencies to upgrade ESLint alone.

## Boundaries and CI

Root `npm.cmd start`, `npm.cmd test`, and `npm.cmd run db:setup` still belong to the PA-01 local admin tool. Its port is 4317; its fixture database and keys are separate. Nothing in this dashboard imports that server or exposes its controls.

`.github/workflows/dashboard.yml` runs clean install, formatting, lint, type checking, and a production build on Node 24. It does not deploy or run PA-01 database tests, which require their isolated local database. GitHub-hosted execution must be verified after pushing; local checks alone do not establish CI success.

The eventual web deployment root is `apps/dashboard`. The current page is publicly renderable and contains no sensitive data. Add verified authentication and authorization before adding company records. No sample/production data switch or privileged client exists in this package.

Installation follows the [official Next.js guide](https://nextjs.org/docs/app/getting-started/installation); lint runs separately because builds do not run it automatically.
