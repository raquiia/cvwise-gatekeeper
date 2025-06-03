
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
 * Met à jour le statut d'un candidat
 */
export const updateCandidateStatus = async (candidateId: string, status: string): Promise<boolean> => {
  try {
    console.log('Updating candidate status:', candidateId, 'to:', status);
    
    // Valider le statut avant la mise à jour
    if (!CANDIDATE_STATUSES.includes(status)) {
      throw new Error(`Statut invalide: ${status}`);
    }
    
    // Utiliser une mise à jour directe de la table avec RLS
    const { data, error } = await supabase
      .from('candidates')
      .update({ 
        detailed_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId)
      .select('id, detailed_status')
      .single();
    
    if (error) {
      console.error('Error updating candidate status:', error);
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Aucune donnée retournée lors de la mise à jour');
    }
    
    console.log('Candidate status updated successfully:', data);
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
    console.log('Getting candidate status for:', candidateId);
    
    const { data, error } = await supabase
      .from('candidates')
      .select('detailed_status')
      .eq('id', candidateId)
      .single();
      
    if (error) {
      console.error('Error fetching candidate status:', error);
      return null;
    }
    
    const status = data?.detailed_status || 'initial';
    console.log('Retrieved candidate status:', status);
    return status;
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
