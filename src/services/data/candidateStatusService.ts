
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
 * Met à jour le statut d'un candidat en utilisant une Edge Function sécurisée
 */
export const updateCandidateStatus = async (candidateId: string, status: string): Promise<boolean> => {
  try {
    console.log('Updating candidate status via Edge Function:', candidateId, 'to:', status);
    
    // Valider le statut avant la mise à jour
    if (!CANDIDATE_STATUSES.includes(status)) {
      throw new Error(`Statut invalide: ${status}`);
    }
    
    // Utiliser l'Edge Function pour mettre à jour le statut
    const { data, error } = await supabase.functions.invoke('update-candidate-status-secure', {
      body: {
        candidate_id: candidateId,
        detailed_status: status
      }
    });
    
    if (error) {
      console.error('Edge Function Error updating candidate status:', error);
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
    
    if (!data?.success) {
      throw new Error('Échec de la mise à jour du statut');
    }
    
    console.log('Candidate status updated successfully via Edge Function');
    return true;
    
  } catch (error: any) {
    console.error('Candidate status update error:', error);
    throw new Error(error.message || 'Erreur lors de la mise à jour du statut');
  }
};

/**
 * Récupère le statut actuel d'un candidat en utilisant une Edge Function sécurisée
 */
export const getCandidateStatus = async (candidateId: string): Promise<string | null> => {
  try {
    console.log('Getting candidate status via Edge Function for:', candidateId);
    
    const { data, error } = await supabase.functions.invoke('get-candidate-status-secure', {
      body: {
        candidate_id: candidateId
      }
    });
      
    if (error) {
      console.error('Edge Function Error fetching candidate status:', error);
      return null;
    }
    
    const status = data?.status || 'initial';
    console.log('Retrieved candidate status via Edge Function:', status);
    return status;
  } catch (error) {
    console.error('Error in getCandidateStatus Edge Function:', error);
    return null;
  }
};

// Export the service object for backward compatibility
export const candidateStatusService = {
  updateCandidateStatus,
  getCandidateStatus
};
