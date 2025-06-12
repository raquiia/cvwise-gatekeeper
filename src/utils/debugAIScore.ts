
import { supabase } from '@/integrations/supabase/client';

export const debugAIScoreForCandidate = async (candidateId: string) => {
  console.log(`🔍 [DEBUG] Checking AI score for candidate: ${candidateId}`);
  
  try {
    // 1. Vérifier directement dans la table candidates pour les données AI
    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .select('ai_score, ai_explanation, ai_breakdown, ai_strengths, ai_weaknesses, ai_recommendations, ai_analyzed_at')
      .eq('id', candidateId);
    
    console.log('📊 [DEBUG] Candidate AI data query result:', candidateData);
    console.log('❌ [DEBUG] Candidate AI data query error:', candidateError);
    
    // 2. Vérifier avec la fonction RPC pour récupérer toutes les données du candidat
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_candidate_by_id_bypassing_rls', {
      candidate_id_param: candidateId
    });
    
    console.log('🔧 [DEBUG] RPC function result:', rpcData?.[0] ? {
      ai_score: rpcData[0].ai_score,
      ai_explanation: rpcData[0].ai_explanation ? 'Present' : 'Missing',
      ai_analyzed_at: rpcData[0].ai_analyzed_at,
      ai_breakdown: rpcData[0].ai_breakdown ? 'Present' : 'Missing',
      ai_strengths_count: Array.isArray(rpcData[0].ai_strengths) ? rpcData[0].ai_strengths.length : 0,
      ai_weaknesses_count: Array.isArray(rpcData[0].ai_weaknesses) ? rpcData[0].ai_weaknesses.length : 0,
      ai_recommendations_count: Array.isArray(rpcData[0].ai_recommendations) ? rpcData[0].ai_recommendations.length : 0
    } : 'No data');
    console.log('❌ [DEBUG] RPC function error:', rpcError);
    
    // 3. Vérifier l'utilisateur actuel
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('👤 [DEBUG] Current user:', userData.user?.id);
    console.log('❌ [DEBUG] User error:', userError);
    
    // 4. Vérifier tous les candidats avec données AI pour cet utilisateur
    const { data: allCandidatesWithAI, error: allCandidatesError } = await supabase
      .from('candidates')
      .select('id, first_name, last_name, ai_score, ai_analyzed_at')
      .eq('user_id', userData.user?.id || '')
      .not('ai_score', 'is', null);
    
    console.log('📋 [DEBUG] All candidates with AI data for user:', allCandidatesWithAI);
    console.log('❌ [DEBUG] All candidates query error:', allCandidatesError);
    
    const hasAIData = candidateData?.[0]?.ai_score !== null && candidateData?.[0]?.ai_score !== undefined;
    
    return {
      candidateQuery: { data: candidateData, error: candidateError },
      rpcQuery: { data: rpcData, error: rpcError },
      currentUser: userData.user?.id,
      allUserCandidatesWithAI: allCandidatesWithAI,
      hasAIData,
      summary: `Candidate ${candidateId} has ${hasAIData ? 'AI data' : 'no AI data'}`
    };
    
  } catch (error) {
    console.error('💥 [DEBUG] Exception during debug:', error);
    return { error };
  }
};
