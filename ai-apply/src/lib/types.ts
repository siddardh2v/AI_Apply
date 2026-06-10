// Shared types for AI-generated structured data.

export interface WorkExperience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ParsedResume {
  summary: string;
  skills: string[];
  work_experience: WorkExperience[];
  education: string[];
  certifications: string[];
}

export interface JobAnalysis {
  required_skills: string[];
  nice_to_have: string[];
  experience_years: number;
  education: string;
  key_responsibilities: string[];
  /** Short plain-language summary of the role. */
  summary: string;
}

export interface MatchResult {
  /** 0–100 overall relevance score. */
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  /** A few sentences explaining the score and how to improve the match. */
  rationale: string;
}
