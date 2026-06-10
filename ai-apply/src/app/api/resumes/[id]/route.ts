import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { fromJson } from "@/lib/serialize";
import type { ParsedResume } from "@/lib/types";
import { ok, notFound, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

// GET /api/resumes/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const resume = await prisma.resume.findFirst({
      where: { id: params.id, userId },
    });
    if (!resume) return notFound("Resume not found");
    return ok({
      ...resume,
      parsedContent: fromJson<ParsedResume>(resume.parsedContent),
    });
  } catch (e) {
    return fail(e);
  }
}

// PATCH /api/resumes/:id — update title or set as default.
export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.resume.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return notFound("Resume not found");

    const body = await req.json();

    if (body.isDefault === true) {
      await prisma.resume.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const resume = await prisma.resume.update({
      where: { id: params.id },
      data: {
        title: typeof body.title === "string" ? body.title : undefined,
        isDefault:
          typeof body.isDefault === "boolean" ? body.isDefault : undefined,
      },
    });
    return ok(resume);
  } catch (e) {
    return fail(e);
  }
}

// DELETE /api/resumes/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.resume.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return notFound("Resume not found");
    await prisma.resume.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
