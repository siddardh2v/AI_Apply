"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  resumeCount: number;
  jobCount: number;
  total: number;
  byStatus: Record<string, number>;
  avgMatchScore: number | null;
  interviewRate: number;
  offerRate: number;
}

const PIPELINE = [
  { key: "saved", label: "Saved", color: "bg-slate-400" },
  { key: "ready", label: "Ready", color: "bg-amber-400" },
  { key: "applied", label: "Applied", color: "bg-brand-500" },
  { key: "interviewing", label: "Interviewing", color: "bg-violet-500" },
  { key: "offer", label: "Offer", color: "bg-emerald-500" },
  { key: "rejected", label: "Rejected", color: "bg-rose-400" },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setStats(d)))
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Your job search at a glance.
        </p>
      </header>

      {error && (
        <div className="card mb-6 border-rose-200 bg-rose-50 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Resumes" value={stats?.resumeCount} href="/resumes" />
        <StatCard label="Jobs in feed" value={stats?.jobCount} href="/feed" />
        <StatCard
          label="Applications"
          value={stats?.total}
          href="/applications"
        />
        <StatCard
          label="Avg. match"
          value={stats?.avgMatchScore ?? "—"}
          suffix={stats?.avgMatchScore != null ? "%" : ""}
        />
      </div>

      <section className="card mt-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Pipeline</h2>
        {stats && stats.total > 0 ? (
          <div className="space-y-3">
            {PIPELINE.map((stage) => {
              const count = stats.byStatus[stage.key] || 0;
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-slate-600">
                    {stage.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full ${stage.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium text-slate-700">
                    {count}
                  </span>
                </div>
              );
            })}
            <div className="mt-4 flex gap-6 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <span>
                Interview rate:{" "}
                <strong className="text-slate-900">
                  {stats.interviewRate}%
                </strong>
              </span>
              <span>
                Offer rate:{" "}
                <strong className="text-slate-900">{stats.offerRate}%</strong>
              </span>
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix = "",
  href,
}: {
  label: string;
  value: number | string | undefined;
  suffix?: string;
  href?: string;
}) {
  const body = (
    <div className="card transition hover:border-brand-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value ?? "–"}
        <span className="text-lg">{suffix}</span>
      </p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function EmptyState() {
  return (
    <div className="py-6 text-center text-sm text-slate-500">
      <p>No applications yet.</p>
      <p className="mt-2">
        Start by{" "}
        <Link href="/resumes" className="font-medium text-brand-600">
          adding a resume
        </Link>
        , then{" "}
        <Link href="/jobs" className="font-medium text-brand-600">
          paste a job
        </Link>{" "}
        to tailor and track.
      </p>
    </div>
  );
}
