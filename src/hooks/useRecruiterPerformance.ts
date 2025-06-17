
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RecruiterPerformance } from '@/components/admin/RecruiterPerformanceTable';

export const useRecruiterPerformance = () => {
  const [recruiters, setRecruiters] = useState<RecruiterPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecruiters: 0,
    totalCandidates: 0,
    candidatesInMission: 0,
    recentActivity: 0,
    averageConversionRate: 0,
    totalRevenuePotential: 0
  });
  const { toast } = useToast();

  const fetchRecruiterPerformance = async () => {
    try {
      setLoading(true);
      
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .rpc('get_all_profiles_secure');
      
      if (profilesError) {
        throw profilesError;
      }

      // Get candidates with detailed status for each user
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('user_id, detailed_status, created_at');
      
      if (candidatesError) {
        throw candidatesError;
      }

      // Process data to calculate performance metrics
      const recruiterPerformance: RecruiterPerformance[] = [];
      let totalCandidates = 0;
      let totalInMission = 0;
      let totalRecentActivity = 0;
      let totalConversionRate = 0;

      profiles?.forEach(profile => {
        const userCandidates = candidates?.filter(c => c.user_id === profile.id) || [];
        const candidatesInMission = userCandidates.filter(c => c.detailed_status === 'en_mission').length;
        
        // Calculate recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentActivity = userCandidates.filter(c => 
          new Date(c.created_at) >= thirtyDaysAgo
        ).length;

        // Calculate conversion rate
        const conversionRate = userCandidates.length > 0 ? 
          (candidatesInMission / userCandidates.length) * 100 : 0;

        // Determine status based on performance
        let status: 'excellent' | 'good' | 'warning' | 'inactive' = 'inactive';
        if (conversionRate >= 15 && recentActivity >= 5) status = 'excellent';
        else if (conversionRate >= 10 || recentActivity >= 3) status = 'good';
        else if (recentActivity >= 1) status = 'warning';

        // Calculate last activity
        const lastCandidate = userCandidates
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        recruiterPerformance.push({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utilisateur',
          email: profile.id, // We don't have email in profiles, using ID as placeholder
          avatar_url: profile.avatar_url,
          totalCandidates: userCandidates.length,
          candidatesInMission,
          recentActivity,
          conversionRate,
          pipelineValue: candidatesInMission * 5000, // Estimation 5k€ per mission
          lastActivity: lastCandidate?.created_at || profile.created_at,
          status
        });

        totalCandidates += userCandidates.length;
        totalInMission += candidatesInMission;
        totalRecentActivity += recentActivity;
        totalConversionRate += conversionRate;
      });

      // Calculate aggregated stats
      const avgConversionRate = profiles?.length > 0 ? totalConversionRate / profiles.length : 0;
      const totalRevenuePotential = totalInMission * 5000; // 5k€ per mission

      setRecruiters(recruiterPerformance);
      setStats({
        totalRecruiters: profiles?.length || 0,
        totalCandidates,
        candidatesInMission: totalInMission,
        recentActivity: totalRecentActivity,
        averageConversionRate: avgConversionRate,
        totalRevenuePotential
      });

    } catch (error: any) {
      console.error('Error fetching recruiter performance:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les données de performance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiterPerformance();
  }, []);

  return {
    recruiters,
    stats,
    loading,
    refetch: fetchRecruiterPerformance
  };
};
