import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { aggregateJobs } from "@/lib/sources";
import { ingestJobs } from "@/lib/ingest";
import { ok, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/jobs/refresh — pull fresh jobs from all sources and store them.
// Body (optional): { query }
export async function POST(req: Request) {
  try {
    await requireUserId();
    let query: string | undefined;
    try {
      const body = await req.json();
      query = body?.query?.trim() || undefined;
    } catch {
      // no body is fine
    }

    const { jobs, errors } = await aggregateJobs(query);
    const { added, updated } = await ingestJobs(jobs);
    const total = await prisma.jobPosting.count();

    return ok({ fetched: jobs.length, added, updated, total, errors });
  } catch (e) {
    return fail(e);
  }
}
