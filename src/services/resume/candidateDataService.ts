
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/candidateService';

/**
 * Service pour récupérer les données complètes d'un candidat en bypassing RLS si nécessaire
 */
export const getCompleteCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('🔍 Fetching complete candidate data for ID:', candidateId);
    
    // Utiliser la fonction RPC pour bypasser RLS et récupérer TOUTES les données
    const { data, error } = await supabase.rpc('get_candidate_by_id_bypassing_rls', {
      candidate_id_param: candidateId
    });

    if (error) {
      console.error('❌ Error fetching candidate with RPC:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('📭 No candidate found with ID:', candidateId);
      return null;
    }

    const candidateData = data[0];
    
    // Vérifier spécifiquement les données d'adresse et les données AI
    console.log('🏠 Complete address data from RPC function:', {
      candidateId,
      address: candidateData.address,
      postal_code: candidateData.postal_code,
      city: candidateData.city,
      country: candidateData.country,
      location: candidateData.location,
      addressType: typeof candidateData.address,
      postalCodeType: typeof candidateData.postal_code,
      cityType: typeof candidateData.city,
      countryType: typeof candidateData.country,
      locationType: typeof candidateData.location,
      addressEmpty: !candidateData.address,
      postalCodeEmpty: !candidateData.postal_code,
      cityEmpty: !candidateData.city,
      countryEmpty: !candidateData.country,
      locationEmpty: !candidateData.location
    });

    // Vérifier spécifiquement les données AI
    console.log('🤖 AI data from RPC function:', {
      candidateId,
      ai_score: candidateData.ai_score,
      ai_explanation: candidateData.ai_explanation ? `${candidateData.ai_explanation.substring(0, 100)}...` : null,
      ai_analyzed_at: candidateData.ai_analyzed_at,
      ai_strengths: candidateData.ai_strengths,
      ai_weaknesses: candidateData.ai_weaknesses,
      ai_recommendations: candidateData.ai_recommendations,
      ai_breakdown: candidateData.ai_breakdown
    });

    // Clean and return candidate data with ALL fields
    const cleanedData: CandidateData = {
      ...candidateData,
      // Ensure address fields are properly set
      address: candidateData.address || '',
      postal_code: candidateData.postal_code || '',
      city: candidateData.city || '',
      country: candidateData.country || '',
      location: candidateData.location || '',
      // Ensure AI fields are properly set
      ai_score: candidateData.ai_score,
      ai_explanation: candidateData.ai_explanation,
      ai_breakdown: candidateData.ai_breakdown,
      ai_strengths: candidateData.ai_strengths,
      ai_weaknesses: candidateData.ai_weaknesses,
      ai_recommendations: candidateData.ai_recommendations,
      ai_analyzed_at: candidateData.ai_analyzed_at
    };

    console.log('✅ Successfully retrieved and cleaned candidate data with address fields:', {
      id: cleanedData.id,
      first_name: cleanedData.first_name,
      last_name: cleanedData.last_name,
      address: cleanedData.address,
      postal_code: cleanedData.postal_code,
      city: cleanedData.city,
      country: cleanedData.country,
      location: cleanedData.location,
      hasAnyAddressInfo: !!(cleanedData.address || cleanedData.postal_code || cleanedData.city || cleanedData.country || cleanedData.location),
      // AI data info
      ai_score: cleanedData.ai_score,
      ai_analyzed_at: cleanedData.ai_analyzed_at,
      hasAIAnalysis: !!(cleanedData.ai_score || cleanedData.ai_explanation)
    });

    return cleanedData;

  } catch (error: any) {
    console.error('❌ Error in getCompleteCandidateData:', error);
    throw error;
  }
};
