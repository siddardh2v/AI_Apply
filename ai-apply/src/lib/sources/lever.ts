import { NormalizedJob, htmlToText, fetchJson } from "./types";

interface LeverJob {
  id: string;
  text: string;
  categories: { location?: string; commitment?: string; team?: string };
  hostedUrl: string;
  descriptionPlain?: string;
  description?: string;
  createdAt: number;
}

// Lever public postings API. `company` is the account name, e.g. "netflix".
// https://api.lever.co/v0/postings/{company}?mode=json
export async function fetchLever(company: string): Promise<NormalizedJob[]> {
  const data = await fetchJson<LeverJob[]>(
    `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`
  );

  return (data || []).map((j) => {
    const loc = j.categories?.location || null;
    return {
      source: "lever",
      externalId: `${company}:${j.id}`,
      title: j.text,
      company,
      location: loc,
      remote: /remote/i.test(loc || ""),
      employmentType: j.categories?.commitment || null,
      url: j.hostedUrl,
      description: j.descriptionPlain || htmlToText(j.description || ""),
      postedDate: j.createdAt ? new Date(j.createdAt) : null,
    };
  });
}
