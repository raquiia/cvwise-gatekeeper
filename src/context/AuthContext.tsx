
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
    console.log('AuthContext initializing...');
    let mounted = true;
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event);
        
        if (!mounted) return;
        
        if (newSession) {
          // Update state synchronously
          setSession(newSession);
          setUser(newSession.user);
          
          // Check admin status asynchronously
          setTimeout(async () => {
            if (!mounted) return;
            const adminStatus = await checkAdminStatus(newSession.user);
            setIsAdmin(adminStatus);
          }, 0);
          
          // Only show toast for SIGNED_IN event to prevent multiple toasts
          if (event === 'SIGNED_IN') {
            toast({
              title: "Connexion réussie",
              description: "Bienvenue sur CVwise",
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          
          toast({
            title: "Déconnexion réussie",
            description: "À bientôt !",
          });
          navigate('/');
        }
        
        // Always ensure loading is set to false after auth state change is processed
        setLoading(false);
      }
    );

    // Check for existing session
    const checkSession = async () => {
      try {
        console.log('Checking for existing session...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (currentSession) {
          // Update state synchronously
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Check admin status asynchronously
          setTimeout(async () => {
            if (!mounted) return;
            const adminStatus = await checkAdminStatus(currentSession.user);
            setIsAdmin(adminStatus);
          }, 0);
        }
        
        // Always set loading to false, even if there's no session
        console.log('Setting loading to false');
        setLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Execute the check session function
    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast, navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: "Échec de la connexion",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        throw error;
      }
      // Loading state will be cleared by the onAuthStateChange listener
    } catch (error: any) {
      console.error('Error signing in:', error);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
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
        setLoading(false);
        throw error;
      }
      
      toast({
        title: "Inscription réussie",
        description: "Votre demande d'inscription a été envoyée",
      });
      
      navigate('/registration-pending');
      setLoading(false);
    } catch (error: any) {
      console.error('Error signing up:', error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      // Loading state will be cleared by the onAuthStateChange listener
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Erreur lors de la déconnexion",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
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
