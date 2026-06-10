"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Step 1 — targets
  const [titles, setTitles] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(true);

  // Step 2 — resume
  const [resumeText, setResumeText] = useState("");

  // Step 3 — inbox
  const [appEmail, setAppEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setAppEmail(d?.user?.appEmail ?? null));
  }, []);

  async function saveTargets() {
    setBusy(true);
    await fetch("/api/searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: titles || "My search",
        query: titles,
        location,
        remoteOnly,
      }),
    });
    setBusy(false);
    setStep(1);
  }

  async function saveResume(skip = false) {
    if (!skip && resumeText.trim().length >= 30) {
      setBusy(true);
      const r = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "My resume", originalText: resumeText }),
      });
      setBusy(false);
      if (r.ok) toast("Resume saved & parsed", "success");
    }
    setStep(2);
  }

  async function uploadResume(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/resumes/upload", { method: "POST", body: fd });
    setBusy(false);
    e.target.value = "";
    if (r.ok) {
      toast("Resume uploaded & parsed", "success");
      setStep(2);
    } else {
      toast("Upload failed — try pasting instead.", "error");
    }
  }

  async function finish() {
    setBusy(true);
    await fetch("/api/jobs/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: titles || undefined }),
    });
    setBusy(false);
    toast("Your matches are ready", "success");
    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 text-center">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          Job<span className="text-brand-500">ward</span>
        </span>
        <p className="mt-1 text-sm text-slate-500">Let&apos;s set you up in 3 quick steps.</p>
      </div>

      {/* Step rail */}
      <div className="mb-5 flex items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-16 rounded-full transition-all"
            style={{
              background: i <= step ? "var(--accent)" : "rgba(255,255,255,0.1)",
              boxShadow: i <= step ? "0 0 10px var(--accent-glow)" : "none",
            }}
          />
        ))}
      </div>

      <div className="card">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                What are you looking for?
              </h2>
              <p className="text-sm text-slate-500">
                We&apos;ll use this to pull matching roles.
              </p>
            </div>
            <div>
              <label className="label">Job titles</label>
              <input
                className="input"
                placeholder="e.g. Frontend Engineer, Product Designer"
                value={titles}
                onChange={(e) => setTitles(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                placeholder="e.g. Remote, Bengaluru, New York"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
              />
              Prioritize remote roles
            </label>
            <button className="btn-primary w-full" onClick={saveTargets} disabled={busy}>
              {busy ? "Saving…" : "Continue"}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Add your resume</h2>
              <p className="text-sm text-slate-500">
                Paste it or upload a file — we extract and parse it with AI.
              </p>
            </div>
            <label className="btn-ghost w-full cursor-pointer">
              {busy ? "Reading…" : "Upload PDF / DOCX / TXT"}
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={uploadResume}
                disabled={busy}
              />
            </label>
            <p className="text-center text-xs uppercase tracking-wide text-slate-400">
              or paste
            </p>
            <textarea
              className="textarea min-h-[140px]"
              placeholder="Paste your resume text…"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
            <p className="text-xs text-slate-400">
              🔒 Your resume stays in your account — never sold or shared.
            </p>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => saveResume(true)}>
                Skip for now
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => saveResume(false)}
                disabled={busy}
              >
                {busy ? "Saving…" : "Continue"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center">
            <h2 className="text-base font-semibold text-slate-900">You&apos;re all set 🎉</h2>
            <p className="text-sm text-slate-500">
              This is your dedicated application inbox — send from it, and
              recruiter replies thread back into the app.
            </p>
            <div className="rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-3 font-mono text-sm font-semibold text-slate-200">
              {appEmail || "assigning…"}
            </div>
            <button className="btn-primary w-full" onClick={finish} disabled={busy}>
              {busy ? "Finding your matches…" : "Pull my first matches →"}
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-slate-500">
        <button
          onClick={() => router.push("/")}
          className="font-medium text-brand-600"
        >
          Skip setup
        </button>
      </p>
    </div>
  );
}
