
import { Json } from '@/integrations/supabase/types';
import { MatchDetails } from '@/services/data/candidate-matching/types';

export interface ExtendedCandidateMatch {
  candidateId: string;
  firstName: string;
  lastName: string;
  position?: string;
  company?: string;
  score: number;
  globalScore?: number;      // Score sans localisation
  localScore?: number;       // Score avec localisation
  skillsOnlyScore?: number;  // Score compétences pures
  details?: MatchDetails;
  // Nouvelles propriétés pour le mode global
  isOwnCandidate?: boolean;  // True si le candidat appartient à l'utilisateur connecté
  ownerFirstName?: string;   // Prénom du propriétaire du candidat
  ownerLastName?: string;    // Nom du propriétaire du candidat
  candidate?: {
    id: string;
    first_name: string;
    last_name: string;
    position?: string;
    company?: string;
    location?: string;
    years_experience?: number;
    experiences?: any[];
    // Propriétés pour le mode global
    owner_first_name?: string;
    owner_last_name?: string;
    is_own_candidate?: boolean;
  };
  match?: {
    match_score: number;
    global_score?: number;
    local_score?: number;
    skills_only_score?: number;
    skills_match_score: number;
    experience_match_score: number;
    education_match_score: number;
    location_match_score: number;
    match_details?: any;
  };
}
