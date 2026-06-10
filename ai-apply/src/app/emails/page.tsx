"use client";

import { useEffect, useState } from "react";

interface JobLite {
  title: string;
  company: string;
}
interface Application {
  id: string;
  status: string;
  appliedDate: string | null;
  nextFollowUpAt: string | null;
  replyToken: string | null;
  job: JobLite;
}
interface EmailMessage {
  id: string;
  toAddress: string | null;
  fromAddress: string | null;
  subject: string;
  body: string;
  status: string;
  direction: string;
  createdAt: string;
  application: { job: JobLite } | null;
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  received: "bg-brand-50 text-brand-700",
};

export default function EmailsPage() {
  const [appEmail, setAppEmail] = useState<string | null>(null);
  const [inboxDomain, setInboxDomain] = useState("");
  const [apps, setApps] = useState<Application[]>([]);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [provider, setProvider] = useState<string | null>(null);

  const [applicationId, setApplicationId] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setAppEmail(d?.user?.appEmail ?? null));
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setApps(d));
    loadEmails();
    const pre = new URLSearchParams(window.location.search).get("applicationId");
    if (pre) setApplicationId(pre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadEmails() {
    const r = await fetch("/api/emails");
    const d = await r.json();
    if (r.ok) {
      setEmails(d.emails);
      setProvider(d.provider);
      setInboxDomain(d.inboxDomain);
    }
  }

  const selectedApp = apps.find((a) => a.id === applicationId);
  const replyAddress =
    selectedApp?.replyToken && inboxDomain
      ? `${selectedApp.replyToken}@${inboxDomain}`
      : null;

  async function aiDraft(type: "application" | "follow-up") {
    if (!applicationId) return setError("Pick an application to draft for.");
    setBusy(`draft-${type}`);
    setError(null);
    const r = await fetch("/api/emails/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, type }),
    });
    const d = await r.json();
    setBusy(null);
    if (!r.ok) return setError(d.error || "Draft failed.");
    setSubject(d.subject);
    setBody(d.body);
  }

  async function submit(send: boolean) {
    setBusy(send ? "send" : "save");
    setError(null);
    setNote(null);
    const r = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: applicationId || undefined, to, subject, body, send }),
    });
    const d = await r.json();
    setBusy(null);
    if (!r.ok) return setError(d.error || "Failed.");
    setNote(d.warning || (send ? "Sent!" : "Saved as draft."));
    setSubject("");
    setBody("");
    setTo("");
    loadEmails();
    refreshApps();
  }

  async function simulateReply() {
    if (!applicationId) return setError("Pick an application to simulate a reply for.");
    setBusy("sim");
    setError(null);
    setNote(null);
    const r = await fetch("/api/email/simulate-inbound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId }),
    });
    const d = await r.json();
    setBusy(null);
    if (!r.ok) return setError(d.error || "Simulation failed.");
    setNote("A simulated recruiter reply just landed in your inbox below.");
    loadEmails();
    refreshApps();
  }

  function refreshApps() {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setApps(d));
  }

  const now = Date.now();
  const followUps = apps.filter(
    (a) =>
      ["applied", "interviewing"].includes(a.status) &&
      ((a.nextFollowUpAt && new Date(a.nextFollowUpAt).getTime() <= now) ||
        (a.appliedDate && now - new Date(a.appliedDate).getTime() > 7 * 864e5))
  );

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Email</h1>
        <p className="text-sm text-slate-500">
          Your dedicated application inbox — send from it, and recruiter replies
          land right back here.
        </p>
      </header>

      {/* Assigned inbox address */}
      <div className="card mb-4 flex flex-wrap items-center justify-between gap-2 border-brand-100 bg-brand-50/50">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Your application inbox
          </p>
          <p className="font-mono text-sm font-semibold text-slate-800">
            {appEmail || "assigning…"}
          </p>
        </div>
        <p className="max-w-md text-xs text-slate-500">
          Each application also gets its own reply address, so responses thread
          back to the right job automatically.
        </p>
      </div>

      {!provider && (
        <div className="card mb-4 border-amber-200 bg-amber-50 text-sm text-amber-700">
          No outbound email provider connected yet — you can compose, AI-draft,
          and save drafts now, and use “Simulate reply” to see the inbound loop.
          Add a Resend key or SMTP to actually send.
        </div>
      )}

      {followUps.length > 0 && (
        <div className="card mb-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Follow-ups due ({followUps.length})
          </h2>
          <div className="space-y-2">
            {followUps.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="text-slate-700">
                  {a.job.title} · {a.job.company}
                </span>
                <button
                  className="btn-ghost text-xs"
                  onClick={() => {
                    setApplicationId(a.id);
                    aiDraft("follow-up");
                  }}
                >
                  Draft follow-up
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose */}
        <section className="card space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Compose</h2>
          <div>
            <label className="label">Application</label>
            <select
              className="input"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
            >
              <option value="">— none —</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.job.title} · {a.job.company}
                </option>
              ))}
            </select>
            {replyAddress && (
              <p className="mt-1 font-mono text-xs text-slate-400">
                replies → {replyAddress}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-ghost text-xs"
              onClick={() => aiDraft("application")}
              disabled={busy === "draft-application"}
            >
              {busy === "draft-application" ? "Drafting…" : "✦ AI: application"}
            </button>
            <button
              className="btn-ghost text-xs"
              onClick={() => aiDraft("follow-up")}
              disabled={busy === "draft-follow-up"}
            >
              {busy === "draft-follow-up" ? "Drafting…" : "✦ AI: follow-up"}
            </button>
            {applicationId && (
              <button
                className="btn-ghost text-xs"
                onClick={simulateReply}
                disabled={busy === "sim"}
                title="Inject a fake recruiter reply to see inbound work"
              >
                {busy === "sim" ? "Simulating…" : "↘ Simulate reply"}
              </button>
            )}
          </div>
          <div>
            <label className="label">To</label>
            <input
              className="input"
              placeholder="recruiter@company.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Subject</label>
            <input
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea
              className="textarea min-h-[180px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {note && <p className="text-sm text-emerald-600">{note}</p>}
          <div className="flex gap-2">
            <button
              className="btn-ghost"
              onClick={() => submit(false)}
              disabled={busy === "save"}
            >
              Save draft
            </button>
            <button
              className="btn-primary"
              onClick={() => submit(true)}
              disabled={busy === "send"}
            >
              {busy === "send" ? "Sending…" : "Send"}
            </button>
          </div>
        </section>

        {/* Unified inbox */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Inbox</h2>
          {emails.length === 0 ? (
            <div className="card text-sm text-slate-500">No messages yet.</div>
          ) : (
            <div className="space-y-2">
              {emails.map((m) => {
                const inbound = m.direction === "inbound";
                return (
                  <div
                    key={m.id}
                    className={`card ${inbound ? "border-brand-200 bg-brand-50/40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          <span className="mr-1 text-slate-400">
                            {inbound ? "↘" : "↗"}
                          </span>
                          {m.subject}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {inbound
                            ? `from ${m.fromAddress || "—"}`
                            : `to ${m.toAddress || "—"}`}
                          {m.application && <> · {m.application.job.company}</>}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLE[m.status] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-slate-600">
                      {m.body}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
