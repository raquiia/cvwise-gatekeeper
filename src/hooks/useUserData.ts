
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RealUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  created_at: string;
  last_sign_in_at?: string;
  avatar_url?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    is_admin?: boolean;
    avatar_url?: string;
  }
}

export const useUserData = () => {
  const [realUsers, setRealUsers] = useState<RealUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchRealUsers = async () => {
      try {
        setLoading(true);
        
        // Using RPC function to get profile data to avoid the recursion issue
        const { data: userData, error } = await supabase
          .rpc('get_all_profiles_secure')
          .select('*');
        
        if (error) {
          console.error('Erreur lors de la récupération des utilisateurs:', error);
          toast({
            title: "Erreur",
            description: "Impossible de récupérer les utilisateurs",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        if (userData) {
          console.log("Utilisateurs réels chargés:", userData);
          setRealUsers(userData);
        } else {
          console.error('Aucune donnée d\'utilisateur reçue');
          
          // Fallback to Edge Function if RPC method fails
          try {
            const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('list-users');
            
            if (edgeFunctionError) {
              throw edgeFunctionError;
            }
            
            if (edgeFunctionData && edgeFunctionData.users) {
              console.log("Utilisateurs réels chargés via Edge Function:", edgeFunctionData.users);
              setRealUsers(edgeFunctionData.users);
            }
          } catch (fallbackError) {
            console.error('Erreur lors de la récupération des utilisateurs via Edge Function:', fallbackError);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur inattendue:', error);
        setLoading(false);
      }
    };
    
    fetchRealUsers();
  }, [toast]);
  
  return { realUsers, loading };
};
