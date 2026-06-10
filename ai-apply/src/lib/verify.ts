// Lightweight, dependency-free hallucination guard. It compares a tailored
// resume against the user's original and flags lines that introduce numbers or
// proper nouns NOT present in the source — the things AI is most likely to
// fabricate. It's an aid ("verify these"), not a verdict; some flags are benign
// (e.g. the target company name), which is why we surface them for human review.

const COMMON = new Set([
  "the", "and", "for", "with", "led", "built", "ship", "shipped", "designed",
  "developed", "managed", "created", "improved", "increased", "reduced",
  "delivered", "drove", "owned", "launched", "mentored", "summary",
  "experience", "education", "skills", "senior", "engineer", "manager",
  "company", "team", "remote", "present", "current", "responsibilities",
  "january", "february", "march", "april", "may", "june", "july", "august",
  "september", "october", "november", "december",
]);

function numberTokens(s: string): Set<string> {
  return new Set(
    (s.match(/\d[\d.,]*\s?(?:%|k|m|x|\+|yrs?|years?)?/gi) || []).map((x) =>
      x.toLowerCase().replace(/[\s.,]+$/, "")
    )
  );
}

function wordSet(s: string): Set<string> {
  return new Set((s.toLowerCase().match(/[a-z][a-z0-9+.#&-]{1,}/g) || []));
}

export interface VerifyFlag {
  text: string;
  reasons: string[];
}

export interface VerifyResult {
  confidence: number; // 0–100
  flagged: VerifyFlag[];
}

export function verifyResume(original: string, tailored: string): VerifyResult {
  const origNums = numberTokens(original);
  const origWords = wordSet(original);

  const lines = tailored.split(/\r?\n/);
  const flagged: VerifyFlag[] = [];
  let meaningful = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.length < 5) continue;
    meaningful++;

    const reasons: string[] = [];

    // 1) Numbers / metrics not present in the original.
    const newNums = [...numberTokens(line)].filter(
      (n) => /\d/.test(n) && !origNums.has(n)
    );
    if (newNums.length) {
      reasons.push(`Numbers not in your resume: ${newNums.slice(0, 4).join(", ")}`);
    }

    // 2) Proper-noun-like tokens (skip the first word to avoid sentence-start
    //    verbs like "Led"/"Built") that don't appear in the original.
    const tokens = raw.match(/\b[A-Z][A-Za-z0-9+.&-]{2,}\b/g) || [];
    const newCaps = [
      ...new Set(
        tokens
          .slice(1)
          .filter(
            (w) => !origWords.has(w.toLowerCase()) && !COMMON.has(w.toLowerCase())
          )
      ),
    ];
    if (newCaps.length) {
      reasons.push(`Terms not in your resume: ${newCaps.slice(0, 4).join(", ")}`);
    }

    if (reasons.length) flagged.push({ text: line, reasons });
  }

  const confidence = Math.max(
    40,
    Math.round(100 - (flagged.length / Math.max(1, meaningful)) * 100)
  );
  return { confidence, flagged };
}
