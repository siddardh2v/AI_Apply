"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Dashboard", icon: "▢" },
  { href: "/copilot", label: "Copilot", icon: "✸" },
  { href: "/feed", label: "Job Feed", icon: "📡" },
  { href: "/resumes", label: "Resumes", icon: "▤" },
  { href: "/jobs", label: "Jobs & Tailor", icon: "✦" },
  { href: "/applications", label: "Applications", icon: "☑" },
  { href: "/interview", label: "Interview", icon: "🎤" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/emails", label: "Email", icon: "✉" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6">
      <div className="mb-8 px-2">
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Job<span className="text-brand-500">ward</span>
        </span>
        <p className="mt-1 text-xs text-slate-400">Job application copilot</p>
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="text-slate-400">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-6">
        <UserMenu />
      </div>
    </aside>
  );
}

function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setEmail(d?.user?.email ?? null))
      .catch(() => {});
  }, []);

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/signin");
    router.refresh();
  }

  if (!email) return null;

  return (
    <div className="border-t border-slate-100 pt-4">
      <p className="truncate px-2 text-xs text-slate-400" title={email}>
        {email}
      </p>
      <Link
        href="/settings"
        className="mt-2 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
      >
        Settings
      </Link>
      <button
        onClick={signOut}
        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
      >
        Sign out
      </button>
    </div>
  );
}
