
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
 * Met à jour le statut d'un candidat en utilisant la fonction RPC sécurisée
 */
export const updateCandidateStatus = async (candidateId: string, status: string): Promise<boolean> => {
  try {
    console.log('Updating candidate status via RPC:', candidateId, 'to:', status);
    
    // Valider le statut avant la mise à jour
    if (!CANDIDATE_STATUSES.includes(status)) {
      throw new Error(`Statut invalide: ${status}`);
    }
    
    // Utiliser la fonction RPC sécurisée pour mettre à jour le statut
    const { data, error } = await supabase.rpc('update_candidate_status_secure', {
      p_candidate_id: candidateId,
      p_detailed_status: status
    });
    
    if (error) {
      console.error('RPC Error updating candidate status:', error);
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
    
    if (data !== true) {
      throw new Error('Échec de la mise à jour du statut');
    }
    
    console.log('Candidate status updated successfully via RPC');
    return true;
    
  } catch (error: any) {
    console.error('Candidate status update error:', error);
    throw new Error(error.message || 'Erreur lors de la mise à jour du statut');
  }
};

/**
 * Récupère le statut actuel d'un candidat en utilisant la fonction RPC sécurisée
 */
export const getCandidateStatus = async (candidateId: string): Promise<string | null> => {
  try {
    console.log('Getting candidate status via RPC for:', candidateId);
    
    const { data, error } = await supabase.rpc('get_candidate_status_secure', {
      p_candidate_id: candidateId
    });
      
    if (error) {
      console.error('RPC Error fetching candidate status:', error);
      return null;
    }
    
    const status = data || 'initial';
    console.log('Retrieved candidate status via RPC:', status);
    return status;
  } catch (error) {
    console.error('Error in getCandidateStatus RPC:', error);
    return null;
  }
};

// Export the service object for backward compatibility
export const candidateStatusService = {
  updateCandidateStatus,
  getCandidateStatus
};
