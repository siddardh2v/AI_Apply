import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, notFound, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

// DELETE /api/searches/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.savedSearch.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return notFound("Saved search not found");
    await prisma.savedSearch.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
