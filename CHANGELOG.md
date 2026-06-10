# Changelog

All notable changes to **Jobward** are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [Unreleased] — v2 (in progress)

Work in progress lands here and ships as the next version. Candidates:
- Extension API-token auth (silent save + status sync)
- Referral / insider-contact finder (needs a people-data provider)
- Salary insights (needs a comp-data source)
- Real billing (Stripe) for the pricing tiers
- Real-time job alerts (email/push) + company career-page watchers

---

## [1.0.0] — 2026-06-09

First complete release. A trustworthy, AI-powered job-application platform
(Next.js full-stack: UI + API + DB + AI) plus a companion Chrome extension.

### Accounts & data
- Email/password auth (bcrypt + JWT cookie sessions), per-user data isolation
- 3-step onboarding (targets → resume → inbox + first matches)
- Settings + privacy: data export (JSON) and account delete; trust microcopy

### Resumes & content
- Resume upload (PDF/DOCX/TXT) + paste, parsed by Claude
- AI resume tailoring per job, with an **authenticity check** (% grounded +
  flagged facts not in your resume) and edit-before-export
- Cover-letter generator with tone (Professional/Warm/Bold/Concise) + length
- Export tailored resume & cover letter to PDF and DOCX
- **ATS keyword score + gap report** (Jobscan-style, no API key needed)

### Jobs & matching
- Live job feed from Remotive, Arbeitnow, Greenhouse, Lever (+ optional Adzuna),
  deduped and refreshed on a schedule
- AI match scoring (0–100) with animated, color-coded badge + skills breakdown
- Saved searches; one-click save to applications

### Apply & track
- Application tracker with **drag-drop Kanban** board + list view
- "Ready to apply" queue (human-in-the-loop submit) + follow-up reminders
- **Analytics dashboard**: interview/offer rates, response time, by-source,
  and resume A/B performance

### Outreach (AI inbox)
- Per-user application inbox address + per-application reply addresses
- Compose / AI-draft (application & follow-up) / send via Resend or SMTP
- Inbound webhook (Cloudflare Email Routing) + simulate-reply for testing
- Unified threaded inbox

### Interview & copilot
- **Mock interview**: role-specific + behavioral questions, AI scoring + coaching
- **AI Copilot** chat grounded in the user's resume, applications, and feed

### Experience
- Dark / neon design system, glassmorphism, animations, toasts, skeletons
- PWA / installable (manifest + service worker)
- Pricing page with fair, one-click-cancel messaging

### Chrome extension (Manifest V3)
- On-page autofill across ATS forms with graceful highlighting of unmapped fields
- "Save job to Jobward" (scrape → prefill the Jobs page)

### Docs
- Competitive analysis vs Jobright; full market feature-universe & differentiation brief

> Renamed from "AI Apply" to **Jobward** to avoid collision with aiapply.co.
