
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
        console.log("Fetching user data...");
        
        // Utiliser directement l'Edge Function qui a accès aux vraies données d'auth
        const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('list-users');
        
        if (edgeFunctionError) {
          console.error('Error fetching users via Edge Function:', edgeFunctionError);
          
          // Fallback vers les profils si l'Edge Function échoue
          const { data: profilesData, error: profileError } = await supabase
            .rpc('get_all_profiles_secure');
          
          if (profileError) {
            toast({
              title: "Erreur",
              description: "Impossible de récupérer les utilisateurs",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          if (profilesData && profilesData.length > 0) {
            const mappedUsers: RealUser[] = profilesData.map(profile => ({
              id: profile.id,
              email: null,
              first_name: profile.first_name || undefined,
              last_name: profile.last_name || undefined,
              company: profile.company || undefined,
              created_at: profile.created_at || new Date().toISOString(),
              last_sign_in_at: undefined, // Pas disponible dans les profils
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
          }
        } else if (edgeFunctionData && edgeFunctionData.users) {
          console.log("Real users loaded via Edge Function:", edgeFunctionData.users);
          
          // Mapper les données de l'Edge Function pour inclure les vraies informations d'auth
          const mappedUsers: RealUser[] = edgeFunctionData.users.map((user: any) => ({
            id: user.id,
            email: user.email || null,
            first_name: user.profile?.first_name || user.user_metadata?.first_name || '',
            last_name: user.profile?.last_name || user.user_metadata?.last_name || '',
            company: user.profile?.company || '',
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at, // Vraie donnée de connexion
            avatar_url: user.profile?.avatar_url || user.user_metadata?.avatar_url,
            profile: user.profile || {
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              company: '',
              is_admin: false,
              avatar_url: user.user_metadata?.avatar_url
            }
          }));
          
          setRealUsers(mappedUsers);
        } else {
          console.log("No users returned from Edge Function");
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('Unexpected error in useUserData:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la récupération des utilisateurs",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    
    fetchRealUsers();
  }, [toast]);
  
  return { realUsers, loading };
};
