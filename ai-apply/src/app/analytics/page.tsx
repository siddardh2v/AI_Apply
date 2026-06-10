"use client";

import { useEffect, useState } from "react";

interface Analytics {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  resumes: { title: string; total: number; interviews: number; interviewRate: number }[];
  applied: number;
  interviews: number;
  offers: number;
  interviewRate: number;
  offerRate: number;
  avgResponseDays: number | null;
}

const FUNNEL = ["saved", "applied", "interviewing", "offer", "rejected"];

export default function AnalyticsPage() {
  const [a, setA] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => !d.error && setA(d));
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">
          How your search is actually performing.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Applications" value={a?.total} />
        <Stat label="Interview rate" value={a?.interviewRate} suffix="%" />
        <Stat label="Offer rate" value={a?.offerRate} suffix="%" />
        <Stat
          label="Avg. response"
          value={a?.avgResponseDays ?? "—"}
          suffix={a?.avgResponseDays != null ? "d" : ""}
        />
      </div>

      <section className="card mt-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Funnel</h2>
        {a && a.total > 0 ? (
          <div className="space-y-3">
            {FUNNEL.map((s) => {
              const count = a.byStatus[s] || 0;
              const pct = a.total ? (count / a.total) * 100 : 0;
              return (
                <Bar key={s} label={s} count={count} pct={pct} color="var(--accent)" />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No applications yet.</p>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            Applications by source
          </h2>
          {a && Object.keys(a.bySource).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(a.bySource)
                .sort((x, y) => y[1] - x[1])
                .map(([src, count]) => (
                  <Bar
                    key={src}
                    label={src}
                    count={count}
                    pct={a.total ? (count / a.total) * 100 : 0}
                    color="#10D8A4"
                  />
                ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No data yet.</p>
          )}
        </section>

        <section className="card">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">
            Resume performance (A/B)
          </h2>
          <p className="mb-3 text-xs text-slate-400">
            Which resume gets the most interviews.
          </p>
          {a && a.resumes.length > 0 ? (
            <div className="space-y-2">
              {a.resumes
                .sort((x, y) => y.interviewRate - x.interviewRate)
                .map((r) => (
                  <div
                    key={r.title}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-slate-300">{r.title}</span>
                    <span className="shrink-0 font-mono text-xs text-slate-400">
                      {r.interviews}/{r.total} ·{" "}
                      <span className="text-[var(--accent)]">{r.interviewRate}%</span>
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Attach resumes to applications to compare them.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix = "" }: { label: string; value: number | string | undefined; suffix?: string }) {
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold text-slate-900">
        {value ?? "–"}
        <span className="text-lg">{suffix}</span>
      </p>
    </div>
  );
}

function Bar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 truncate text-sm capitalize text-slate-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}66` }} />
      </div>
      <span className="w-8 text-right font-mono text-sm text-slate-700">{count}</span>
    </div>
  );
}
