
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/candidateService';
import { getSimplifiedCandidateData } from './simplifiedCandidateDataService';

/**
 * Service simplifié pour récupérer les données complètes d'un candidat
 * Utilise uniquement l'approche directe avec les RLS optimisées
 */
export const getCompleteCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('🔍 Starting candidate data fetch for ID:', candidateId);
    
    // Utilisation directe du service simplifié - plus de fallback RPC complexe
    const candidateData = await getSimplifiedCandidateData(candidateId);
    
    if (candidateData) {
      console.log('✅ Successfully retrieved candidate data');
      return candidateData;
    }
    
    console.log('📭 No candidate found');
    return null;

  } catch (error: any) {
    console.error('❌ Error in getCompleteCandidateData:', error);
    throw error;
  }
};
