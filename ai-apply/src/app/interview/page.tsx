"use client";

import { useEffect, useState } from "react";

interface Application {
  id: string;
  job: { id: string; title: string; company: string };
}
interface Feedback {
  score: number;
  feedback: string;
  tip: string;
}

export default function InterviewPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [jobId, setJobId] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, Feedback | "loading">>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setApps(d);
          if (d[0]) setJobId(d[0].job.id);
        }
      });
  }, []);

  async function generate() {
    if (!jobId) return setError("Pick a role first (save a job to applications).");
    setBusy(true);
    setError(null);
    setQuestions([]);
    setFeedback({});
    setAnswers({});
    const r = await fetch("/api/interview/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(
        d.error?.includes("ANTHROPIC_API_KEY")
          ? "Add your Anthropic API key in .env to run mock interviews."
          : d.error || "Couldn't generate questions."
      );
      return;
    }
    setQuestions(d.questions || []);
  }

  async function evaluate(i: number, question: string) {
    const answer = answers[i] || "";
    if (answer.trim().length < 5) return;
    setFeedback((f) => ({ ...f, [i]: "loading" }));
    const r = await fetch("/api/interview/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer }),
    });
    const d = await r.json();
    if (r.ok) setFeedback((f) => ({ ...f, [i]: d }));
    else {
      setFeedback((f) => {
        const next = { ...f };
        delete next[i];
        return next;
      });
      setError(d.error || "Evaluation failed.");
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mock Interview</h1>
        <p className="text-sm text-slate-500">
          Practice real, role-specific questions and get instant AI coaching.
        </p>
      </header>

      <div className="card mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="label">Role</label>
          <select
            className="input"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
          >
            {apps.length === 0 && <option value="">No saved applications yet</option>}
            {apps.map((a) => (
              <option key={a.id} value={a.job.id}>
                {a.job.title} · {a.job.company}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={generate} disabled={busy || !jobId}>
          {busy ? "Generating…" : "Start mock interview"}
        </button>
      </div>

      {error && (
        <div className="card mb-4 border-rose-200 bg-rose-50 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, i) => {
          const fb = feedback[i];
          return (
            <div key={i} className="card">
              <p className="font-medium text-slate-200">
                <span className="mr-2 font-mono text-[var(--accent)]">Q{i + 1}</span>
                {q}
              </p>
              <textarea
                className="textarea mt-3 min-h-[110px]"
                placeholder="Type your answer…"
                value={answers[i] || ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  className="btn-ghost text-xs"
                  onClick={() => evaluate(i, q)}
                  disabled={fb === "loading" || (answers[i] || "").trim().length < 5}
                >
                  {fb === "loading" ? "Scoring…" : "Get feedback"}
                </button>
              </div>
              {fb && fb !== "loading" && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <span
                    className="font-mono text-lg font-bold"
                    style={{
                      color: fb.score >= 75 ? "#10D8A4" : fb.score >= 50 ? "#FBBF24" : "#FB7185",
                    }}
                  >
                    {fb.score}/100
                  </span>
                  <p className="mt-1 text-sm text-slate-300">{fb.feedback}</p>
                  <p className="mt-1 text-xs text-[var(--accent)]">💡 {fb.tip}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
