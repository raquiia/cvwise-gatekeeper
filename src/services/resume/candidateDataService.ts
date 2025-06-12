
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/candidateService';

/**
 * Service pour récupérer les données complètes d'un candidat avec les données AI
 */
export const getCompleteCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('🔍 Fetching complete candidate data for ID:', candidateId);
    
    // Récupérer les données de base du candidat
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

    const baseCandidate = candidateData[0];
    console.log('📋 Base candidate data retrieved:', {
      id: baseCandidate.id,
      first_name: baseCandidate.first_name,
      last_name: baseCandidate.last_name,
      address: baseCandidate.address,
      postal_code: baseCandidate.postal_code,
      city: baseCandidate.city,
      country: baseCandidate.country
    });

    // Récupérer les données AI depuis ai_candidate_scores
    console.log('🤖 Fetching AI analysis data from ai_candidate_scores...');
    const { data: aiData, error: aiError } = await supabase.rpc('get_ai_candidate_score', {
      p_candidate_id: candidateId,
      p_job_offer_id: null // Score général, pas spécifique à un job
    });

    if (aiError) {
      console.error('❌ Error fetching AI data:', aiError);
    }

    let aiAnalysis = null;
    if (aiData && aiData.length > 0) {
      aiAnalysis = aiData[0];
      console.log('✅ AI analysis data found:', {
        score: aiAnalysis.score,
        hasExplanation: !!aiAnalysis.explanation,
        strengthsCount: Array.isArray(aiAnalysis.strengths) ? aiAnalysis.strengths.length : 0,
        weaknessesCount: Array.isArray(aiAnalysis.weaknesses) ? aiAnalysis.weaknesses.length : 0,
        recommendationsCount: Array.isArray(aiAnalysis.recommendations) ? aiAnalysis.recommendations.length : 0,
        calculatedAt: aiAnalysis.calculated_at
      });
    } else {
      console.log('📭 No AI analysis data found for candidate:', candidateId);
    }

    // Combiner les données du candidat avec les données AI
    const completeCandidateData: CandidateData = {
      ...baseCandidate,
      // Données d'adresse explicites
      address: baseCandidate.address || '',
      postal_code: baseCandidate.postal_code || '',
      city: baseCandidate.city || '',
      country: baseCandidate.country || '',
      location: baseCandidate.location || '',
      // Données AI depuis ai_candidate_scores
      ai_score: aiAnalysis?.score || null,
      ai_explanation: aiAnalysis?.explanation || null,
      ai_breakdown: aiAnalysis?.breakdown || null,
      ai_strengths: aiAnalysis?.strengths || null,
      ai_weaknesses: aiAnalysis?.weaknesses || null,
      ai_recommendations: aiAnalysis?.recommendations || null,
      ai_analyzed_at: aiAnalysis?.calculated_at || null
    };

    console.log('🎯 Final candidate data with AI analysis:', {
      id: completeCandidateData.id,
      first_name: completeCandidateData.first_name,
      last_name: completeCandidateData.last_name,
      address: completeCandidateData.address,
      postal_code: completeCandidateData.postal_code,
      city: completeCandidateData.city,
      country: completeCandidateData.country,
      ai_score: completeCandidateData.ai_score,
      ai_analyzed_at: completeCandidateData.ai_analyzed_at,
      hasAIAnalysis: !!(completeCandidateData.ai_score || completeCandidateData.ai_explanation),
      strengthsCount: Array.isArray(completeCandidateData.ai_strengths) ? completeCandidateData.ai_strengths.length : 0,
      weaknessesCount: Array.isArray(completeCandidateData.ai_weaknesses) ? completeCandidateData.ai_weaknesses.length : 0,
      recommendationsCount: Array.isArray(completeCandidateData.ai_recommendations) ? completeCandidateData.ai_recommendations.length : 0
    });

    return completeCandidateData;

  } catch (error: any) {
    console.error('❌ Error in getCompleteCandidateData:', error);
    throw error;
  }
};
