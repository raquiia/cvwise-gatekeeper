
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
      
      // Method 1: Try the edge function first
      try {
        console.log("Trying edge function first");
        const response = await supabase.functions.invoke('update_candidate_status', { 
          body: { 
            candidate_id: candidateId,
            detailed_status: status
          }
        });
        
        if (response.error) {
          console.error("Function Error:", response.error);
          throw response.error;
        }
        
        console.log("Function Result:", response.data);
        
        toast({
          title: "Statut mis à jour",
          description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
        });
        
        return true;
      } catch (functionError) {
        console.log("Function update failed, trying direct update", functionError);
        
        // Method 2: Try direct update
        const { error } = await supabase
          .from('candidates')
          .update({ detailed_status: status, updated_at: new Date().toISOString() })
          .eq('id', candidateId);
        
        if (error) {
          console.error("Direct update error:", error);
          throw error;
        }
        
        toast({
          title: "Statut mis à jour",
          description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
        });
        
        return true;
      }
    } catch (error: any) {
      console.error('Error updating candidate status:', error);
      
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le statut: ${error.message}`,
        variant: "destructive",
      });
      
      return false;
    }
  },
  
  // Get the detailed status of a candidate
  getCandidateStatus: async (candidateId: string): Promise<string | null> => {
    try {
      console.log("Getting candidate status for:", candidateId);
      
      // Method 1: Try the edge function first
      try {
        console.log("Trying edge function first");
        const response = await supabase.functions.invoke('get_candidate_status', {
          body: { candidate_id: candidateId }
        });
        
        if (response.error) {
          console.error("Function Error:", response.error);
          throw response.error;
        }
        
        console.log("Function Result:", response.data);
        return response.data?.status as string || null;
      } catch (functionError) {
        console.log("Function query failed, trying direct query", functionError);
        
        // Method 2: Try direct query
        const { data, error } = await supabase
          .from('candidates')
          .select('detailed_status')
          .eq('id', candidateId)
          .single();
        
        if (error) {
          console.error("Direct query error:", error);
          throw error;
        }
        
        return data?.detailed_status || null;
      }
    } catch (error: any) {
      console.error('Error fetching candidate status:', error);
      return null;
    }
  }
};
