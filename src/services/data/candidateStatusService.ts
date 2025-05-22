
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
  // Mettre à jour le statut détaillé d'un candidat
  updateCandidateStatus: async (candidateId: string, status: string): Promise<boolean> => {
    try {
      console.log("Updating candidate status:", { candidateId, status });
      
      // Method 1: Use direct update with our candidate service
      try {
        const { error } = await supabase
          .from('candidates')
          .update({ detailed_status: status })
          .eq('id', candidateId);
        
        if (error) {
          console.error("Direct update error:", error);
          // If we get the recursion error, try the function method
          if (error.message?.includes('recursion')) {
            throw new Error('Recursion error, trying function method');
          }
          throw error;
        }
        
        toast({
          title: "Statut mis à jour",
          description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
        });
        
        return true;
      } catch (directError) {
        console.log("Direct update failed, trying function method");
        
        // Method 2: Try with the function
        const { error, data } = await supabase.functions.invoke('update_candidate_status', { 
          body: { 
            candidate_id: candidateId,
            detailed_status: status
          }
        });
        
        if (error) {
          console.error("Function Error:", error);
          throw error;
        }
        
        console.log("Function Result:", data);
        
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
  
  // Récupérer le statut détaillé d'un candidat
  getCandidateStatus: async (candidateId: string): Promise<string | null> => {
    try {
      console.log("Getting candidate status for:", candidateId);
      
      // Method 1: First try direct query as it's simpler
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('detailed_status')
          .eq('id', candidateId)
          .single();
        
        if (error) {
          console.error("Direct query error:", error);
          // If we get recursion error, try the function method
          if (error.message?.includes('recursion')) {
            throw new Error('Recursion error, trying function method');
          }
          throw error;
        }
        
        return data?.detailed_status || null;
      } catch (directError) {
        console.log("Direct query failed, trying function method");
        
        // Method 2: Try with the function
        const { data, error } = await supabase.functions.invoke('get_candidate_status', {
          body: { candidate_id: candidateId }
        });
        
        if (error) {
          console.error("Function Error:", error);
          throw error;
        }
        
        console.log("Function Result:", data);
        return data?.status as string || null;
      }
    } catch (error: any) {
      console.error('Error fetching candidate status:', error);
      return null;
    }
  }
};
