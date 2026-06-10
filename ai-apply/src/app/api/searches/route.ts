import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { ok, badRequest, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/searches — the user's saved searches.
export async function GET() {
  try {
    const userId = await requireUserId();
    const searches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return ok(searches);
  } catch (e) {
    return fail(e);
  }
}

// POST /api/searches — save a search/preference.
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const name = (body.name || body.query || "Saved search").trim();
    if (!name) return badRequest("A name or query is required.");

    const search = await prisma.savedSearch.create({
      data: {
        userId,
        name,
        query: body.query?.trim() || null,
        location: body.location?.trim() || null,
        remoteOnly: Boolean(body.remoteOnly),
        sources: body.sources?.trim() || null,
      },
    });
    return ok(search, 201);
  } catch (e) {
    return fail(e);
  }
}
