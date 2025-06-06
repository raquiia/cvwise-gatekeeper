
/**
 * Types for the AI Scoring system
 */

export interface AICandidateScore {
  id: string;
  candidate_id: string;
  job_offer_id?: string | null;
  user_id: string;
  score: number;
  explanation: string;
  breakdown: AIScoringBreakdown;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface AIScoringBreakdown {
  skills: number;
  experience: number;
  education: number;
  cvStructure?: number;
  profileSummary?: number;
  location?: number;
  cultural?: number;
  languages?: number;
  [key: string]: number | undefined;
}

export interface AIScoreFetchOptions {
  bypassCache?: boolean;
  isJobSpecific?: boolean;
}

export interface AIScoringResult {
  score: number;
  explanation: string;
  breakdown: AIScoringBreakdown;
  source: 'database' | 'fresh_calculation' | 'cache';
  isJobSpecific: boolean;
}

export interface AIScoringError {
  message: string;
  code?: string;
}
