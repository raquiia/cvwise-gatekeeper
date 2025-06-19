
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/candidateService';

/**
 * Service simplifié pour récupérer les données candidat - contourne les problèmes d'auth RPC
 */
export const getSimplifiedCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('🔍 Fetching candidate data via direct query for ID:', candidateId);
    
    // Vérifier l'authentification côté client
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      throw new Error('User not authenticated');
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // Récupérer directement depuis la table candidates avec RLS
    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .eq('user_id', user.id) // S'assurer que le candidat appartient à l'utilisateur
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
