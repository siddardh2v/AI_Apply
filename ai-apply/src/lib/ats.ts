// Jobscan-style ATS keyword matcher. Extracts the most important keywords from
// a job description and checks how many appear in the resume. Pure heuristic —
// no API key required.

const STOP = new Set([
  "the", "and", "for", "you", "your", "our", "with", "will", "are", "this",
  "that", "have", "has", "from", "all", "can", "who", "what", "their", "they",
  "them", "his", "her", "its", "but", "not", "any", "may", "etc", "into", "out",
  "use", "using", "used", "able", "about", "across", "also", "been", "being",
  "such", "than", "then", "there", "these", "those", "while", "within", "work",
  "working", "job", "role", "team", "teams", "company", "candidate", "candidates",
  "experience", "experiences", "years", "year", "ability", "strong", "good",
  "great", "plus", "must", "required", "requirements", "responsibilities",
  "including", "include", "includes", "well", "new", "help", "make", "like",
  "looking", "join", "build", "building", "skills", "knowledge", "understanding",
  "ensure", "provide", "support", "based", "per", "via", "more", "most", "both",
  "we", "us", "is", "of", "to", "in", "on", "at", "as", "an", "or", "be", "by",
  "it", "if", "do", "up", "so", "a", "i",
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9+.#-]{2,}/g) || []).filter(
    (w) => !STOP.has(w)
  );
}

export interface AtsResult {
  score: number;
  total: number;
  matched: string[];
  missing: string[];
}

export function atsScore(resume: string, job: string): AtsResult {
  // Rank JD keywords by frequency, keep the top distinct terms.
  const freq = new Map<string, number>();
  for (const t of tokenize(job)) freq.set(t, (freq.get(t) || 0) + 1);

  const ranked = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 30);

  const resumeWords = new Set(tokenize(resume));
  const matched = ranked.filter((k) => resumeWords.has(k));
  const missing = ranked.filter((k) => !resumeWords.has(k));
  const score = ranked.length
    ? Math.round((matched.length / ranked.length) * 100)
    : 0;

  return { score, total: ranked.length, matched, missing };
}
