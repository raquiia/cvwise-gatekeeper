
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRecruiterPerformance = () => {
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecruiters: 1,
    totalCandidates: 0,
    candidatesInMission: 0,
    recentActivity: 0,
    averageConversionRate: 0,
    averageConversionRates: {
      prequalToEC1: 0,
      ec1ToEC2: 0,
      ec2ToPresentation: 0,
      globalToMission: 0
    }
  });
  const { toast } = useToast();

  const fetchRecruiterPerformance = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user authenticated');
        setLoading(false);
        return;
      }

      // Get current user's candidates
      const { data: candidates, error: candidatesError } = await supabase
        .rpc('get_user_candidates', { user_id_param: user.id });
      
      if (candidatesError) {
        throw candidatesError;
      }

      const userCandidates = candidates || [];
      const candidatesInMission = userCandidates.filter(c => 
        (c.detailed_status || c.status) === 'en_mission'
      ).length;
      
      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentActivity = userCandidates.filter(c => 
        new Date(c.created_at) >= thirtyDaysAgo
      ).length;

      const conversionRate = userCandidates.length > 0 ? 
        (candidatesInMission / userCandidates.length) * 100 : 0;

      setStats({
        totalRecruiters: 1,
        totalCandidates: userCandidates.length,
        candidatesInMission: candidatesInMission,
        recentActivity: recentActivity,
        averageConversionRate: conversionRate,
        averageConversionRates: {
          prequalToEC1: 0,
          ec1ToEC2: 0,
          ec2ToPresentation: 0,
          globalToMission: conversionRate
        }
      });

      setRecruiters([]);

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
