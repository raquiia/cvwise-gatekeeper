
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
 * Met à jour le statut d'un candidat en utilisant l'edge function
 */
export const updateCandidateStatus = async (candidateId: string, status: string): Promise<boolean> => {
  try {
    console.log('Updating candidate status via edge function:', candidateId, status);
    
    const { data, error } = await supabase.functions.invoke('update-candidate-status', {
      body: {
        candidateId,
        status
      }
    });
    
    if (error) {
      console.error('Error calling update-candidate-status function:', error);
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
    
    if (!data || !data.success) {
      console.error('Update candidate status failed:', data?.error || 'Raison inconnue');
      throw new Error(data?.error || 'Mise à jour du statut échouée');
    }
    
    console.log('Candidate status updated successfully:', data.candidate);
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
    const { data, error } = await supabase
      .from('candidates')
      .select('detailed_status')
      .eq('id', candidateId)
      .single();
      
    if (error) {
      console.error('Error fetching candidate status:', error);
      return null;
    }
    
    return data.detailed_status || 'initial';
  } catch (error) {
    console.error('Error in getCandidateStatus:', error);
    return null;
  }
};
