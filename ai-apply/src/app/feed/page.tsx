"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { ListSkeleton } from "@/components/Skeleton";
import { MatchPill } from "@/components/MatchScore";

interface Job {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  url: string | null;
  description: string;
  postedDate: string | null;
  saved: boolean;
}

interface SourceCount {
  source: string;
  count: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string | null;
  remoteOnly: boolean;
}

export default function FeedPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sources, setSources] = useState<SourceCount[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);

  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string>("");
  const [scores, setScores] = useState<Record<string, number | "...">>({});
  const { toast } = useToast();

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (source) params.set("source", source);
    if (remoteOnly) params.set("remote", "true");
    const r = await fetch(`/api/jobs/feed?${params.toString()}`);
    const d = await r.json();
    setLoading(false);
    if (!r.ok) {
      setError(d.error || "Failed to load feed.");
      return;
    }
    setJobs(d.jobs);
    setSources(d.sources);
    return d.jobs.length as number;
  }, [q, source, remoteOnly]);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    const r = await fetch("/api/jobs/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q || undefined }),
    });
    const d = await r.json();
    setRefreshing(false);
    if (!r.ok) {
      setError(d.error || "Refresh failed.");
      toast(d.error || "Refresh failed.", "error");
      return;
    }
    toast(`Pulled ${d.added} new job${d.added === 1 ? "" : "s"} · ${d.total} total`, "success");
    await loadFeed();
  }

  // Initial load: fetch feed, and auto-refresh once if it's empty.
  useEffect(() => {
    (async () => {
      const count = await loadFeed();
      if (count === 0) refresh();
    })();
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          const def = d.find((x: { isDefault: boolean }) => x.isDefault) || d[0];
          if (def) setResumeId(def.id);
        }
      });
    loadSearches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSearches() {
    const r = await fetch("/api/searches");
    const d = await r.json();
    if (Array.isArray(d)) setSearches(d);
  }

  async function save(job: Job) {
    const r = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        resumeId: resumeId || undefined,
        status: "saved",
        matchScore: typeof scores[job.id] === "number" ? scores[job.id] : undefined,
      }),
    });
    if (r.ok) {
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, saved: true } : j))
      );
      toast(`Saved “${job.title}” to applications`, "success");
    } else {
      toast("Couldn't save that job.", "error");
    }
  }

  async function scoreJob(job: Job) {
    if (!resumeId) {
      setError("Add a resume first to score matches.");
      return;
    }
    setScores((s) => ({ ...s, [job.id]: "..." }));
    const r = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId, jobId: job.id }),
    });
    const d = await r.json();
    if (r.ok) setScores((s) => ({ ...s, [job.id]: d.score }));
    else {
      setScores((s) => {
        const next = { ...s };
        delete next[job.id];
        return next;
      });
      setError(d.error || "Scoring failed.");
    }
  }

  async function saveSearch() {
    await fetch("/api/searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: q || "All jobs",
        query: q || null,
        remoteOnly,
      }),
    });
    loadSearches();
  }

  function applySearch(s: SavedSearch) {
    setQ(s.query || "");
    setRemoteOnly(s.remoteOnly);
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Feed</h1>
          <p className="text-sm text-slate-500">
            Live jobs from Remotive, Arbeitnow{sources.some((s) => s.source === "adzuna") ? ", Adzuna" : ""} and more.
          </p>
        </div>
        <button className="btn-primary" onClick={refresh} disabled={refreshing}>
          {refreshing ? "Pulling live jobs…" : "↻ Refresh"}
        </button>
      </header>

      {/* Filters */}
      <div className="card mb-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="label">Search</label>
            <input
              className="input"
              placeholder="e.g. frontend engineer"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadFeed()}
            />
          </div>
          <div>
            <label className="label">Source</label>
            <select
              className="input"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="">All</option>
              {sources.map((s) => (
                <option key={s.source} value={s.source}>
                  {s.source} ({s.count})
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
            />
            Remote only
          </label>
          <button className="btn-ghost" onClick={loadFeed}>
            Apply
          </button>
          <button className="btn-ghost" onClick={saveSearch}>
            Save search
          </button>
        </div>

        {searches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-xs text-slate-400">Saved:</span>
            {searches.map((s) => (
              <button
                key={s.id}
                onClick={() => applySearch(s)}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="card mb-4 border-rose-200 bg-rose-50 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={5} />
      ) : jobs.length === 0 ? (
        <div className="card text-sm text-slate-500">
          No jobs yet. Hit Refresh to pull the latest listings.
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">
                    {job.title}
                    <span className="font-normal text-slate-500">
                      {" "}· {job.company}
                    </span>
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {job.location || "—"}
                    {job.remote && (
                      <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                        remote
                      </span>
                    )}
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                      {job.source}
                    </span>
                    {job.postedDate && (
                      <span className="ml-2">
                        {new Date(job.postedDate).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {job.description.slice(0, 240)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {scores[job.id] === "..." ? (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      scoring…
                    </span>
                  ) : typeof scores[job.id] === "number" ? (
                    <MatchPill score={scores[job.id] as number} />
                  ) : null}
                  <button
                    className="btn-ghost text-xs"
                    onClick={() => scoreJob(job)}
                  >
                    Score
                  </button>
                  <button
                    className="btn-primary text-xs disabled:opacity-60"
                    onClick={() => save(job)}
                    disabled={job.saved}
                  >
                    {job.saved ? "✓ Saved" : "Save"}
                  </button>
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-600 hover:underline"
                    >
                      View ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
