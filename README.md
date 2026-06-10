# Jobward

> The trustworthy AI job-application platform — discover live jobs, tailor your
> materials *honestly*, apply, interview-prep, and keep every recruiter reply in
> one inbox.

This repository contains the full project:

```
.
├── ai-apply/            # The Jobward app (Next.js full-stack) + Chrome extension
│   ├── src/             # UI, API routes, libs
│   ├── prisma/          # Database schema + seed
│   ├── extension/       # Chrome (MV3) autofill + save-to-Jobward extension
│   └── README.md        # App setup & run instructions
├── Jobright_Competitive_Analysis_and_Roadmap.md
├── Market_Feature_Universe_and_Differentiation.md
├── CHANGELOG.md         # Version history (this release = v1.0.0)
└── VERSION              # 1.0.0
```

## Quick start

```bash
cd ai-apply
npm install
cp .env.example .env      # set AUTH_SECRET; add ANTHROPIC_API_KEY for AI features
npm run db:push
npm run db:seed           # demo login: demo@aiapply.local / password123
npm run dev               # http://localhost:3000
```

See [`ai-apply/README.md`](ai-apply/README.md) for full details and the feature
list, and [`CHANGELOG.md`](CHANGELOG.md) for what shipped in v1.0.0.

## Versioning

This project follows semantic versioning. **v1.0.0** is the first complete
release (tagged `v1.0.0`). Ongoing work happens on the **`v2-dev`** branch and
ships as the next version.
