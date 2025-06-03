
import { supabase } from '@/integrations/supabase/client';

export const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  contact: 'Contact',
  qualification: 'Qualification',
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
 * Met à jour le statut d'un candidat en utilisant la fonction PostgreSQL sécurisée
 */
export const updateCandidateStatus = async (candidateId: string, status: string): Promise<boolean> => {
  try {
    console.log('Updating candidate status:', candidateId, 'to:', status);
    
    // Valider le statut avant la mise à jour
    if (!CANDIDATE_STATUSES.includes(status)) {
      throw new Error(`Statut invalide: ${status}`);
    }
    
    // Utiliser la fonction PostgreSQL sécurisée qui évite la récursion
    console.log('Using secure PostgreSQL function update_candidate_status_direct...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('update_candidate_status_direct', {
      p_candidate_id: candidateId,
      p_detailed_status: status
    });
    
    if (rpcError) {
      console.error('PostgreSQL function error:', rpcError);
      throw new Error(`Erreur lors de la mise à jour du statut: ${rpcError.message}`);
    }
    
    if (rpcData === true) {
      console.log('Status update successful via PostgreSQL function');
      return true;
    }
    
    throw new Error('La mise à jour du statut a échoué');
    
  } catch (error: any) {
    console.error('Candidate status update error:', error);
    throw new Error(error.message || 'Erreur lors de la mise à jour du statut');
  }
};

/**
 * Récupère le statut actuel d'un candidat en utilisant la fonction PostgreSQL sécurisée
 */
export const getCandidateStatus = async (candidateId: string): Promise<string | null> => {
  try {
    console.log('Getting candidate status for:', candidateId);
    
    // Utiliser la fonction PostgreSQL sécurisée
    console.log('Using secure PostgreSQL function get_candidate_status_direct...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_candidate_status_direct', {
      p_candidate_id: candidateId
    });
    
    if (!rpcError && rpcData) {
      console.log('Status retrieval successful:', rpcData);
      return rpcData;
    }
    
    if (rpcError) {
      console.error('PostgreSQL function error:', rpcError);
    }
    
    console.warn('Status retrieval failed, returning contact');
    return 'contact';
    
  } catch (error) {
    console.error('Error in getCandidateStatus:', error);
    return 'contact';
  }
};

// Export the service object for backward compatibility
export const candidateStatusService = {
  updateCandidateStatus,
  getCandidateStatus
};
