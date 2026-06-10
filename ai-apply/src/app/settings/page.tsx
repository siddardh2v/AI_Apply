"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface Me {
  name: string | null;
  email: string;
  appEmail: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d?.user ?? null));
  }, []);

  function exportData() {
    window.location.href = "/api/account/export";
    toast("Preparing your data export…", "info");
  }

  async function deleteAccount() {
    const r = await fetch("/api/account", { method: "DELETE" });
    if (r.ok) {
      router.push("/signin");
      router.refresh();
    } else {
      toast("Couldn't delete the account.", "error");
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">
          Your profile, inbox address, and data controls.
        </p>
      </header>

      <section className="card mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Profile</h2>
        <dl className="space-y-2 text-sm">
          <Row label="Name" value={me?.name || "—"} />
          <Row label="Email" value={me?.email || "—"} />
          <Row label="Application inbox" value={me?.appEmail || "—"} mono />
          <Row label="Plan" value="Free" />
        </dl>
        <a
          href="/pricing"
          className="mt-3 inline-block text-sm font-medium text-brand-600"
        >
          View plans &amp; pricing →
        </a>
      </section>

      <section className="card">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">
          Privacy &amp; your data
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          We store only what you give us — your resumes, the jobs you save, and
          your messages. We never sell your data, and you can take it or delete
          it at any time.
        </p>

        <div className="flex flex-wrap gap-3">
          <button className="btn-ghost" onClick={exportData}>
            ⬇ Export my data (JSON)
          </button>
          {!confirming ? (
            <button
              className="btn-ghost text-rose-600"
              onClick={() => setConfirming(true)}
            >
              Delete my account
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-rose-600">
                This permanently deletes everything. Sure?
              </span>
              <button
                className="btn-primary text-xs"
                style={{ background: "#FB7185", borderColor: "#FB7185", boxShadow: "0 0 16px rgba(244,63,94,0.3)" }}
                onClick={deleteAccount}
              >
                Yes, delete
              </button>
              <button className="btn-ghost text-xs" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 last:border-0">
      <dt className="text-slate-400">{label}</dt>
      <dd className={mono ? "font-mono text-slate-200" : "text-slate-200"}>{value}</dd>
    </div>
  );
}
