
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const CANDIDATE_STATUSES = {
  INITIAL: 'initial',
  CONTACT: 'contact',
  PREQUALIFICATION: 'prequalification',
  EC1: 'ec1',
  EC2: 'ec2',
  PRESENTATION_CLIENT: 'presentation_client',
  EN_MISSION: 'en_mission',
  REFUS: 'refus',
  ANCIEN_EMPLOYE: 'ancien_employe'
};

export const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  'initial': 'Initial',
  'contact': 'Prise de contact',
  'prequalification': 'Préqualification',
  'ec1': 'EC1',
  'ec2': 'EC2',
  'presentation_client': 'Présentation client',
  'en_mission': 'En mission',
  'refus': 'Refusé',
  'ancien_employe': 'Ancien employé'
};

// Define interfaces for better type safety
interface CandidateWithStatus {
  id?: string;
  detailed_status?: string;
  [key: string]: any;
}

export const candidateStatusService = {
  // Update the detailed status of a candidate
  updateCandidateStatus: async (candidateId: string, status: string): Promise<boolean> => {
    try {
      console.log("Updating candidate status:", { candidateId, status });
      
      // Check if status is valid
      if (!Object.values(CANDIDATE_STATUSES).includes(status as any)) {
        console.error("Invalid status:", status);
        toast({
          title: "Erreur",
          description: `Statut invalide: ${status}`,
          variant: "destructive",
        });
        return false;
      }
      
      // Use the secure RPC function specifically for updating the status
      try {
        console.log("Using update_candidate_status RPC function");
        const { data, error } = await supabase.rpc('update_candidate_status', {
          p_candidate_id: candidateId,
          p_detailed_status: status
        });
        
        if (error) {
          console.error("RPC Error:", error);
          throw error;
        }
        
        console.log("Status update succeeded via RPC:", data);
        toast({
          title: "Statut mis à jour",
          description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
        });
        
        return true;
      } catch (rpcError) {
        console.error("RPC update failed, trying fallback:", rpcError);
        
        // Fallback to using update_candidate_secure
        const { data, error } = await supabase.rpc('update_candidate_secure', {
          p_candidate_id: candidateId,
          p_data: { detailed_status: status }
        });
        
        if (error) {
          console.error("Fallback update error:", error);
          throw error;
        }
        
        console.log("Status update succeeded via fallback method");
        toast({
          title: "Statut mis à jour",
          description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
        });
        
        return true;
      }
    } catch (error: any) {
      console.error('Error in updateCandidateStatus:', error);
      
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le statut: ${error.message || 'Erreur inconnue'}`,
        variant: "destructive",
      });
      
      return false;
    }
  },
  
  // Get the detailed status of a candidate
  getCandidateStatus: async (candidateId: string): Promise<string | null> => {
    try {
      console.log("Getting candidate status for:", candidateId);
      
      // Try using the dedicated status function first
      try {
        console.log("Attempting to get status via get_candidate_status RPC");
        const { data, error } = await supabase.rpc('get_candidate_status', {
          p_candidate_id: candidateId
        });
        
        if (error) {
          console.error("RPC Error for status:", error);
          throw error;
        }
        
        console.log("Retrieved status via dedicated RPC:", data);
        return data || 'initial';
      } catch (rpcError) {
        console.error("Status RPC failed, falling back to get_candidate_by_id:", rpcError);
        
        // Fallback to getting the full candidate
        const { data, error } = await supabase.rpc('get_candidate_by_id_bypassing_rls', {
          candidate_id_param: candidateId
        });
        
        if (error) {
          console.error("Error fetching candidate:", error);
          return null;
        }
        
        if (!data || data.length === 0) {
          console.log("No candidate found with ID:", candidateId);
          return null;
        }
        
        const candidate = Array.isArray(data) ? data[0] : data;
        
        // Properly type the candidate with detailed_status
        const candidateWithStatus = candidate as CandidateWithStatus;
        console.log("Retrieved candidate with status:", candidateWithStatus.detailed_status);
        
        return candidateWithStatus.detailed_status || 'initial';
      }
    } catch (error: any) {
      console.error('Error fetching candidate status:', error);
      return null;
    }
  }
};
