"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { MatchPill } from "@/components/MatchScore";

interface Application {
  id: string;
  status: string;
  matchScore: number | null;
  tailoredResume: string | null;
  coverLetter: string | null;
  notes: string | null;
  appliedDate: string | null;
  createdAt: string;
  job: { title: string; company: string; location: string | null; url: string | null };
  resume: { id: string; title: string } | null;
}

const STATUSES = [
  "saved",
  "tailoring",
  "ready",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

const STATUS_STYLE: Record<string, string> = {
  saved: "bg-slate-100 text-slate-600",
  tailoring: "bg-amber-100 text-amber-700",
  ready: "bg-amber-100 text-amber-700",
  applied: "bg-brand-50 text-brand-700",
  interviewing: "bg-violet-100 text-violet-700",
  offer: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const { toast } = useToast();

  async function load() {
    const r = await fetch("/api/applications");
    const d = await r.json();
    if (Array.isArray(d)) setApps(d);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast(`Moved to “${status}”`, "success");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    load();
  }

  const queue = apps.filter((a) => a.status === "ready" || a.status === "saved");

  return (
    <div>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-500">
            Track every application from saved to offer.
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-[var(--border)] p-0.5">
          {(["board", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="rounded-full px-3 py-1 font-mono text-xs transition"
              style={
                view === v
                  ? { background: "var(--accent)", color: "#04121a" }
                  : { color: "var(--text-muted)" }
              }
            >
              {v === "board" ? "Board" : "List"}
            </button>
          ))}
        </div>
      </header>

      {view === "board" && <Board apps={apps} onMove={setStatus} />}

      {view === "list" && queue.length > 0 && (
        <div className="card mb-6 border-brand-100 bg-brand-50/40">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Ready to apply ({queue.length})
          </h2>
          <div className="space-y-2">
            {queue.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2"
              >
                <span className="text-sm text-slate-700">
                  {a.job.title} · {a.job.company}
                  {a.matchScore != null && (
                    <span className="ml-2 inline-flex align-middle">
                      <MatchPill score={a.matchScore} />
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {a.job.url && (
                    <a
                      href={a.job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost text-xs"
                    >
                      Open posting ↗
                    </a>
                  )}
                  <button
                    className="btn-primary text-xs"
                    onClick={() => setStatus(a.id, "applied")}
                  >
                    Mark applied
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Open each posting, submit your tailored materials, then mark it
            applied. (We prep everything; you stay in control of the submit.)
          </p>
        </div>
      )}

      {view === "list" &&
        (apps.length === 0 ? (
        <p className="text-sm text-slate-500">
          No applications yet. Save one from the Jobs &amp; Tailor page.
        </p>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {a.job.title}{" "}
                    <span className="font-normal text-slate-500">
                      · {a.job.company}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {a.job.location || "—"}
                    {a.matchScore != null && (
                      <span className="ml-2 inline-flex align-middle">
                        <MatchPill score={a.matchScore} />
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLE[a.status] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {a.status}
                  </span>
                  <select
                    className="input w-auto py-1 text-xs"
                    value={a.status}
                    onChange={(e) => setStatus(a.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {(a.tailoredResume || a.coverLetter) && (
                    <button
                      className="btn-ghost text-xs"
                      onClick={() => setOpenId(openId === a.id ? null : a.id)}
                    >
                      {openId === a.id ? "Hide docs" : "View docs"}
                    </button>
                  )}
                  <a
                    href={`/emails?applicationId=${a.id}`}
                    className="btn-ghost text-xs"
                  >
                    Email
                  </a>
                  <button
                    className="btn-ghost text-xs text-rose-600"
                    onClick={() => remove(a.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {openId === a.id && (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {a.tailoredResume && (
                    <Doc title="Tailored resume" body={a.tailoredResume} />
                  )}
                  {a.coverLetter && (
                    <Doc title="Cover letter" body={a.coverLetter} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        ))}
    </div>
  );
}

function Board({
  apps,
  onMove,
}: {
  apps: Application[];
  onMove: (id: string, status: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STATUSES.map((col) => {
        const items = apps.filter((a) => a.status === col);
        return (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) onMove(dragId, col);
              setDragId(null);
            }}
            className="w-56 shrink-0 rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] p-2"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400">
                {col}
              </span>
              <span className="text-[11px] text-slate-500">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((a) => (
                <div
                  key={a.id}
                  draggable
                  onDragStart={() => setDragId(a.id)}
                  className="cursor-grab rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2 transition hover:border-[var(--accent)]"
                >
                  <p className="text-xs font-medium text-slate-200">
                    {a.job.title}
                  </p>
                  <p className="text-[11px] text-slate-400">{a.job.company}</p>
                  {a.matchScore != null && (
                    <div className="mt-1">
                      <MatchPill score={a.matchScore} />
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <p className="px-1 py-3 text-center text-[11px] text-slate-600">
                  drop here
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Doc({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-1 text-xs font-semibold text-slate-500">{title}</p>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs text-slate-700">
        {body}
      </pre>
    </div>
  );
}
