import { NormalizedJob } from "./types";
import { fetchRemotive } from "./remotive";
import { fetchArbeitnow } from "./arbeitnow";
import { fetchGreenhouse } from "./greenhouse";
import { fetchLever } from "./lever";
import { fetchAdzuna } from "./adzuna";

function csvEnv(name: string): string[] {
  return (process.env[name] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface AggregateResult {
  jobs: NormalizedJob[];
  errors: { source: string; message: string }[];
}

// Fetch from every enabled source. Sources that need keys/config are skipped
// silently; sources that fail are recorded but don't fail the whole run.
export async function aggregateJobs(query?: string): Promise<AggregateResult> {
  const tasks: { source: string; run: () => Promise<NormalizedJob[]> }[] = [
    { source: "remotive", run: () => fetchRemotive(query) },
    { source: "arbeitnow", run: () => fetchArbeitnow() },
    { source: "adzuna", run: () => fetchAdzuna(query) },
  ];

  for (const company of csvEnv("JOB_GREENHOUSE_COMPANIES")) {
    tasks.push({
      source: `greenhouse:${company}`,
      run: () => fetchGreenhouse(company),
    });
  }
  for (const company of csvEnv("JOB_LEVER_COMPANIES")) {
    tasks.push({ source: `lever:${company}`, run: () => fetchLever(company) });
  }

  const settled = await Promise.allSettled(tasks.map((t) => t.run()));

  const jobs: NormalizedJob[] = [];
  const errors: { source: string; message: string }[] = [];
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      jobs.push(...result.value);
    } else {
      errors.push({
        source: tasks[i].source,
        message: String(result.reason?.message || result.reason),
      });
    }
  });

  return { jobs, errors };
}
