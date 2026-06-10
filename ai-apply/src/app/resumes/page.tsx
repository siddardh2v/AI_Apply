"use client";

import { useEffect, useState } from "react";

interface ParsedResume {
  summary?: string;
  skills?: string[];
  work_experience?: { title: string; company: string; duration: string }[];
  education?: string[];
  certifications?: string[];
}

interface Resume {
  id: string;
  title: string;
  originalText: string;
  parsedContent: ParsedResume | null;
  isDefault: boolean;
  createdAt: string;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/resumes");
    const d = await r.json();
    if (Array.isArray(d)) setResumes(d);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const r = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, originalText: text }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) {
      setError(d.error || "Failed to save resume.");
      return;
    }
    setTitle("");
    setText("");
    load();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/resumes/upload", { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    setUploading(false);
    e.target.value = "";
    if (!r.ok) {
      setError(d.error || "Upload failed.");
      return;
    }
    load();
  }

  async function setDefault(id: string) {
    await fetch(`/api/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Resumes</h1>
        <p className="text-sm text-slate-500">
          Paste a resume — Claude extracts your skills, experience, and
          education automatically.
        </p>
      </header>

      <div className="card mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-700">
            Upload a file
          </p>
          <p className="text-xs text-slate-400">
            PDF, DOCX, or TXT — we extract the text and parse it.
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            🔒 Stays in your account — never sold or shared.
          </p>
        </div>
        <label className="btn-ghost cursor-pointer">
          {uploading ? "Reading file…" : "Choose file"}
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      </div>

      <p className="mb-4 text-center text-xs uppercase tracking-wide text-slate-400">
        or paste manually
      </p>

      <form onSubmit={submit} className="card mb-8 space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            placeholder="e.g. Software Engineer — 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Resume text</label>
          <textarea
            className="textarea min-h-[200px]"
            placeholder="Paste the full text of your resume here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="btn-primary" disabled={saving}>
          {saving ? "Parsing with Claude…" : "Save & parse resume"}
        </button>
      </form>

      <div className="space-y-4">
        {resumes.length === 0 && (
          <p className="text-sm text-slate-500">No resumes yet.</p>
        )}
        {resumes.map((resume) => (
          <div key={resume.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {resume.title}
                  {resume.isDefault && (
                    <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      default
                    </span>
                  )}
                </h3>
                {resume.parsedContent?.summary && (
                  <p className="mt-1 text-sm text-slate-600">
                    {resume.parsedContent.summary}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!resume.isDefault && (
                  <button
                    className="btn-ghost text-xs"
                    onClick={() => setDefault(resume.id)}
                  >
                    Set default
                  </button>
                )}
                <button
                  className="btn-ghost text-xs text-rose-600"
                  onClick={() => remove(resume.id)}
                >
                  Delete
                </button>
              </div>
            </div>

            {resume.parsedContent?.skills &&
              resume.parsedContent.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {resume.parsedContent.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

            {!resume.parsedContent && (
              <p className="mt-3 text-xs text-amber-600">
                Not parsed yet — check that your ANTHROPIC_API_KEY is set.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
