
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/resumeDataService';

/**
 * Récupérer les données complètes d'un candidat par son ID
 */
export const getCompleteCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('Fetching complete candidate data for ID:', candidateId);
    
    // Utiliser la fonction RPC get_candidate_by_id pour obtenir des données complètes
    // Cette fonction est plus robuste que la requête directe et gère mieux les champs JSON
    const { data, error } = await supabase.rpc('get_candidate_by_id', {
      candidate_id_param: candidateId
    });
    
    if (error) {
      console.error('Error fetching candidate data:', error.message);
      throw new Error(`Erreur lors de la récupération des données du candidat: ${error.message}`);
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No candidate found with ID:', candidateId);
      return null;
    }
    
    // RPC returns an array, we need the first item
    const candidateData = data[0] as Record<string, any>;
    console.log('Successfully retrieved candidate data via RPC:', candidateData);
    
    // If the RPC returns incomplete data, try a direct query as fallback
    if (!candidateData || 
        !candidateData.experiences || 
        (Array.isArray(candidateData.experiences) && candidateData.experiences.length === 0)) {
      console.log('RPC returned incomplete data, trying direct query...');
      const { data: directData, error: directError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
      
      if (!directError && directData) {
        console.log('Successfully retrieved candidate data via direct query:', directData);
        return directData as CandidateData;
      }
    }
    
    // Type assertion to ensure compatibility with CandidateData
    return candidateData as unknown as CandidateData;
  } catch (error: any) {
    console.error('Exception in getCompleteCandidateData:', error);
    toast({
      title: "Erreur",
      description: error.message || "Impossible de récupérer les données du candidat",
      variant: "destructive",
    });
    throw error;
  }
};
