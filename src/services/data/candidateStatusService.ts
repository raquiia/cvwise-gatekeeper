
import { supabase } from '@/integrations/supabase/client';

export const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  initial: 'Initial',
  contact: 'Contact',
  prequalification: 'Préqualification',
  ec1: 'Entretien client 1',
  ec2: 'Entretien client 2',
  presentation_client: 'Présentation client',
  en_mission: 'En mission',
  refus: 'Refus',
  ancien_employe: 'Ancien employé'
};

export const CANDIDATE_STATUSES = Object.keys(CANDIDATE_STATUS_LABELS);

/**
 * Met à jour le statut d'un candidat en utilisant la fonction RPC
 */
export const updateCandidateStatus = async (candidateId: string, status: string): Promise<boolean> => {
  try {
    console.log('Updating candidate status via RPC function:', candidateId, status);
    
    // Utiliser directement la fonction RPC au lieu de l'edge function
    const { data, error } = await supabase.rpc('update_candidate_status', {
      p_candidate_id: candidateId,
      p_detailed_status: status
    });
    
    if (error) {
      console.error('Error calling update_candidate_status RPC:', error);
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
    
    if (data !== true) {
      console.error('Update candidate status failed via RPC');
      throw new Error('Mise à jour du statut échouée - candidat non trouvé ou accès refusé');
    }
    
    console.log('Candidate status updated successfully via RPC');
    return true;
    
  } catch (error: any) {
    console.error('Candidate status update error:', error);
    throw new Error(error.message || 'Erreur lors de la mise à jour du statut');
  }
};

/**
 * Récupère le statut actuel d'un candidat
 */
export const getCandidateStatus = async (candidateId: string): Promise<string | null> => {
  try {
    // Utiliser la fonction RPC pour récupérer le statut
    const { data, error } = await supabase.rpc('get_candidate_status', {
      p_candidate_id: candidateId
    });
      
    if (error) {
      console.error('Error fetching candidate status via RPC:', error);
      return null;
    }
    
    return data || 'initial';
  } catch (error) {
    console.error('Error in getCandidateStatus:', error);
    return null;
  }
};

// Export the service object for backward compatibility
export const candidateStatusService = {
  updateCandidateStatus,
  getCandidateStatus
};
