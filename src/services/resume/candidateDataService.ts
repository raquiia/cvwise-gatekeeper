
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

/**
 * Service pour récupérer les données d'un candidat global (accès en lecture seule)
 * Utilise les politiques RLS existantes qui permettent la lecture globale
 */
export const getGlobalCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('🌍 Fetching global candidate data for ID:', candidateId);
    
    // Utiliser une requête SELECT directe pour s'appuyer sur les politiques RLS existantes
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (error) {
      console.error('❌ Error fetching global candidate:', error);
      throw error;
    }

    if (!candidate) {
      console.log('📭 No global candidate found with ID:', candidateId);
      return null;
    }

    // Récupérer les informations du propriétaire
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    const isOwnCandidate = candidate.user_id === currentUserId;

    let ownerInfo = { first_name: '', last_name: '' };
    if (!isOwnCandidate) {
      const { data: ownerProfile, error: ownerError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', candidate.user_id)
        .single();

      if (!ownerError && ownerProfile) {
        ownerInfo = ownerProfile;
      }
    } else {
      // Pour les candidats propres, récupérer le profil de l'utilisateur actuel
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', currentUserId)
        .single();

      if (!userError && userProfile) {
        ownerInfo = userProfile;
      }
    }

    const enrichedCandidate = {
      ...candidate,
      isOwnCandidate,
      owner_first_name: ownerInfo.first_name,
      owner_last_name: ownerInfo.last_name
    };
    
    console.log('✅ Global candidate data retrieved:', {
      id: enrichedCandidate.id,
      first_name: enrichedCandidate.first_name,
      last_name: enrichedCandidate.last_name,
      isOwnCandidate: enrichedCandidate.isOwnCandidate,
      owner_name: `${enrichedCandidate.owner_first_name} ${enrichedCandidate.owner_last_name}`,
      ai_score: enrichedCandidate.ai_score,
      hasAIData: !!(enrichedCandidate.ai_score || enrichedCandidate.ai_explanation)
    });

    return enrichedCandidate;

  } catch (error: any) {
    console.error('❌ Error in getGlobalCandidateData:', error);
    throw error;
  }
};
