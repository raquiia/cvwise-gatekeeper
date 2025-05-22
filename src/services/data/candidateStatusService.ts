
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
      
      // Method 1: Try using the RPC function first
      try {
        console.log("Trying RPC function first");
        const { error } = await supabase.rpc('update_candidate_status', {
          p_candidate_id: candidateId,
          p_detailed_status: status
        });
        
        if (error) {
          console.error("RPC Error:", error);
          throw error;
        }
        
        console.log("RPC function succeeded");
        toast({
          title: "Statut mis à jour",
          description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
        });
        
        return true;
      } catch (rpcError) {
        console.log("RPC function failed, trying edge function", rpcError);
      
        // Method 2: Try the edge function
        try {
          console.log("Trying edge function");
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
          
          if (response.data?.success) {
            toast({
              title: "Statut mis à jour",
              description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
            });
            
            return true;
          } else {
            throw new Error("La fonction de mise à jour du statut a échoué");
          }
        } catch (functionError) {
          console.error("Edge function failed, trying direct DB update", functionError);
          
          // Method 3: Try direct database update as final fallback
          const { error } = await supabase
            .from('candidates')
            .update({ 
              detailed_status: status, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', candidateId);
          
          if (error) {
            console.error("Direct update error:", error);
            throw error;
          }
          
          console.log("Direct update successful");
          toast({
            title: "Statut mis à jour",
            description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
          });
          
          return true;
        }
      }
    } catch (error: any) {
      console.error('Error updating candidate status:', error);
      
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
      
      // Method 1: Try using the RPC function first
      try {
        console.log("Trying RPC function first");
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'get_candidate_status',
          { p_candidate_id: candidateId }
        );
        
        if (rpcError) {
          console.error("RPC Error:", rpcError);
          throw rpcError;
        }
        
        console.log("RPC function succeeded:", rpcData);
        return rpcData || null;
      } catch (rpcError) {
        console.log("RPC call failed, trying edge function", rpcError);
        
        // Method 2: Try the edge function as fallback
        try {
          console.log("Trying edge function");
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
          console.error("Edge function failed, trying direct query", functionError);
          
          // Method 3: Try direct query as final fallback
          const { data, error } = await supabase
            .from('candidates')
            .select('detailed_status')
            .eq('id', candidateId)
            .single();
          
          if (error) {
            console.error("Direct query error:", error);
            throw error;
          }
          
          console.log("Direct query successful:", data);
          
          // Enhanced processing to handle various return formats
          if (!data) return null;
          
          const detailedStatus = data.detailed_status;
          if (!detailedStatus) return null;
          
          // If it's a string, return it
          if (typeof detailedStatus === 'string') {
            return detailedStatus;
          }
          
          // If it's an object, try to extract status
          if (typeof detailedStatus === 'object' && detailedStatus !== null) {
            if ('value' in detailedStatus && detailedStatus.value) {
              return String(detailedStatus.value);
            }
            if ('status' in detailedStatus && detailedStatus.status) {
              return String(detailedStatus.status);
            }
            if ('name' in detailedStatus && detailedStatus.name) {
              return String(detailedStatus.name);
            }
          }
          
          return 'initial'; // Default fallback
        }
      }
    } catch (error: any) {
      console.error('Error fetching candidate status:', error);
      return null;
    }
  }
};
