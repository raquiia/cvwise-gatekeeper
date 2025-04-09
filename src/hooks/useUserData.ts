
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
        
        // Get all profiles using the secure function
        const { data: profilesData, error } = await supabase
          .rpc('get_all_profiles_secure');
        
        if (error) {
          console.error('Error fetching users:', error.message);
          toast({
            title: "Error",
            description: "Unable to retrieve users",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        if (profilesData && profilesData.length > 0) {
          console.log("User profiles loaded:", profilesData);
          
          // Map the profiles data to match the RealUser interface
          const mappedUsers: RealUser[] = profilesData.map(profile => ({
            id: profile.id,
            email: null, // Email not available in profiles table
            first_name: profile.first_name || undefined,
            last_name: profile.last_name || undefined,
            company: profile.company || undefined,
            created_at: profile.created_at || new Date().toISOString(),
            last_sign_in_at: profile.updated_at,
            avatar_url: profile.avatar_url || undefined,
            profile: {
              first_name: profile.first_name || undefined,
              last_name: profile.last_name || undefined,
              company: profile.company || undefined,
              is_admin: profile.is_admin || false,
              avatar_url: profile.avatar_url || undefined
            }
          }));
          
          console.log("Mapped users:", mappedUsers);
          setRealUsers(mappedUsers);
        } else {
          console.log('No user data received from profiles, trying Edge Function');
          
          // Fallback to Edge Function if profiles query returns no data
          try {
            const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('list-users');
            
            if (edgeFunctionError) {
              throw edgeFunctionError;
            }
            
            if (edgeFunctionData && edgeFunctionData.users) {
              console.log("Real users loaded via Edge Function:", edgeFunctionData.users);
              setRealUsers(edgeFunctionData.users);
            } else {
              console.log("No users returned from Edge Function");
            }
          } catch (fallbackError) {
            console.error('Error fetching users via Edge Function:', fallbackError);
          }
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('Unexpected error in useUserData:', error);
        setLoading(false);
      }
    };
    
    fetchRealUsers();
  }, [toast]);
  
  return { realUsers, loading };
};
