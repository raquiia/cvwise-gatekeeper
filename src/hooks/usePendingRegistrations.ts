
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PendingRegistration {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export const usePendingRegistrations = () => {
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingRegistrations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_pending_registrations');

      if (error) {
        console.error('Error fetching pending registrations:', error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les demandes d'inscription",
          variant: "destructive",
        });
        return;
      }

      setPendingRegistrations(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveRegistration = async (registrationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('approve-registration', {
        body: {
          registrationId,
          action: 'approve'
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Inscription approuvée",
        description: "L'utilisateur peut maintenant se connecter",
      });

      // Rafraîchir la liste
      fetchPendingRegistrations();
    } catch (error: any) {
      console.error('Error approving registration:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'approuver l'inscription",
        variant: "destructive",
      });
    }
  };

  const rejectRegistration = async (registrationId: string, rejectionReason?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('approve-registration', {
        body: {
          registrationId,
          action: 'reject',
          rejectionReason
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Inscription rejetée",
        description: "La demande a été rejetée",
      });

      // Rafraîchir la liste
      fetchPendingRegistrations();
    } catch (error: any) {
      console.error('Error rejecting registration:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de rejeter l'inscription",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  return {
    pendingRegistrations,
    loading,
    approveRegistration,
    rejectRegistration,
    refetch: fetchPendingRegistrations
  };
};
