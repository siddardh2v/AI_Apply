"use client";

import { useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Which jobs in my feed am I the best fit for?",
  "What skills should I add to land more roles?",
  "Draft a follow-up for my oldest application.",
  "Summarize where my applications stand.",
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);

    const history = next
      .slice(-6)
      .map((m) => `${m.role === "user" ? "User" : "Copilot"}: ${m.content}`)
      .join("\n");

    const r = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: q, history }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content: r.ok
          ? d.reply
          : d.error?.includes("ANTHROPIC_API_KEY")
          ? "Add your Anthropic API key in .env to enable the copilot."
          : d.error || "Something went wrong.",
      },
    ]);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Copilot</h1>
        <p className="text-sm text-slate-500">
          Ask anything about your search — it knows your resume, applications,
          and the live job feed.
        </p>
      </header>

      <div className="card flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-slate-500">Try asking:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-slate-300 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-[var(--accent)] text-[#04121a]"
                      : "border border-[var(--border)] bg-[var(--bg-surface)] text-slate-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-slate-400">
                  thinking…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          className="input"
          placeholder="Ask your copilot…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn-primary" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
