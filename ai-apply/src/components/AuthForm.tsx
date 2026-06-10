"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const url = isSignup ? "/api/auth/signup" : "/api/auth/signin";
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setError(d.error || "Something went wrong.");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    // New users go through onboarding; returning users land where they intended.
    router.push(isSignup ? "/onboarding" : params.get("next") || "/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          Job<span className="text-brand-500">ward</span>
        </span>
        <p className="mt-1 text-sm text-slate-500">
          {isSignup ? "Create your account" : "Welcome back"}
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-4">
        {isSignup && (
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? "At least 8 characters" : "Your password"}
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy
            ? "Please wait…"
            : isSignup
            ? "Create account"
            : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/signin" className="font-medium text-brand-600">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-brand-600">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
