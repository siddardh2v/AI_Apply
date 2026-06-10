# Jobward

The trustworthy job copilot — discover live jobs, score your fit, tailor your
resume and cover letter *honestly*, apply, and run your outreach, all in one
app. Built with Next.js (one deployable app: UI + API + DB + AI).

> Formerly "AI Apply" — renamed to **Jobward** to avoid collision with the
> existing aiapply.co product.

## What it does

- **Accounts** — email/password sign up & sign in; all your data is private to you.
- **Resumes** — paste text or upload a **PDF / DOCX / TXT**; Claude extracts your
  skills, experience, and education.
- **Live job feed** — pulls real listings from **Remotive** and **Arbeitnow**
  (no key needed), plus optional **Greenhouse**, **Lever**, and **Adzuna**.
  Deduped, filterable, auto-refreshed on a schedule.
- **Match scoring** — Claude scores how well you fit a job (0–100) with matched
  and missing skills.
- **Tailoring** — generates a job-specific resume and cover letter; export to
  **PDF or DOCX**.
- **Applications tracker** — pipeline from saved → applied → offer, with a
  "Ready to apply" queue (open the posting, submit, mark applied).
- **In-app email** — compose, AI-draft application & follow-up emails, send via
  Resend or SMTP, and keep every message logged against the job. Follow-up
  reminders surface when an application goes quiet.

## Quick start

```bash
npm install
cp .env.example .env        # then set AUTH_SECRET (any long random string)
npm run db:push             # create the local database
npm run db:seed             # optional: demo account + sample resume
npm run dev
```

Open http://localhost:3000. On Windows you can instead double-click
**`Start AI Apply.bat`**, which runs all of the above in its own window.

Demo login (after seeding): **demo@aiapply.local** / **password123**

## Which features need a key?

| Feature | Needs | Without it |
|--------|-------|-----------|
| Accounts, job feed, save/track, apply queue | nothing | fully works |
| Resume parse, match score, tailoring, cover letters, AI email drafts | `ANTHROPIC_API_KEY` | those buttons show a "key not set" message |
| Sending email | `RESEND_API_KEY` **or** `SMTP_*` | compose & save drafts still work |
| Extra job sources | `JOB_GREENHOUSE_COMPANIES` / `JOB_LEVER_COMPANIES` / Adzuna keys | Remotive + Arbeitnow still flow |

All keys are documented in `.env.example`. Add them anytime and restart `npm run dev`.

## Project structure

```
src/
  app/
    page.tsx                 Dashboard
    signin, signup           Auth pages
    feed/                    Live job feed
    resumes/                 Add / upload / manage resumes
    jobs/                    Paste a job → analyze, match, tailor, cover letter
    applications/            Tracker + "ready to apply" queue
    emails/                  Compose, AI-draft, send, log, follow-ups
    api/                     auth, resumes(+upload), jobs(+feed/refresh),
                             match, generate, applications, searches,
                             emails(+draft), export, stats
  lib/
    auth.ts, jwt.ts          Session auth (bcrypt + jose)
    anthropic.ts, prompts.ts Claude integration
    sources/                 Job-source clients + aggregator
    ingest.ts                Dedupe + upsert jobs
    email.ts                 Resend / SMTP provider abstraction
    export.ts                PDF / DOCX generation
  instrumentation.ts         Background live-job refresh loop
prisma/schema.prisma         User, Resume, JobPosting, Application,
                             SavedSearch, EmailMessage
```

## How the live feed stays fresh

`src/instrumentation.ts` pulls from all configured sources on startup and every
`JOB_REFRESH_MINUTES` (default 30) while the server runs. For serverless/
production, disable that and hit `POST /api/jobs/refresh` from a real cron
instead.

## Production notes

- Switch the Prisma datasource to `postgresql` and set `DATABASE_URL`, then
  `npx prisma migrate deploy`.
- Deploy on Vercel + managed Postgres (Supabase / Neon / Railway); run the
  refresh cron via Vercel Cron or similar.
- Set a strong `AUTH_SECRET`.

## A note on "auto-apply" and scraping

This app deliberately keeps a human in the loop for the final submit, and pulls
jobs only from official/public APIs. Silent auto-submission and scraping
LinkedIn/Indeed/Glassdoor violate those sites' Terms of Service and risk account
bans — so the value here is in discovery, matching, tailoring, and outreach,
with you in control of the click that sends an application.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:push` | Create/update the database from the schema |
| `npm run db:seed` | Insert the demo account + sample resume |
| `npm run db:studio` | Inspect data in Prisma Studio |
| `npm run typecheck` | TypeScript check |
