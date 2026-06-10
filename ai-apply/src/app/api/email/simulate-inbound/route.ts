import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ensureReplyToken, appReplyAddress, recordInbound } from "@/lib/appmail";
import { ok, badRequest, notFound, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/email/simulate-inbound — inject a fake recruiter reply so you can
// watch the inbound loop work without real DNS. Authenticated; only for the
// user's own applications.
// Body: { applicationId, from?, subject?, body? }
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const { applicationId, from, subject, body } = await req.json();
    if (!applicationId) return badRequest("applicationId is required.");

    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: { job: { select: { company: true, title: true } } },
    });
    if (!app) return notFound("Application not found");

    const token = await ensureReplyToken(app.id);
    const to = appReplyAddress(token);

    const result = await recordInbound({
      to,
      from: from || `recruiting@${app.job.company.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example.com`,
      subject: subject || `Re: ${app.job.title} application`,
      body:
        body ||
        `Hi! Thanks for applying to the ${app.job.title} role. We'd love to set up a quick call — are you available this week?\n\nBest,\nRecruiting Team`,
    });

    return ok(result, 201);
  } catch (e) {
    return fail(e);
  }
}
