"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { MatchScore, matchLabel } from "@/components/MatchScore";

interface Resume {
  id: string;
  title: string;
  isDefault: boolean;
}

interface JobAnalysis {
  summary?: string;
  required_skills?: string[];
  nice_to_have?: string[];
  experience_years?: number;
  education?: string;
  key_responsibilities?: string[];
}

interface Job {
  id: string;
  title: string;
  company: string;
  analysis: JobAnalysis | null;
}

interface MatchResult {
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  rationale: string;
}

export default function JobsPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeId, setResumeId] = useState("");

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    url: "",
    description: "",
  });

  const [job, setJob] = useState<Job | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [ats, setAts] = useState<{
    score: number;
    total: number;
    matched: string[];
    missing: string[];
  } | null>(null);
  const [tailored, setTailored] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [coverTone, setCoverTone] = useState("professional");
  const [coverLength, setCoverLength] = useState("medium");
  const [tailoredVerify, setTailoredVerify] = useState<{
    confidence: number;
    flagged: { text: string; reasons: string[] }[];
  } | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((d: Resume[]) => {
        if (Array.isArray(d)) {
          setResumes(d);
          const def = d.find((r) => r.isDefault) || d[0];
          if (def) setResumeId(def.id);
        }
      });
  }, []);

  // Prefill from the Jobward Chrome extension (#prefill=<encoded job JSON>).
  useEffect(() => {
    const m = window.location.hash.match(/prefill=(.+)$/);
    if (!m) return;
    try {
      const j = JSON.parse(decodeURIComponent(m[1]));
      setForm((f) => ({
        ...f,
        title: j.title || f.title,
        company: j.company || f.company,
        location: j.location || f.location,
        url: j.url || f.url,
        description: j.description || f.description,
      }));
      history.replaceState(null, "", window.location.pathname);
    } catch {
      /* ignore malformed prefill */
    }
  }, []);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function call<T>(
    label: string,
    url: string,
    body: unknown
  ): Promise<T | null> {
    setBusy(label);
    setError(null);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Request failed.");
        return null;
      }
      return d as T;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function analyzeJob() {
    setMatch(null);
    setAts(null);
    setTailored("");
    setCoverLetter("");
    setSaved(false);
    const d = await call<Job>("analyze", "/api/jobs", form);
    if (d) setJob(d);
  }

  async function scoreMatch() {
    if (!job || !resumeId) return;
    const d = await call<MatchResult>("match", "/api/match", {
      resumeId,
      jobId: job.id,
    });
    if (d) setMatch(d);
  }

  async function atsCheck() {
    if (!job || !resumeId) return;
    const d = await call<{
      score: number;
      total: number;
      matched: string[];
      missing: string[];
    }>("ats", "/api/ats", { resumeId, jobId: job.id });
    if (d) setAts(d);
  }

  async function tailorResume() {
    if (!job || !resumeId) return;
    const d = await call<{
      tailoredResume: string;
      verification: {
        confidence: number;
        flagged: { text: string; reasons: string[] }[];
      };
    }>("tailor", "/api/generate/tailor", { resumeId, jobId: job.id });
    if (d) {
      setTailored(d.tailoredResume);
      setTailoredVerify(d.verification);
    }
  }

  async function genCoverLetter() {
    if (!job || !resumeId) return;
    const d = await call<{ coverLetter: string }>(
      "cover",
      "/api/generate/cover-letter",
      { resumeId, jobId: job.id, tone: coverTone, length: coverLength }
    );
    if (d) setCoverLetter(d.coverLetter);
  }

  async function saveApplication() {
    if (!job) return;
    const d = await call("save", "/api/applications", {
      jobId: job.id,
      resumeId: resumeId || undefined,
      matchScore: match?.score,
      tailoredResume: tailored || undefined,
      coverLetter: coverLetter || undefined,
      status: "ready",
    });
    if (d) {
      setSaved(true);
      toast("Saved to applications", "success");
    }
  }

  const canAct = Boolean(job && resumeId);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Jobs &amp; Tailor</h1>
        <p className="text-sm text-slate-500">
          Paste a job, score your fit, then generate tailored materials.
        </p>
      </header>

      {resumes.length === 0 && (
        <div className="card mb-6 border-amber-200 bg-amber-50 text-sm text-amber-700">
          Add a resume first on the Resumes page.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: job input */}
        <section className="card space-y-4">
          <div>
            <label className="label">Resume to use</label>
            <select
              className="input"
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                  {r.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Job title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Company</label>
              <input
                className="input"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </div>
            <div>
              <label className="label">URL</label>
              <input
                className="input"
                value={form.url}
                onChange={(e) => update("url", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Job description</label>
            <textarea
              className="textarea min-h-[180px]"
              placeholder="Paste the full job description…"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            className="btn-primary"
            onClick={analyzeJob}
            disabled={busy === "analyze"}
          >
            {busy === "analyze" ? "Analyzing…" : "Analyze job"}
          </button>
        </section>

        {/* Right: results */}
        <section className="space-y-4">
          {job?.analysis ? (
            <div className="card">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                Job analysis
              </h3>
              {job.analysis.summary && (
                <p className="text-sm text-slate-600">{job.analysis.summary}</p>
              )}
              <SkillRow
                label="Required"
                items={job.analysis.required_skills}
                tone="brand"
              />
              <SkillRow
                label="Nice to have"
                items={job.analysis.nice_to_have}
                tone="slate"
              />
              {typeof job.analysis.experience_years === "number" && (
                <p className="mt-2 text-xs text-slate-500">
                  Experience: ~{job.analysis.experience_years} yrs
                </p>
              )}
            </div>
          ) : (
            <div className="card text-sm text-slate-400">
              Analysis and AI tools appear here after you analyze a job.
            </div>
          )}

          {job && (
            <div className="card space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-ghost"
                  onClick={scoreMatch}
                  disabled={!canAct || busy === "match"}
                >
                  {busy === "match" ? "Scoring…" : "Score match"}
                </button>
                <button
                  className="btn-ghost"
                  onClick={atsCheck}
                  disabled={!canAct || busy === "ats"}
                >
                  {busy === "ats" ? "Checking…" : "ATS check"}
                </button>
                <button
                  className="btn-ghost"
                  onClick={tailorResume}
                  disabled={!canAct || busy === "tailor"}
                >
                  {busy === "tailor" ? "Tailoring…" : "Tailor resume"}
                </button>
                <button
                  className="btn-ghost"
                  onClick={genCoverLetter}
                  disabled={!canAct || busy === "cover"}
                >
                  {busy === "cover" ? "Writing…" : "Cover letter"}
                </button>
                <select
                  className="input w-auto py-1 text-xs"
                  value={coverTone}
                  onChange={(e) => setCoverTone(e.target.value)}
                  title="Cover letter tone"
                >
                  <option value="professional">Professional</option>
                  <option value="warm">Warm</option>
                  <option value="bold">Bold</option>
                  <option value="concise">Concise</option>
                </select>
                <select
                  className="input w-auto py-1 text-xs"
                  value={coverLength}
                  onChange={(e) => setCoverLength(e.target.value)}
                  title="Cover letter length"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>

              {match && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-4">
                    <MatchScore score={match.score} />
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-200">
                        {matchLabel(match.score)}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {match.rationale}
                      </p>
                    </div>
                  </div>
                  <SkillRow
                    label="Matched"
                    items={match.matched_skills}
                    tone="emerald"
                  />
                  <SkillRow
                    label="Missing"
                    items={match.missing_skills}
                    tone="rose"
                  />
                </div>
              )}

              {ats && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono text-2xl font-bold"
                      style={{
                        color: ats.score >= 75 ? "#10D8A4" : ats.score >= 50 ? "#FBBF24" : "#FB7185",
                      }}
                    >
                      {ats.score}%
                    </span>
                    <span className="text-sm text-slate-500">
                      ATS keyword match ({ats.matched.length}/{ats.total})
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Aim for 75%+. Weave the missing keywords below into your
                    resume where they&apos;re genuinely true.
                  </p>
                  <SkillRow label="Missing keywords" items={ats.missing} tone="rose" />
                </div>
              )}

              <button
                className="btn-primary w-full"
                onClick={saveApplication}
                disabled={busy === "save"}
              >
                {saved
                  ? "✓ Saved to Applications"
                  : busy === "save"
                  ? "Saving…"
                  : "Save to Applications"}
              </button>
            </div>
          )}
        </section>
      </div>

      {(tailored || coverLetter) && (
        <p className="mt-6 text-xs text-slate-400">
          ✎ Review and edit below — nothing is downloaded until you export. The
          AI only reorders and rephrases your real experience; verify anything
          that looks off.
        </p>
      )}

      {tailored && tailoredVerify && (
        <div className="card mt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Authenticity check
            </h3>
            <span
              className="rounded-full px-2 py-0.5 font-mono text-xs font-medium"
              style={{
                background:
                  tailoredVerify.confidence >= 85
                    ? "rgba(16,216,164,0.15)"
                    : "rgba(251,191,36,0.15)",
                color:
                  tailoredVerify.confidence >= 85 ? "#10D8A4" : "#FBBF24",
              }}
            >
              {tailoredVerify.confidence}% grounded
            </span>
          </div>
          {tailoredVerify.flagged.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-700">
              ✓ Every line traces back to your original resume — no invented
              facts detected.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-slate-500">
                {tailoredVerify.flagged.length} line
                {tailoredVerify.flagged.length === 1 ? "" : "s"} to double-check
                (these contain numbers or terms not found in your original —
                some may be fine, like the company name):
              </p>
              {tailoredVerify.flagged.slice(0, 6).map((f, i) => (
                <div
                  key={i}
                  className="rounded-lg border-l-2 border-amber-400 bg-[rgba(251,191,36,0.08)] px-3 py-2"
                >
                  <p className="text-xs text-slate-300">{f.text}</p>
                  <p className="mt-1 text-[11px] text-amber-700">
                    {f.reasons.join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(tailored || coverLetter) && (
        <div className="mt-3 grid gap-6 lg:grid-cols-2">
          {tailored && (
            <OutputCard
              title="Tailored resume"
              value={tailored}
              onChange={setTailored}
            />
          )}
          {coverLetter && (
            <OutputCard
              title="Cover letter"
              value={coverLetter}
              onChange={setCoverLetter}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SkillRow({
  label,
  items,
  tone,
}: {
  label: string;
  items?: string[];
  tone: "brand" | "slate" | "emerald" | "rose";
}) {
  if (!items || items.length === 0) return null;
  const toneClass = {
    brand: "bg-brand-50 text-brand-700",
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  }[tone];
  return (
    <div className="mt-2">
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s) => (
          <span
            key={s}
            className={`rounded-md px-2 py-0.5 text-xs ${toneClass}`}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

async function downloadDoc(content: string, format: "pdf" | "docx", filename: string) {
  const r = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, format, filename }),
  });
  if (!r.ok) return;
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function OutputCard({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const fileBase = title.toLowerCase().replace(/\s+/g, "-");
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <div className="flex gap-2">
          <button className="btn-ghost text-xs" onClick={copy}>
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            className="btn-ghost text-xs"
            onClick={() => downloadDoc(value, "pdf", fileBase)}
          >
            PDF
          </button>
          <button
            className="btn-ghost text-xs"
            onClick={() => downloadDoc(value, "docx", fileBase)}
          >
            DOCX
          </button>
        </div>
      </div>
      <textarea
        className="textarea min-h-[320px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
