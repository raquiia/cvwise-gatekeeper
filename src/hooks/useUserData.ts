
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RealUser {
  id: string;
  email: string | null;
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
        
        // Using our secure function to get profile data
        const { data: profilesData, error } = await supabase
          .rpc('get_all_profiles_secure');
        
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
        
        if (profilesData) {
          console.log("Profils utilisateurs chargés:", profilesData);
          
          // Map the profiles data to match the RealUser interface
          const mappedUsers: RealUser[] = profilesData.map(profile => ({
            id: profile.id,
            email: null, // Email not available in profiles table
            first_name: profile.first_name || undefined,
            last_name: profile.last_name || undefined,
            company: profile.company || undefined,
            created_at: profile.created_at || new Date().toISOString(),
            avatar_url: profile.avatar_url || undefined,
            profile: {
              first_name: profile.first_name || undefined,
              last_name: profile.last_name || undefined,
              company: profile.company || undefined,
              is_admin: profile.is_admin || false,
              avatar_url: profile.avatar_url || undefined
            }
          }));
          
          setRealUsers(mappedUsers);
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
