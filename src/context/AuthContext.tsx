
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is admin based on profile or email
  const checkAdminStatus = async (user: User | null) => {
    if (!user) return false;
    
    try {
      // Check if user has admin role in profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profile?.is_admin === true) {
        return true;
      }
      
      // Owner of platform should always have admin access regardless of profile status
      const userEmail = user.email?.toLowerCase();
      if (userEmail) {
        // Add any email that should always have admin access
        const adminEmails = ['guillaume.aubry@migso-pcubed.com'];
        return adminEmails.includes(userEmail);
      }
      
      return false;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check admin status when user is signed in
          const adminStatus = await checkAdminStatus(session.user);
          setIsAdmin(adminStatus);
        }
        
        if (event === 'SIGNED_IN') {
          toast({
            title: "Connexion réussie",
            description: "Bienvenue sur CVwise",
          });
          // Don't force navigation to dashboard if user is trying to access admin
          const currentPath = window.location.pathname;
          if (currentPath !== '/admin') {
            navigate('/dashboard');
          }
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Déconnexion réussie",
            description: "À bientôt !",
          });
          navigate('/');
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check admin status on initial load
        const adminStatus = await checkAdminStatus(session.user);
        setIsAdmin(adminStatus);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast, navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: "Échec de la connexion",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            company: userData.company,
          },
        },
      });
      
      if (error) {
        toast({
          title: "Échec de l'inscription",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      toast({
        title: "Inscription réussie",
        description: "Votre demande d'inscription a été envoyée",
      });
      
      navigate('/registration-pending');
    } catch (error: any) {
      console.error('Error signing up:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Erreur lors de la déconnexion",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
