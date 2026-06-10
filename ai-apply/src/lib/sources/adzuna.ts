import { NormalizedJob, htmlToText, fetchJson } from "./types";

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  redirect_url: string;
  description: string;
  created: string;
  contract_time?: string;
}

interface AdzunaResponse {
  results: AdzunaJob[];
}

// Adzuna search API. Optional — only runs when ADZUNA_APP_ID and ADZUNA_APP_KEY
// are set. Free key at https://developer.adzuna.com/
export async function fetchAdzuna(query?: string): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const country = process.env.ADZUNA_COUNTRY || "us";
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "50",
    "content-type": "application/json",
  });
  if (query) params.set("what", query);

  const data = await fetchJson<AdzunaResponse>(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`
  );

  return (data.results || []).map((j) => ({
    source: "adzuna",
    externalId: String(j.id),
    title: j.title,
    company: j.company?.display_name || "Unknown",
    location: j.location?.display_name || null,
    remote: /remote/i.test(j.location?.display_name || ""),
    employmentType: j.contract_time || null,
    url: j.redirect_url,
    description: htmlToText(j.description),
    postedDate: j.created ? new Date(j.created) : null,
  }));
}
