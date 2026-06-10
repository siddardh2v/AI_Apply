import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, notFound, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const VALID_STATUSES = [
  "saved",
  "tailoring",
  "ready",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

// PATCH /api/applications/:id — update status, notes, docs, or follow-up date.
export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.application.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return notFound("Application not found");

    const body = await req.json();

    const status =
      typeof body.status === "string" && VALID_STATUSES.includes(body.status)
        ? body.status
        : undefined;

    const appliedDate =
      status === "applied" ? body.appliedDate ?? new Date() : body.appliedDate;

    const application = await prisma.application.update({
      where: { id: params.id },
      data: {
        status,
        notes: typeof body.notes === "string" ? body.notes : undefined,
        tailoredResume:
          typeof body.tailoredResume === "string"
            ? body.tailoredResume
            : undefined,
        coverLetter:
          typeof body.coverLetter === "string" ? body.coverLetter : undefined,
        appliedDate: appliedDate ? new Date(appliedDate) : undefined,
        responseDate: body.responseDate
          ? new Date(body.responseDate)
          : undefined,
        nextFollowUpAt: body.nextFollowUpAt
          ? new Date(body.nextFollowUpAt)
          : undefined,
      },
      include: { job: true, resume: { select: { id: true, title: true } } },
    });

    return ok(application);
  } catch (e) {
    return fail(e);
  }
}

// DELETE /api/applications/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.application.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return notFound("Application not found");
    await prisma.application.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
