
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
      
      // Méthode 1: Essayer d'abord la fonction edge pour éviter les problèmes de récursion
      try {
        console.log("Trying edge function first");
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
      } catch (functionError) {
        console.log("Function update failed, trying direct update", functionError);
        
        // Méthode 2: Essayer avec la mise à jour directe
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
  
  // Récupérer le statut détaillé d'un candidat
  getCandidateStatus: async (candidateId: string): Promise<string | null> => {
    try {
      console.log("Getting candidate status for:", candidateId);
      
      // Méthode 1: Essayer d'abord la fonction edge pour éviter les problèmes de récursion
      try {
        console.log("Trying edge function first");
        const { data, error } = await supabase.functions.invoke('get_candidate_status', {
          body: { candidate_id: candidateId }
        });
        
        if (error) {
          console.error("Function Error:", error);
          throw error;
        }
        
        console.log("Function Result:", data);
        return data?.status as string || null;
      } catch (functionError) {
        console.log("Function query failed, trying direct query", functionError);
        
        // Méthode 2: Essayer avec la requête directe
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
