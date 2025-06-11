
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
    
    // Log complet des données d'adresse retournées
    console.log('🏠 Complete address data from RPC function:', {
      candidateId,
      address: candidateRawData.address,
      postal_code: candidateRawData.postal_code,
      city: candidateRawData.city,
      country: candidateRawData.country,
      location: candidateRawData.location,
      // Types de données pour debug
      addressType: typeof candidateRawData.address,
      postalCodeType: typeof candidateRawData.postal_code,
      cityType: typeof candidateRawData.city,
      countryType: typeof candidateRawData.country,
      locationType: typeof candidateRawData.location,
      // Vérification des valeurs vides
      addressEmpty: !candidateRawData.address || candidateRawData.address.trim() === '',
      postalCodeEmpty: !candidateRawData.postal_code || candidateRawData.postal_code.trim() === '',
      cityEmpty: !candidateRawData.city || candidateRawData.city.trim() === '',
      countryEmpty: !candidateRawData.country || candidateRawData.country.trim() === '',
      locationEmpty: !candidateRawData.location || candidateRawData.location.trim() === ''
    });
    
    // Create the candidate data object with explicit address field mapping and cleaning
    const candidateData: CandidateData = {
      ...candidateRawData,
      // Explicitly map and clean address fields to ensure they're properly processed
      address: candidateRawData.address ? candidateRawData.address.trim() : '',
      postal_code: candidateRawData.postal_code ? candidateRawData.postal_code.trim() : '',
      city: candidateRawData.city ? candidateRawData.city.trim() : '',
      country: candidateRawData.country ? candidateRawData.country.trim() : '',
      location: candidateRawData.location ? candidateRawData.location.trim() : ''
    };
    
    console.log('✅ Successfully retrieved and cleaned candidate data with address fields:', {
      id: candidateData.id,
      first_name: candidateData.first_name,
      last_name: candidateData.last_name,
      address: candidateData.address,
      postal_code: candidateData.postal_code,
      city: candidateData.city, 
      country: candidateData.country,
      location: candidateData.location,
      hasAnyAddressInfo: !!(candidateData.address || candidateData.postal_code || candidateData.city || candidateData.country || candidateData.location)
    });
    
    return candidateData;
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
