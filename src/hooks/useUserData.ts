
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
}

export const useUserData = () => {
  const [realUsers, setRealUsers] = useState<RealUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchRealUsers = async () => {
      try {
        setLoading(true);
        
        // Get current user only
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRealUsers([]);
          setLoading(false);
          return;
        }

        // Get current user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const currentUser: RealUser = {
          id: user.id,
          email: user.email,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          company: profile?.company,
          created_at: user.created_at || new Date().toISOString(),
          avatar_url: profile?.avatar_url
        };

        setRealUsers([currentUser]);
        setLoading(false);
      } catch (error: any) {
        console.error('Error in useUserData:', error);
        setLoading(false);
      }
    };
    
    fetchRealUsers();
  }, [toast]);
  
  return { realUsers, loading };
};
