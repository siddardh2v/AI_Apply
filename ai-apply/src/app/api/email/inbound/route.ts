import { recordInbound } from "@/lib/appmail";
import { ok, badRequest, fail } from "@/lib/http";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/email/inbound — webhook for inbound mail.
// Wire a Cloudflare Email Worker (catch-all on your domain) to POST JSON here:
//   { to, from, subject, text, messageId }  with header x-webhook-secret.
export async function POST(req: Request) {
  try {
    const secret = process.env.INBOUND_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Inbound email is not configured (set INBOUND_WEBHOOK_SECRET)." },
        { status: 503 }
      );
    }
    const provided =
      req.headers.get("x-webhook-secret") ||
      new URL(req.url).searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const to = payload.to || payload.recipient;
    const from = payload.from || payload.sender;
    if (!to || !from) return badRequest("`to` and `from` are required.");

    const result = await recordInbound({
      to,
      from,
      subject: payload.subject || "",
      body: payload.text || payload.body || payload.html || "",
      messageId: payload.messageId || payload["message-id"],
    });

    return ok(result);
  } catch (e) {
    return fail(e);
  }
}
