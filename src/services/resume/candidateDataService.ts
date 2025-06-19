
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/candidateService';
import { getSimplifiedCandidateData } from './simplifiedCandidateDataService';

/**
 * Service pour récupérer les données complètes d'un candidat - CORRIGÉ
 * Utilise d'abord l'approche simplifiée, puis essaie les RPC en fallback
 */
export const getCompleteCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('🔍 Starting candidate data fetch for ID:', candidateId);
    
    // Essayer d'abord l'approche simplifiée (direct table query)
    console.log('🔄 Trying simplified approach first...');
    const simplifiedData = await getSimplifiedCandidateData(candidateId);
    
    if (simplifiedData) {
      console.log('✅ Successfully retrieved data via simplified approach');
      return simplifiedData;
    }
    
    console.log('⚠️ Simplified approach failed, trying RPC fallback...');
    
    // Fallback vers l'approche RPC (si l'approche simplifiée échoue)
    const { data: candidateData, error: candidateError } = await supabase.rpc('get_candidate_by_id_bypassing_rls', {
      candidate_id_param: candidateId
    });

    if (candidateError) {
      console.error('❌ RPC Error:', candidateError);
      throw candidateError;
    }

    if (!candidateData || candidateData.length === 0) {
      console.log('📭 No candidate found via RPC');
      return null;
    }

    const completeCandidate = candidateData[0];
    
    console.log('✅ Complete candidate data retrieved via RPC:', {
      id: completeCandidate.id,
      first_name: completeCandidate.first_name,
      last_name: completeCandidate.last_name,
      hasAIData: !!(completeCandidate.ai_score || completeCandidate.ai_explanation)
    });

    return completeCandidate;

  } catch (error: any) {
    console.error('❌ Error in getCompleteCandidateData:', error);
    throw error;
  }
};
