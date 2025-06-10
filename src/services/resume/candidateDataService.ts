
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/candidateService';

/**
 * Récupérer les données complètes d'un candidat par son ID
 */
export const getCompleteCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('🔍 Fetching complete candidate data for ID:', candidateId);
    
    // Utiliser la fonction RPC get_candidate_by_id_bypassing_rls pour obtenir des données complètes
    const { data, error } = await supabase.rpc('get_candidate_by_id_bypassing_rls', {
      candidate_id_param: candidateId
    });
    
    if (error) {
      console.error('❌ Error fetching candidate data:', error.message);
      throw new Error(`Erreur lors de la récupération des données du candidat: ${error.message}`);
    }
    
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.log('⚠️ No candidate found with ID:', candidateId);
      return null;
    }
    
    // Handle both array and direct object responses
    const candidateRawData = Array.isArray(data) ? data[0] : data;
    
    console.log('📋 RAW ADDRESS DATA from database:', {
      address: candidateRawData.address,
      postal_code: candidateRawData.postal_code,
      city: candidateRawData.city,
      country: candidateRawData.country,
      addressType: typeof candidateRawData.address,
      postalCodeType: typeof candidateRawData.postal_code,
      cityType: typeof candidateRawData.city,
      countryType: typeof candidateRawData.country
    });
    
    console.log('✅ Successfully retrieved complete candidate data from database');
    
    // Cast to CandidateData since we know the RPC function returns all required fields
    return candidateRawData as CandidateData;
  } catch (error: any) {
    console.error('❌ Exception in getCompleteCandidateData:', error);
    toast({
      title: "Erreur",
      description: error.message || "Impossible de récupérer les données du candidat",
      variant: "destructive",
    });
    throw error;
  }
};
