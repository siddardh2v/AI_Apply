// Runs once when the Next.js server boots. We use it to keep the job feed
// "live" by pulling from all sources on an interval while the server runs.
// (For serverless/production, replace this with a real cron hitting
// POST /api/jobs/refresh — see the README.)

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const g = globalThis as unknown as { __jobRefreshStarted?: boolean };
  if (g.__jobRefreshStarted) return;
  g.__jobRefreshStarted = true;

  const minutes = Math.max(5, Number(process.env.JOB_REFRESH_MINUTES || 30));

  const run = async () => {
    try {
      const { aggregateJobs } = await import("@/lib/sources");
      const { ingestJobs } = await import("@/lib/ingest");
      const { jobs, errors } = await aggregateJobs();
      const res = await ingestJobs(jobs);
      console.log(
        `[jobs] refresh: fetched ${jobs.length}, +${res.added} new, ${res.updated} updated` +
          (errors.length ? ` (${errors.length} source error(s))` : "")
      );
    } catch (e) {
      console.warn("[jobs] scheduled refresh failed:", e);
    }
  };

  // First pull shortly after startup, then on a recurring interval.
  setTimeout(run, 8000);
  setInterval(run, minutes * 60 * 1000);
}
