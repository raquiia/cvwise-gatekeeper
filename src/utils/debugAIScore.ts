
import { supabase } from '@/integrations/supabase/client';

export const debugAIScoreForCandidate = async (candidateId: string) => {
  console.log(`🔍 [DEBUG] Checking AI score for candidate: ${candidateId}`);
  
  try {
    // 1. Vérifier directement dans la table ai_candidate_scores
    const { data: directData, error: directError } = await supabase
      .from('ai_candidate_scores')
      .select('*')
      .eq('candidate_id', candidateId);
    
    console.log('📊 [DEBUG] Direct query result:', directData);
    console.log('❌ [DEBUG] Direct query error:', directError);
    
    // 2. Vérifier avec la fonction RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_ai_candidate_score', {
      p_candidate_id: candidateId,
      p_job_offer_id: null
    });
    
    console.log('🔧 [DEBUG] RPC function result:', rpcData);
    console.log('❌ [DEBUG] RPC function error:', rpcError);
    
    // 3. Vérifier l'utilisateur actuel
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('👤 [DEBUG] Current user:', userData.user?.id);
    console.log('❌ [DEBUG] User error:', userError);
    
    // 4. Vérifier tous les scores AI pour cet utilisateur
    const { data: allScores, error: allScoresError } = await supabase
      .from('ai_candidate_scores')
      .select('*')
      .eq('user_id', userData.user?.id || '');
    
    console.log('📋 [DEBUG] All AI scores for user:', allScores);
    console.log('❌ [DEBUG] All scores error:', allScoresError);
    
    return {
      directQuery: { data: directData, error: directError },
      rpcQuery: { data: rpcData, error: rpcError },
      currentUser: userData.user?.id,
      allUserScores: allScores
    };
    
  } catch (error) {
    console.error('💥 [DEBUG] Exception during debug:', error);
    return { error };
  }
};
