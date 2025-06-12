
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/candidateService';

/**
 * Service pour récupérer les données complètes d'un candidat - SIMPLIFIÉ
 * Maintenant que les données AI sont dans la table candidates, plus besoin de jointures complexes
 */
export const getCompleteCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('🔍 Fetching candidate data (including AI) for ID:', candidateId);
    
    // Récupérer TOUTES les données du candidat en une seule requête, y compris les données AI
    const { data: candidateData, error: candidateError } = await supabase.rpc('get_candidate_by_id_bypassing_rls', {
      candidate_id_param: candidateId
    });

    if (candidateError) {
      console.error('❌ Error fetching candidate:', candidateError);
      throw candidateError;
    }

    if (!candidateData || candidateData.length === 0) {
      console.log('📭 No candidate found with ID:', candidateId);
      return null;
    }

    const completeCandidate = candidateData[0];
    
    console.log('✅ Complete candidate data retrieved (including AI):', {
      id: completeCandidate.id,
      first_name: completeCandidate.first_name,
      last_name: completeCandidate.last_name,
      address: completeCandidate.address,
      postal_code: completeCandidate.postal_code,
      city: completeCandidate.city,
      country: completeCandidate.country,
      ai_score: completeCandidate.ai_score,
      ai_explanation: completeCandidate.ai_explanation ? 'Present' : 'Missing',
      ai_analyzed_at: completeCandidate.ai_analyzed_at,
      hasAIData: !!(completeCandidate.ai_score || completeCandidate.ai_explanation),
      strengthsCount: Array.isArray(completeCandidate.ai_strengths) ? completeCandidate.ai_strengths.length : 0,
      weaknessesCount: Array.isArray(completeCandidate.ai_weaknesses) ? completeCandidate.ai_weaknesses.length : 0,
      recommendationsCount: Array.isArray(completeCandidate.ai_recommendations) ? completeCandidate.ai_recommendations.length : 0
    });

    // Les données sont déjà complètes, pas besoin de les traiter davantage
    return completeCandidate;

  } catch (error: any) {
    console.error('❌ Error in getCompleteCandidateData:', error);
    throw error;
  }
};
