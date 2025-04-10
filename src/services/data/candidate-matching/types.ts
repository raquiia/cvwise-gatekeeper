
/**
 * Types for matching and AI suggestion functionality
 */

// Generic skill type with level
export interface SkillWithLevel {
  skill: string;
  level: number;
}

// Match result for a candidate against a job offer
export interface CandidateMatch {
  id: string;
  candidate_id: string;
  job_offer_id: string;
  match_score: number;
  skills_match_score?: number;
  experience_match_score?: number;
  education_match_score?: number;
  location_match_score?: number;
  match_details?: {
    matched_skills?: string[];
    missing_skills?: string[];
    matched_education?: boolean;
    location_distance?: number;
    experience_difference?: number;
    [key: string]: any;
  };
  first_name?: string;
  last_name?: string;
  position?: string;
  location?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

// Options for calculating match scores
export interface MatchingOptions {
  weights?: {
    skills?: number;
    experience?: number;
    education?: number;
    location?: number;
  };
  thresholds?: {
    skills?: number;
    experience?: number;
    education?: number;
    location?: number;
  };
}

// Response from the matching calculation operation
export interface MatchingResponse {
  matches: CandidateMatch[];
  total: number;
  success: boolean;
  error?: string;
}

// AI-generated job offer suggestion
export interface JobOfferSuggestion {
  title?: string;
  location?: string;
  description?: string;
  requiredSkills?: string[];
  softSkills?: string[]; // Ajout du champ pour les soft skills
  education?: string;
  experience?: {
    min?: number;
    max?: number;
  };
  contractType?: string;
  remotePreference?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}
