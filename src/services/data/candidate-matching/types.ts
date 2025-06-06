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
  // Nouveaux scores séparés
  global_score?: number; // Score sans pénalité de localisation
  local_score?: number;  // Score avec pénalité de localisation
  skills_only_score?: number; // Score basé uniquement sur les compétences
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
  
  // Frontend compatibility properties
  candidateId?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  score?: number;
  details?: MatchDetails;
  
  // Nouvelles propriétés pour le mode global
  isOwnCandidate?: boolean;  // True si le candidat appartient à l'utilisateur connecté
  ownerFirstName?: string;   // Prénom du propriétaire du candidat
  ownerLastName?: string;    // Nom du propriétaire du candidat
}

// Candidate match with job (individual candidate-job pairing)
export interface CandidateJobMatch {
  score: number;
  globalScore: number; // Score sans localisation
  localScore: number;  // Score avec localisation
  skillsOnlyScore: number; // Score compétences pures
  details: MatchDetails;
}

// Detailed match information
export interface MatchDetails {
  skills: SkillsMatchDetails;
  experienceLevel: {
    required: number;
    candidate: number;
    match: boolean;
    score?: number;
  };
  location: {
    required: string;
    candidate: string;
    match: boolean;
    score?: number;
    needsRelocation?: boolean;
  };
  educationLevel: {
    required: string;
    candidate: string;
    match: boolean;
    score?: number;
  };
  overall: number;
  roleMatch?: {
    score: number;
    explanation: string;
  };
}

// Skills match details
export interface SkillsMatchDetails {
  matched: string[];
  missing: string[];
  additional: string[];
  matchPercentage: number;
}

// Skills details (for backward compatibility)
export interface SkillsDetails extends SkillsMatchDetails {}

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
  softSkills?: string[]; 
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
