This is the WHEL (Women's Health Evidence Lab) research tool — a drug repurposing signal aggregator for under-researched female hormonal conditions.

## Data Sources

WHEL aggregates signals from six data pipelines, each mapping to a specific signal type in the UI:

| Pipeline | File | Signal Type Tab | Auth Required |
|---|---|---|---|
| PubMed + Claude | `scripts/research-pipeline.js` | Direct Research | Anthropic API key |
| OpenFDA FAERS | `scripts/openfda-pipeline.js` | Cross-Condition Signals | None (public API) |
| ClinicalTrials.gov | `scripts/clinicaltrials-pipeline.js` | Direct Research | None (public API) |
| SIDER | `scripts/sider-pipeline.js` | Pathway Insights | None (public data) |
| EudraVigilance EVDAS | `scripts/eudravigilance-pipeline.js` | Cross-Condition Signals | Free EMA account (see below) |
| Open Targets Platform | `scripts/opentargets-pipeline.js` | Pathway Insights | None (public API) |

### Running a pipeline

All pipelines output SQL to stdout and progress to stderr:

```bash
node scripts/research-pipeline.js "endometriosis" > output.sql
node scripts/openfda-pipeline.js "statins" > output.sql
node scripts/clinicaltrials-pipeline.js "metformin" > output.sql
node scripts/opentargets-pipeline.js "endometriosis" > output.sql
node scripts/eudravigilance-pipeline.js "statins" > output.sql   # requires EMA_SESSION_COOKIE
```

Add `--debug` to any pipeline to inspect API responses before Claude analysis.

### EudraVigilance access

The EudraVigilance EVDAS database (European Medicines Agency adverse event reports) requires a free registered account. The substance name lookup (`adrreports.eu`) is public; the ICSR line listing data requires a session cookie:

1. Register at https://register.ema.europa.eu (no charge, research access)
2. Log in at https://dap.ema.europa.eu
3. Open DevTools > Application > Cookies > `dap.ema.europa.eu`
4. Copy the `_WL_AUTHCOOKIE_JSESSIONID` or `OAMAuthnCookie` value
5. Add to `.env.local`: `EMA_SESSION_COOKIE=_WL_AUTHCOOKIE_JSESSIONID=<value>`

Session cookies expire after inactivity; re-copy if you see auth errors.

### Open Targets Platform

Queries the Open Targets GraphQL API at `https://api.platform.opentargets.org/api/v4/graphql`. No authentication required. Retrieves drug candidates and biological target associations for each condition, with evidence type scores (genetic association, clinical, literature). Routes to the Pathway Insights tab.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
