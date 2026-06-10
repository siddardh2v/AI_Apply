// Prompt builders for each AI operation. Keeping prompts in one place makes
// them easy to tune and version.

export function parseResumePrompt(resumeText: string): string {
  return `Extract structured data from the following resume.

RESUME:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown, no commentary) matching exactly this shape:
{
  "summary": "one- to two-sentence professional summary",
  "skills": ["..."],
  "work_experience": [
    { "title": "", "company": "", "duration": "", "description": "" }
  ],
  "education": ["..."],
  "certifications": ["..."]
}`;
}

export function analyzeJobPrompt(jobText: string): string {
  return `Analyze the following job posting and extract its requirements.

JOB POSTING:
"""
${jobText}
"""

Return ONLY valid JSON (no markdown, no commentary) matching exactly this shape:
{
  "summary": "one- to two-sentence summary of the role",
  "required_skills": ["..."],
  "nice_to_have": ["..."],
  "experience_years": 0,
  "education": "",
  "key_responsibilities": ["..."]
}`;
}

export function matchPrompt(
  parsedResume: unknown,
  jobAnalysis: unknown
): string {
  return `Compare this candidate's resume against this job's requirements and score the fit.

CANDIDATE RESUME (structured):
${JSON.stringify(parsedResume, null, 2)}

JOB REQUIREMENTS (structured):
${JSON.stringify(jobAnalysis, null, 2)}

Score how well the candidate matches the role from 0 to 100, where 100 is a
perfect fit. Be realistic and evidence-based.

Return ONLY valid JSON (no markdown, no commentary) matching exactly this shape:
{
  "score": 0,
  "matched_skills": ["..."],
  "missing_skills": ["..."],
  "rationale": "2-4 sentences explaining the score and how to strengthen the match"
}`;
}

export function tailorResumePrompt(
  originalResume: string,
  jobAnalysis: unknown
): string {
  return `Tailor the resume below for the target job. Reorder and reword to
maximize relevance WITHOUT inventing experience.

ORIGINAL RESUME:
"""
${originalResume}
"""

TARGET JOB REQUIREMENTS (structured):
${JSON.stringify(jobAnalysis, null, 2)}

Rules:
1. Reorder experience and bullet points so the most relevant items come first.
2. Emphasize skills and keywords the job asks for, but only where the candidate
   genuinely has them.
3. Keep every claim accurate and truthful — never fabricate.
4. Preserve a clean, professional, plain-text resume format.

Return the tailored resume as plain text only (no commentary).`;
}

export function emailDraftPrompt(opts: {
  type: "application" | "follow-up";
  applicantName: string;
  jobTitle: string;
  company: string;
  resumeSummary: string;
  status?: string;
}): string {
  const kind =
    opts.type === "follow-up"
      ? "a short, polite follow-up email checking on the status of an application already submitted"
      : "a concise email to accompany a job application / express interest in the role";

  return `Write ${kind}.

APPLICANT: ${opts.applicantName}
ROLE: ${opts.jobTitle} at ${opts.company}
CURRENT STATUS: ${opts.status || "applied"}
APPLICANT BACKGROUND: ${opts.resumeSummary}

Requirements:
- Professional, warm, and brief (follow-up: ~80 words; application: ~140 words).
- Specific to the role; no generic filler or clichés.
- ${opts.type === "follow-up" ? "Reiterate interest and politely ask about next steps." : "Convey fit and enthusiasm, and invite next steps."}

Return ONLY valid JSON (no markdown) of the form:
{ "subject": "...", "body": "..." }
The body should be ready to send (greeting + sign-off), using the applicant's name.`;
}

const TONE_GUIDE: Record<string, string> = {
  professional: "polished, confident, and businesslike",
  warm: "warm, personable, and genuine while still professional",
  bold: "bold, energetic, and memorable — lead with a strong point of view",
  concise: "extremely concise and direct; every sentence earns its place",
};

const LENGTH_GUIDE: Record<string, string> = {
  short: "about 120–180 words",
  medium: "about 220–300 words",
  long: "about 320–400 words",
};

export function coverLetterPrompt(
  resumeText: string,
  job: { title: string; company: string; description: string },
  opts: { tone?: string; length?: string } = {}
): string {
  const tone = TONE_GUIDE[opts.tone || "professional"] || TONE_GUIDE.professional;
  const length = LENGTH_GUIDE[opts.length || "medium"] || LENGTH_GUIDE.medium;

  return `Write a cover letter that is ${tone}. Target length: ${length}.

CANDIDATE RESUME:
"""
${resumeText}
"""

TARGET ROLE:
Title: ${job.title}
Company: ${job.company}
Job description:
"""
${job.description}
"""

The cover letter should:
1. Open with a specific, engaging hook (no "I am writing to apply...").
2. Show genuine knowledge of the company/role.
3. Connect 2–3 concrete accomplishments from the resume to the job's needs.
4. Close with a clear, confident call to action.
5. Sound human; avoid clichés, filler, and obvious AI phrasing.
6. Use ONLY facts present in the resume — never invent experience, numbers, or employers.

Return the cover letter as plain text only (no commentary, no placeholders like
"[Your Name]" unless the name is unknown).`;
}
