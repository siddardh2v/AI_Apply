# Jobward Chrome Extension

Autofill job application forms across ATS platforms, and save any posting
straight into Jobward.

## Load it (development)

1. Open **chrome://extensions** in Chrome (or any Chromium browser).
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select this `extension/` folder.
4. Pin the Jobward icon to your toolbar.

## Use it

- Click the icon → expand **Your profile** → fill in your details and your
  Jobward URL (default `http://localhost:3000`) → **Save profile**.
- On any job application page, click **⚡ Autofill this page**. It fills name,
  email, phone, location, LinkedIn, and website by matching field labels, and
  **highlights any required field it couldn't map** (in amber) so nothing is
  silently skipped — the opposite of bots that break quietly on Workday.
- On any job posting, click **＋ Save job to Jobward**. It scrapes the title,
  company, URL, and description and opens Jobward's **Jobs & Tailor** page with
  everything pre-filled, ready to analyze and tailor.

## How it works

- Manifest V3, no bundler — plain HTML/CSS/JS.
- Autofill runs entirely in the page via the `scripting` API; **no data leaves
  your browser** for autofill.
- "Save job" passes the scraped posting to Jobward via the URL fragment
  (`/jobs#prefill=...`), so it's never sent to a server as a query parameter.

## Notes / roadmap

- Field mapping is heuristic and label-based; it handles Greenhouse, Lever,
  Ashby, and many custom forms. Workday's multi-step shadow-DOM forms are
  partially supported — unmapped fields are highlighted rather than mis-filled.
- A future version can authenticate to Jobward (API token) to save jobs
  silently and sync application status.
