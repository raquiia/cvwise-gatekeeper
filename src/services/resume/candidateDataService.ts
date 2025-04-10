
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/resumeDataService';

/**
 * Récupérer les données complètes d'un candidat par son ID
 */
export const getCompleteCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('Fetching complete candidate data for ID:', candidateId);
    
    // Utiliser la fonction RPC get_candidate_by_id_bypassing_rls pour obtenir des données complètes
    // Cette fonction retourne toutes les colonnes y compris les champs JSON complexes
    const { data, error } = await supabase.rpc('get_candidate_by_id_bypassing_rls', {
      candidate_id_param: candidateId
    });
    
    if (error) {
      console.error('Error fetching candidate data:', error.message);
      throw new Error(`Erreur lors de la récupération des données du candidat: ${error.message}`);
    }
    
    if (!data) {
      console.log('No candidate found with ID:', candidateId);
      return null;
    }
    
    console.log('Successfully retrieved complete candidate data:', data);
    
    // Type assertion to ensure compatibility with CandidateData
    return data as unknown as CandidateData;
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
