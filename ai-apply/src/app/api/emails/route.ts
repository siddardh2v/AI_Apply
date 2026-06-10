import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import {
  ensureAppEmail,
  ensureReplyToken,
  appReplyAddress,
  INBOUND_DOMAIN,
} from "@/lib/appmail";
import { sendEmail, emailProvider } from "@/lib/email";
import { ok, badRequest, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/emails?applicationId= — list the user's emails (optionally by app).
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId") || undefined;

    const emails = await prisma.emailMessage.findMany({
      where: { userId, applicationId },
      orderBy: { createdAt: "desc" },
      include: {
        application: { include: { job: { select: { title: true, company: true } } } },
      },
      take: 200,
    });
    return ok({ emails, provider: emailProvider(), inboxDomain: INBOUND_DOMAIN });
  } catch (e) {
    return fail(e);
  }
}

// POST /api/emails — save a message and optionally send it.
// Body: { applicationId?, to, subject, body, send?: boolean }
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const fromAddress = await ensureAppEmail(userId);
    const body = await req.json();

    const to = (body.to || "").trim();
    const subject = (body.subject || "").trim();
    const text = (body.body || "").trim();
    if (!subject || !text) return badRequest("Subject and body are required.");
    if (body.send && !to) return badRequest("A recipient is required to send.");

    // Validate the application belongs to the user, if provided.
    let applicationId: string | null = null;
    let replyTo: string | undefined;
    if (body.applicationId) {
      const app = await prisma.application.findFirst({
        where: { id: body.applicationId, userId },
        select: { id: true },
      });
      applicationId = app?.id ?? null;
      if (applicationId) {
        const token = await ensureReplyToken(applicationId);
        replyTo = appReplyAddress(token);
      }
    }

    let status = "draft";
    let providerId: string | null = null;
    let sentAt: Date | null = null;
    let warning: string | undefined;

    // Send from the per-application reply address (so replies thread back),
    // falling back to the user's general inbox address.
    const from = replyTo || fromAddress;

    if (body.send) {
      if (emailProvider()) {
        try {
          const result = await sendEmail({ to, subject, body: text, from });
          status = "sent";
          providerId = result.id;
          sentAt = new Date();
        } catch (e) {
          status = "failed";
          warning = e instanceof Error ? e.message : "Send failed.";
        }
      } else {
        warning =
          "No email provider configured — saved as a draft. Add RESEND_API_KEY or SMTP settings to send.";
      }
    }

    const email = await prisma.emailMessage.create({
      data: {
        userId,
        applicationId,
        direction: "outbound",
        toAddress: to || null,
        fromAddress: from,
        subject,
        body: text,
        status,
        providerId,
        sentAt,
      },
    });

    // When an application email is sent, nudge a follow-up in 7 days.
    if (status === "sent" && applicationId) {
      const followUp = new Date();
      followUp.setDate(followUp.getDate() + 7);
      await prisma.application.update({
        where: { id: applicationId },
        data: { nextFollowUpAt: followUp },
      });
    }

    return ok({ email, warning }, 201);
  } catch (e) {
    return fail(e);
  }
}
