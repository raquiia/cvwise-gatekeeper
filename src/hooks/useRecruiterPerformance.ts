
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RecruiterPerformance } from '@/components/admin/RecruiterPerformanceTable';

export const useRecruiterPerformance = () => {
  const [recruiters, setRecruiters] = useState<RecruiterPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecruiters: 1, // Current user only
    totalCandidates: 0,
    candidatesInMission: 0,
    recentActivity: 0,
    averageConversionRate: 0,
    // Simplified conversion rates for current user only
    averageConversionRates: {
      prequalToEC1: 0,
      ec1ToEC2: 0,
      ec2ToPresentation: 0,
      globalToMission: 0
    }
  });
  const { toast } = useToast();

  const calculateConversionRates = (candidates: any[]) => {
    const prequalCandidates = candidates.filter(c => c.detailed_status === 'prequalification');
    const ec1Candidates = candidates.filter(c => c.detailed_status === 'ec1');
    const ec2Candidates = candidates.filter(c => c.detailed_status === 'ec2');
    const presentationCandidates = candidates.filter(c => c.detailed_status === 'presentation_client');
    const missionCandidates = candidates.filter(c => c.detailed_status === 'en_mission');
    
    // Count candidates who reached each stage
    const reachedEC1 = candidates.filter(c => 
      ['ec1', 'ec2', 'presentation_client', 'en_mission'].includes(c.detailed_status)
    ).length;
    
    const reachedEC2 = candidates.filter(c => 
      ['ec2', 'presentation_client', 'en_mission'].includes(c.detailed_status)
    ).length;
    
    const reachedPresentationOrMission = candidates.filter(c => 
      ['presentation_client', 'en_mission'].includes(c.detailed_status)
    ).length;

    // Calculate conversion rates
    const prequalToEC1 = prequalCandidates.length > 0 ? (reachedEC1 / (prequalCandidates.length + reachedEC1)) * 100 : 0;
    const ec1ToEC2 = (prequalCandidates.length + ec1Candidates.length) > 0 ? (reachedEC2 / (prequalCandidates.length + ec1Candidates.length + reachedEC2)) * 100 : 0;
    const ec2ToPresentation = (prequalCandidates.length + ec1Candidates.length + ec2Candidates.length) > 0 ? 
      (reachedPresentationOrMission / (prequalCandidates.length + ec1Candidates.length + ec2Candidates.length + reachedPresentationOrMission)) * 100 : 0;
    const globalToMission = candidates.length > 0 ? (missionCandidates.length / candidates.length) * 100 : 0;

    return {
      conversionRates: {
        prequalToEC1,
        ec1ToEC2,
        ec2ToPresentation,
        globalToMission
      },
      pipelineCounts: {
        prequalification: prequalCandidates.length,
        ec1: ec1Candidates.length,
        ec2: ec2Candidates.length,
        presentation: presentationCandidates.length,
        mission: missionCandidates.length
      }
    };
  };

  const fetchRecruiterPerformance = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user authenticated');
        setLoading(false);
        return;
      }

      // Get current user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Continue without profile data
      }

      // Get ONLY current user's candidates with detailed status
      const { data: candidates, error: candidatesError } = await supabase
        .rpc('get_user_candidates', { user_id_param: user.id });
      
      if (candidatesError) {
        throw candidatesError;
      }

      const userCandidates = candidates || [];
      const candidatesInMission = userCandidates.filter(c => c.detailed_status === 'en_mission').length;
      
      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentActivity = userCandidates.filter(c => 
        new Date(c.created_at) >= thirtyDaysAgo
      ).length;

      // Calculate conversion rates for current user
      const { conversionRates, pipelineCounts } = calculateConversionRates(userCandidates);
      
      // Overall conversion rate
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

      const currentUserPerformance: RecruiterPerformance = {
        id: user.id,
        name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utilisateur' : 'Utilisateur',
        email: user.email || user.id,
        avatar_url: profile?.avatar_url,
        totalCandidates: userCandidates.length,
        candidatesInMission,
        recentActivity,
        conversionRate,
        pipelineValue: candidatesInMission * 5000, // Estimation 5k€ per mission
        lastActivity: lastCandidate?.created_at || profile?.created_at || new Date().toISOString(),
        status,
        conversionRates,
        pipelineCounts
      };

      setRecruiters([currentUserPerformance]);
      setStats({
        totalRecruiters: 1, // Only current user
        totalCandidates: userCandidates.length,
        candidatesInMission: candidatesInMission,
        recentActivity: recentActivity,
        averageConversionRate: conversionRate,
        averageConversionRates: conversionRates
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
