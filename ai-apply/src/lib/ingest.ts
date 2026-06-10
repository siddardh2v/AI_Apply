import { prisma } from "@/lib/prisma";
import { NormalizedJob } from "@/lib/sources/types";

export interface IngestResult {
  added: number;
  updated: number;
}

/** Upsert normalized jobs into JobPosting, deduped by (source, externalId). */
export async function ingestJobs(jobs: NormalizedJob[]): Promise<IngestResult> {
  let added = 0;
  let updated = 0;

  for (const j of jobs) {
    if (!j.externalId || !j.title || !j.company) continue;

    const existing = await prisma.jobPosting.findUnique({
      where: { source_externalId: { source: j.source, externalId: j.externalId } },
      select: { id: true },
    });

    await prisma.jobPosting.upsert({
      where: { source_externalId: { source: j.source, externalId: j.externalId } },
      create: {
        source: j.source,
        externalId: j.externalId,
        title: j.title,
        company: j.company,
        location: j.location,
        remote: j.remote,
        employmentType: j.employmentType,
        url: j.url,
        description: j.description.slice(0, 20000),
        postedDate: j.postedDate,
      },
      update: {
        title: j.title,
        company: j.company,
        location: j.location,
        remote: j.remote,
        url: j.url,
        description: j.description.slice(0, 20000),
        postedDate: j.postedDate,
      },
    });

    if (existing) updated += 1;
    else added += 1;
  }

  return { added, updated };
}
