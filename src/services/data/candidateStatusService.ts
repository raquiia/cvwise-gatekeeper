
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const CANDIDATE_STATUSES = {
  INITIAL: 'initial',
  CONTACT: 'contact',
  ENTRETIEN: 'entretien',
  PRESENTATION_CLIENT: 'presentation_client',
  EN_MISSION: 'en_mission',
  REFUS: 'refus',
  ANNULE: 'annule'
};

export const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  'initial': 'Initial',
  'contact': 'Prise de contact',
  'entretien': 'Entretien',
  'presentation_client': 'Présentation client',
  'en_mission': 'En mission',
  'refus': 'Refusé',
  'annule': 'Annulé'
};

export const candidateStatusService = {
  // Mettre à jour le statut détaillé d'un candidat
  updateCandidateStatus: async (candidateId: string, status: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ detailed_status: status })
        .eq('id', candidateId);
      
      if (error) throw error;
      
      toast({
        title: "Statut mis à jour",
        description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
      });
      
      return true;
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
      const { data, error } = await supabase
        .from('candidates')
        .select('detailed_status')
        .eq('id', candidateId)
        .single();
      
      if (error) throw error;
      
      return data?.detailed_status || null;
    } catch (error: any) {
      console.error('Error fetching candidate status:', error);
      return null;
    }
  }
};
