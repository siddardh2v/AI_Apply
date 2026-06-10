// A job normalized from any source into a single shape we can store.
export interface NormalizedJob {
  source: string;
  externalId: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  employmentType: string | null;
  url: string | null;
  description: string;
  postedDate: Date | null;
}

/** Strip HTML tags and decode common entities into readable plain text. */
export function htmlToText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Fetch JSON with a timeout and a descriptive error on failure. */
export async function fetchJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Jobward/0.1 (+local)" },
      // Always hit the network; never use Next's fetch cache for live data.
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
