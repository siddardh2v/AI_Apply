import { NormalizedJob, htmlToText, fetchJson } from "./types";

interface ArbeitnowJob {
  slug: string;
  title: string;
  company_name: string;
  location: string;
  remote: boolean;
  job_types: string[];
  url: string;
  description: string;
  created_at: number;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
}

// https://www.arbeitnow.com/api/job-board-api — free, no key.
export async function fetchArbeitnow(): Promise<NormalizedJob[]> {
  const data = await fetchJson<ArbeitnowResponse>(
    "https://www.arbeitnow.com/api/job-board-api"
  );

  return (data.data || []).map((j) => ({
    source: "arbeitnow",
    externalId: j.slug,
    title: j.title,
    company: j.company_name,
    location: j.location || null,
    remote: Boolean(j.remote),
    employmentType: j.job_types?.[0] || null,
    url: j.url,
    description: htmlToText(j.description),
    postedDate: j.created_at ? new Date(j.created_at * 1000) : null,
  }));
}
