
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/candidateService';

/**
 * Service optimisé pour récupérer les données candidat - utilise les RLS nettoyées
 */
export const getSimplifiedCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('🔍 Fetching candidate data for ID:', candidateId);
    
    // Récupération directe avec RLS optimisées - plus besoin de vérifications complexes
    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (candidateError) {
      console.error('❌ Error fetching candidate:', candidateError);
      
      if (candidateError.code === 'PGRST116') {
        console.log('📭 No candidate found or access denied');
        return null;
      }
      
      throw candidateError;
    }

    if (!candidateData) {
      console.log('📭 No candidate data returned');
      return null;
    }

    console.log('✅ Candidate data retrieved successfully:', {
      id: candidateData.id,
      first_name: candidateData.first_name,
      last_name: candidateData.last_name,
      hasAIData: !!(candidateData.ai_score || candidateData.ai_explanation)
    });

    return candidateData as CandidateData;

  } catch (error: any) {
    console.error('❌ Error in getSimplifiedCandidateData:', error);
    throw error;
  }
};
