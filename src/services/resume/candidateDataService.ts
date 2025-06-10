

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
    
    // Type assertion to access address fields safely
    const candidate = candidateData as any;
    
    // LOG DÉTAILLÉ des données brutes récupérées de la base
    console.log('🗃️ RAW DATA FROM DATABASE:', {
      id: candidate?.id,
      first_name: candidate?.first_name,
      last_name: candidate?.last_name,
      address: candidate?.address,
      postal_code: candidate?.postal_code,
      city: candidate?.city,
      country: candidate?.country,
      location: candidate?.location
    });
    
    // Log spécifiquement pour Louis Le Potvin
    if (candidate?.first_name === 'Louis' && candidate?.last_name === 'Le Potvin') {
      console.log('🎯 LOUIS LE POTVIN - RAW DATABASE DATA:', {
        address: candidate?.address || 'UNDEFINED',
        postal_code: candidate?.postal_code || 'UNDEFINED', 
        city: candidate?.city || 'UNDEFINED',
        country: candidate?.country || 'UNDEFINED',
        location: candidate?.location || 'UNDEFINED'
      });
    }
    
    console.log('✅ Successfully retrieved complete candidate data from database');
    
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

