
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
 * Met à jour le statut d'un candidat avec fallback robuste
 */
export const updateCandidateStatus = async (candidateId: string, status: string): Promise<boolean> => {
  try {
    console.log('Updating candidate status:', candidateId, 'to:', status);
    
    // Valider le statut avant la mise à jour
    if (!CANDIDATE_STATUSES.includes(status)) {
      throw new Error(`Statut invalide: ${status}`);
    }
    
    // Essayer d'abord l'Edge Function
    try {
      console.log('Trying Edge Function approach...');
      const { data, error } = await supabase.functions.invoke('update-candidate-status-secure', {
        body: {
          candidate_id: candidateId,
          detailed_status: status
        }
      });
      
      if (error) {
        console.warn('Edge Function failed, trying RPC fallback:', error);
        throw new Error('Edge Function failed');
      }
      
      if (data?.success) {
        console.log('Edge Function update successful');
        return true;
      }
    } catch (edgeFunctionError) {
      console.warn('Edge Function error, using RPC fallback:', edgeFunctionError);
    }
    
    // Fallback vers la fonction RPC PostgreSQL
    console.log('Using RPC fallback...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('update_candidate_status_secure', {
      p_candidate_id: candidateId,
      p_detailed_status: status
    });
    
    if (rpcError) {
      console.error('RPC Error updating candidate status:', rpcError);
      throw new Error(`Erreur RPC lors de la mise à jour du statut: ${rpcError.message}`);
    }
    
    if (rpcData) {
      console.log('RPC status update successful');
      return true;
    }
    
    // Si tout échoue, essayer une mise à jour directe
    console.log('Trying direct update as last resort...');
    const { error: directError } = await supabase
      .from('candidates')
      .update({ detailed_status: status, updated_at: new Date().toISOString() })
      .eq('id', candidateId);
    
    if (directError) {
      console.error('Direct update error:', directError);
      throw new Error(`Erreur lors de la mise à jour directe: ${directError.message}`);
    }
    
    console.log('Direct update successful');
    return true;
    
  } catch (error: any) {
    console.error('Candidate status update error:', error);
    throw new Error(error.message || 'Erreur lors de la mise à jour du statut');
  }
};

/**
 * Récupère le statut actuel d'un candidat avec fallback robuste
 */
export const getCandidateStatus = async (candidateId: string): Promise<string | null> => {
  try {
    console.log('Getting candidate status for:', candidateId);
    
    // Essayer d'abord l'Edge Function
    try {
      console.log('Trying Edge Function for status retrieval...');
      const { data, error } = await supabase.functions.invoke('get-candidate-status-secure', {
        body: {
          candidate_id: candidateId
        }
      });
        
      if (!error && data?.status) {
        console.log('Edge Function status retrieval successful:', data.status);
        return data.status;
      }
    } catch (edgeFunctionError) {
      console.warn('Edge Function error, using RPC fallback:', edgeFunctionError);
    }
    
    // Fallback vers la fonction RPC PostgreSQL
    console.log('Using RPC fallback for status retrieval...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_candidate_status_secure', {
      p_candidate_id: candidateId
    });
    
    if (!rpcError && rpcData) {
      console.log('RPC status retrieval successful:', rpcData);
      return rpcData;
    }
    
    // Si tout échoue, récupération directe
    console.log('Trying direct status retrieval...');
    const { data: directData, error: directError } = await supabase
      .from('candidates')
      .select('detailed_status')
      .eq('id', candidateId)
      .single();
    
    if (!directError && directData) {
      const status = directData.detailed_status || 'initial';
      console.log('Direct status retrieval successful:', status);
      return status;
    }
    
    console.warn('All status retrieval methods failed, returning initial');
    return 'initial';
    
  } catch (error) {
    console.error('Error in getCandidateStatus:', error);
    return 'initial';
  }
};

// Export the service object for backward compatibility
export const candidateStatusService = {
  updateCandidateStatus,
  getCandidateStatus
};
