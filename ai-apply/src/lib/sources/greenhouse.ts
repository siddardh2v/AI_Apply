import { NormalizedJob, htmlToText, fetchJson } from "./types";

interface GhJob {
  id: number;
  title: string;
  location: { name: string };
  absolute_url: string;
  content: string; // HTML-escaped
  updated_at: string;
}

interface GhResponse {
  jobs: GhJob[];
}

// Greenhouse public board API. `company` is the board token, e.g. "stripe".
// https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true
export async function fetchGreenhouse(company: string): Promise<NormalizedJob[]> {
  const data = await fetchJson<GhResponse>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
      company
    )}/jobs?content=true`
  );

  return (data.jobs || []).map((j) => {
    // Greenhouse double-encodes HTML entities in `content`.
    const decoded = j.content
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    const loc = j.location?.name || null;
    return {
      source: "greenhouse",
      externalId: `${company}:${j.id}`,
      title: j.title,
      company,
      location: loc,
      remote: /remote/i.test(loc || ""),
      employmentType: null,
      url: j.absolute_url,
      description: htmlToText(decoded),
      postedDate: j.updated_at ? new Date(j.updated_at) : null,
    };
  });
}
