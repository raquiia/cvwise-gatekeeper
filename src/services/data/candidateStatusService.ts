
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
      
      const { error, data } = await supabase.rpc('update_candidate_status', { 
        p_candidate_id: candidateId,
        p_detailed_status: status
      });
      
      if (error) {
        console.error("RPC Error:", error);
        throw error;
      }
      
      console.log("RPC Result:", data);
      
      toast({
        title: "Statut mis à jour",
        description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Error updating candidate status:', error);
      
      // Tentative de fallback avec la méthode directe si le RPC échoue
      try {
        console.log("Trying direct update after RPC failure");
        const { error: directError } = await supabase
          .from('candidates')
          .update({ detailed_status: status })
          .eq('id', candidateId);
        
        if (directError) {
          console.error("Direct update error:", directError);
          throw directError;
        }
        
        toast({
          title: "Statut mis à jour",
          description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
        });
        
        return true;
      } catch (fallbackError: any) {
        console.error("Fallback error:", fallbackError);
        toast({
          title: "Erreur",
          description: `Impossible de mettre à jour le statut: ${fallbackError.message}`,
          variant: "destructive",
        });
        return false;
      }
    }
  },
  
  // Récupérer le statut détaillé d'un candidat
  getCandidateStatus: async (candidateId: string): Promise<string | null> => {
    try {
      console.log("Getting candidate status for:", candidateId);
      
      const { data, error } = await supabase.rpc('get_candidate_status', {
        p_candidate_id: candidateId
      });
      
      if (error) {
        console.error("RPC Error:", error);
        throw error;
      }
      
      console.log("RPC Result:", data);
      return data || null;
    } catch (error: any) {
      console.error('Error fetching candidate status:', error);
      
      // Tentative de fallback avec la méthode directe si le RPC échoue
      try {
        console.log("Trying direct query after RPC failure");
        const { data: directData, error: directError } = await supabase
          .from('candidates')
          .select('detailed_status')
          .eq('id', candidateId)
          .single();
        
        if (directError) {
          console.error("Direct query error:", directError);
          throw directError;
        }
        
        return directData?.detailed_status || null;
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        return null;
      }
    }
  }
};
