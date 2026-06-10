import { NormalizedJob, htmlToText, fetchJson } from "./types";

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  candidate_required_location: string;
  job_type: string;
  url: string;
  description: string;
  publication_date: string;
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

// https://remotive.com/api/remote-jobs — free, no key. Remote roles.
export async function fetchRemotive(query?: string): Promise<NormalizedJob[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (query) params.set("search", query);
  const data = await fetchJson<RemotiveResponse>(
    `https://remotive.com/api/remote-jobs?${params.toString()}`
  );

  return (data.jobs || []).map((j) => ({
    source: "remotive",
    externalId: String(j.id),
    title: j.title,
    company: j.company_name,
    location: j.candidate_required_location || "Remote",
    remote: true,
    employmentType: j.job_type || null,
    url: j.url,
    description: htmlToText(j.description),
    postedDate: j.publication_date ? new Date(j.publication_date) : null,
  }));
}
