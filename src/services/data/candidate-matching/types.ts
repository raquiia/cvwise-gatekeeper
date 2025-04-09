
import { Json } from '@/integrations/supabase/types';

// Define types for matching
export interface SkillsDetails {
  matched: string[];
  missing: string[];
  additional: string[];
  matchPercentage: number;
}

export interface MatchDetails {
  skills: SkillsDetails;
  experienceLevel: {
    required: number;
    candidate: number;
    match: boolean;
  };
  location: {
    required: string;
    candidate: string;
    match: boolean;
  };
  educationLevel: {
    required: string;
    candidate: string;
    match: boolean;
  };
  overall: number;
}

export interface CandidateMatch {
  candidateId: string;
  firstName: string;
  lastName: string;
  position?: string;
  company?: string;
  score: number;
  details?: MatchDetails;
}

export interface CandidateJobMatch {
  score: number;
  details: MatchDetails;
}

export interface JobOfferSuggestion {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  details?: MatchDetails;
  description?: string;
  requiredSkills?: string[];
  softSkills?: string[];
  toolsAndTechnologies?: string[];
  education?: string;
  experience?: {
    min: number;
    max: number;
  };
  contractType?: string;
  remotePreference?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  location?: string;
}
