
import { useState, useEffect, useCallback } from 'react';
import { candidateService, CandidateData } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useCandidatesData = () => {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCandidates = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setError("Vous devez être connecté pour voir vos candidats");
      setLoading(false);
      return;
    }
    
    try {
      if (forceRefresh) {
        console.log('🔄 Force refreshing candidates data...');
      }
      
      setLoading(true);
      setError(null);
      
      console.log("📡 Fetching candidates for user:", user.id);
      const data = await candidateService.getUserCandidates();
      console.log("📥 Retrieved candidates:", data);
      
      if (Array.isArray(data)) {
        const sortedCandidates = [...data].sort((a, b) => 
          new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime()
        );
        
        // Log status distribution
        console.log('📊 Status distribution after fetch:');
        const statusCount = sortedCandidates.reduce((acc, candidate) => {
          const status = candidate.detailed_status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        Object.entries(statusCount).forEach(([status, count]) => {
          console.log(`   ${status}: ${count} candidate(s)`);
        });
        
        setCandidates(sortedCandidates);
      } else {
        console.error("Candidates data is not an array:", data);
        setCandidates([]);
        setError("Format de données incorrect");
      }
    } catch (error: any) {
      console.error('❌ Error fetching candidates:', error);
      setError(error?.message || "Impossible de récupérer les candidats");
      
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de récupérer les candidats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const refreshCandidates = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    await fetchCandidates(true);
  }, [fetchCandidates]);

  // Auto-fetch on mount and user change
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Listen for page visibility changes to refresh data when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, refreshing candidates');
        refreshCandidates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshCandidates]);

  return {
    candidates,
    loading,
    error,
    refreshCandidates,
    fetchCandidates
  };
};
