
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/resumeDataService';

/**
 * Récupérer les données complètes d'un candidat par son ID
 */
export const getCompleteCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('🔍 Fetching complete candidate data for ID:', candidateId);
    
    // Utiliser la fonction RPC get_candidate_by_id_bypassing_rls pour obtenir des données complètes
    // Cette fonction retourne toutes les colonnes y compris les champs JSON complexes ET les champs d'adresse
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
    const candidateData = Array.isArray(data) ? data[0] : data;
    
    // Log spécifiquement les champs d'adresse pour debugging - use safe access
    console.log('📍 Address fields in retrieved data:', {
      address: candidateData?.address || 'UNDEFINED',
      postal_code: candidateData?.postal_code || 'UNDEFINED',
      city: candidateData?.city || 'UNDEFINED',
      country: candidateData?.country || 'UNDEFINED',
      location: candidateData?.location || 'UNDEFINED'
    });
    
    console.log('✅ Successfully retrieved complete candidate data:', candidateData);
    
    return candidateData as CandidateData;
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
