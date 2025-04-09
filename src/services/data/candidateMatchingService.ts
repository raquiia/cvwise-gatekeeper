
import { SUPABASE_API_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/client';
import { CandidateData } from './resumeDataService';

/**
 * Interface pour les résultats de matching
 */
export interface CandidateJobMatch {
  id: string;
  candidate_id: string;
  job_offer_id: string;
  match_score: number;
  skills_match_score: number;
  experience_match_score: number;
  education_match_score: number;
  location_match_score: number;
  match_details: {
    skills_details: { score: number };
    experience_details: { score: number };
    education_details: { score: number };
    location_details: { score: number };
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Service responsable de la gestion des matchings entre candidats et offres d'emploi
 */
export const candidateMatchingService = {
  /**
   * Calculer les scores de matching pour tous les candidats d'un utilisateur par rapport à une offre d'emploi
   */
  calculateMatchesForJobOffer: async (jobOfferId: string): Promise<string[]> => {
    try {
      console.log(`Calculating matches for job offer ID: ${jobOfferId}`);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/calculate_all_candidates_job_matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_job_offer_id: jobOfferId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error calculating matches: ${errorText}`);
      }

      const data = await response.json();
      
      // Cast data to string[] type
      const typedData = (data || []) as string[];
      
      console.log(`Calculated matches for ${typedData.length} candidates`);
      return typedData;
    } catch (error: any) {
      console.error("Exception in calculateMatchesForJobOffer:", error);
      throw new Error(error.message || "Impossible de calculer les correspondances");
    }
  },
  
  /**
   * Récupérer les résultats de matching pour un candidat et une offre d'emploi spécifiques
   */
  getCandidateJobMatch: async (candidateId: string, jobOfferId: string): Promise<CandidateJobMatch | null> => {
    try {
      console.log(`Fetching match between candidate ${candidateId} and job offer ${jobOfferId}`);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/get_candidate_job_match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_candidate_id: candidateId,
          p_job_offer_id: jobOfferId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching candidate-job match: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data) {
        console.log(`No match found between candidate ${candidateId} and job offer ${jobOfferId}`);
        return null;
      }
      
      // Cast data to CandidateJobMatch type
      const typedData = data as CandidateJobMatch;
      
      console.log("Match retrieved successfully:", typedData);
      return typedData;
    } catch (error: any) {
      console.error("Exception in getCandidateJobMatch:", error);
      throw new Error(error.message || "Impossible de récupérer le matching");
    }
  },
  
  /**
   * Récupérer tous les matchs pour une offre d'emploi spécifique, avec détails des candidats
   */
  getMatchesForJobOffer: async (jobOfferId: string): Promise<{candidate: CandidateData; match: CandidateJobMatch}[]> => {
    try {
      console.log(`Fetching all matches for job offer: ${jobOfferId}`);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/get_matches_for_job_offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_job_offer_id: jobOfferId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching matches for job offer: ${errorText}`);
      }

      const data = await response.json();
      
      // Si aucune donnée n'est retournée, renvoyer un tableau vide
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      // Cast data to expected type
      const typedData = data as {candidate: CandidateData; match: CandidateJobMatch}[];
      
      // Trier par score de matching (du plus élevé au plus bas)
      typedData.sort((a, b) => b.match.match_score - a.match.match_score);
      
      console.log(`Retrieved ${typedData.length} matches for job offer ${jobOfferId}`);
      return typedData;
    } catch (error: any) {
      console.error("Exception in getMatchesForJobOffer:", error);
      throw new Error(error.message || "Impossible de récupérer les matchings");
    }
  },
  
  /**
   * Récupérer les meilleurs candidats pour une offre d'emploi spécifique
   */
  getTopCandidatesForJobOffer: async (jobOfferId: string, limit: number = 10): Promise<{candidate: CandidateData; match: CandidateJobMatch}[]> => {
    try {
      const allMatches = await candidateMatchingService.getMatchesForJobOffer(jobOfferId);
      return allMatches.slice(0, limit);
    } catch (error: any) {
      console.error("Exception in getTopCandidatesForJobOffer:", error);
      throw new Error(error.message || "Impossible de récupérer les meilleurs candidats");
    }
  }
};
