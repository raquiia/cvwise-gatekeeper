
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
      
      // Simplified approach: Use the secure RPC function first, then fall back to direct update if needed
      try {
        console.log("Using secure RPC function for status update");
        const { data, error } = await supabase.rpc('update_candidate_secure', {
          p_candidate_id: candidateId,
          p_data: { detailed_status: status }
        });
        
        if (error) {
          console.error("RPC Error:", error);
          throw error;
        }
        
        console.log("Status update succeeded via secure RPC");
        toast({
          title: "Statut mis à jour",
          description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
        });
        
        return true;
      } catch (updateError) {
        console.error("Status update failed:", updateError);
        
        // Show error toast
        toast({
          title: "Erreur",
          description: `Impossible de mettre à jour le statut: ${updateError.message || 'Erreur inconnue'}`,
          variant: "destructive",
        });
        
        return false;
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
      
      // Use the secure method to get candidate details
      const { data, error } = await supabase.rpc('get_candidate_by_id_bypassing_rls', {
        candidate_id_param: candidateId
      });
      
      if (error) {
        console.error("Error fetching candidate status:", error);
        return null;
      }
      
      if (!data || data.length === 0) {
        console.log("No candidate found with ID:", candidateId);
        return null;
      }
      
      const candidate = Array.isArray(data) ? data[0] : data;
      console.log("Retrieved candidate with status:", candidate.detailed_status);
      
      return candidate.detailed_status || 'initial';
    } catch (error: any) {
      console.error('Error fetching candidate status:', error);
      return null;
    }
  }
};
