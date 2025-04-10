
import { Json } from '@/integrations/supabase/types';
import { MatchDetails } from '@/services/data/candidate-matching/types';

export interface ExtendedCandidateMatch {
  candidateId: string;
  firstName: string;
  lastName: string;
  position?: string;
  company?: string;
  score: number;
  details?: MatchDetails;
  candidate?: {
    id: string;
    first_name: string;
    last_name: string;
    position?: string;
    company?: string;
    location?: string;
    years_experience?: number;
    experiences?: any[];
  };
  match?: {
    match_score: number;
    skills_match_score: number;
    experience_match_score: number;
    education_match_score: number;
    location_match_score: number;
    match_details?: any;
  };
}
