"use client";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    highlight: false,
    features: [
      "Live job feed (all sources)",
      "1 resume + AI parsing",
      "5 AI tailors / cover letters per month",
      "Application tracker + Kanban",
      "Your own application inbox",
    ],
    cta: "Current plan",
  },
  {
    name: "Pro",
    price: "$12",
    cadence: "/ month",
    highlight: true,
    features: [
      "Everything in Free",
      "Unlimited AI tailoring & cover letters",
      "AI Copilot + match scoring",
      "Send email from your app inbox",
      "Real-time job alerts",
      "Authenticity checks on every resume",
    ],
    cta: "Upgrade to Pro",
  },
  {
    name: "Team",
    price: "$39",
    cadence: "/ month",
    highlight: false,
    features: [
      "Everything in Pro",
      "Up to 5 seats",
      "Shared pipelines & templates",
      "Priority support",
    ],
    cta: "Start a team",
  },
];

export default function PricingPage() {
  return (
    <div>
      <header className="mb-2 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Simple, fair pricing</h1>
        <p className="mt-1 text-sm text-slate-500">
          One low monthly price — not the $40/mo most tools charge. Cancel in one
          click, anytime. No auto-renewal traps, ever.
        </p>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className="card flex flex-col"
            style={
              t.highlight
                ? { borderColor: "var(--accent)", boxShadow: "0 0 24px var(--accent-glow)" }
                : undefined
            }
          >
            {t.highlight && (
              <span className="mb-2 self-start rounded-full bg-brand-50 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-brand-700">
                Most popular
              </span>
            )}
            <h2 className="font-mono text-lg font-semibold text-slate-900">
              {t.name}
            </h2>
            <p className="mt-1">
              <span className="text-3xl font-bold text-slate-900">{t.price}</span>{" "}
              <span className="text-sm text-slate-400">{t.cadence}</span>
            </p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-300">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-[var(--accent)]">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={t.highlight ? "btn-primary mt-5 w-full" : "btn-ghost mt-5 w-full"}
              onClick={() =>
                alert(
                  "Billing isn't wired in this build — connect a payment provider (e.g. Stripe) to enable upgrades."
                )
              }
            >
              {t.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        🔒 We never sell your data. Export or delete everything anytime from
        Settings.
      </p>
    </div>
  );
}
