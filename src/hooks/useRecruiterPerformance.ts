
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
    // New aggregated conversion rates
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
    
    // Count candidates who reached each stage (including those who went further)
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
      let aggregatedConversionRates = {
        prequalToEC1: 0,
        ec1ToEC2: 0,
        ec2ToPresentation: 0,
        globalToMission: 0
      };

      profiles?.forEach(profile => {
        const userCandidates = candidates?.filter(c => c.user_id === profile.id) || [];
        const candidatesInMission = userCandidates.filter(c => c.detailed_status === 'en_mission').length;
        
        // Calculate recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentActivity = userCandidates.filter(c => 
          new Date(c.created_at) >= thirtyDaysAgo
        ).length;

        // Calculate conversion rates for this recruiter
        const { conversionRates, pipelineCounts } = calculateConversionRates(userCandidates);
        
        // Overall conversion rate (existing logic)
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
          pipelineValue: candidatesInMission * 5000, // Estimation 5k€ per mission (kept for table display)
          lastActivity: lastCandidate?.created_at || profile.created_at,
          status,
          conversionRates,
          pipelineCounts
        });

        totalCandidates += userCandidates.length;
        totalInMission += candidatesInMission;
        totalRecentActivity += recentActivity;
        totalConversionRate += conversionRate;
        
        // Aggregate conversion rates
        aggregatedConversionRates.prequalToEC1 += conversionRates.prequalToEC1;
        aggregatedConversionRates.ec1ToEC2 += conversionRates.ec1ToEC2;
        aggregatedConversionRates.ec2ToPresentation += conversionRates.ec2ToPresentation;
        aggregatedConversionRates.globalToMission += conversionRates.globalToMission;
      });

      // Calculate aggregated stats
      const profileCount = profiles?.length || 0;
      const avgConversionRate = profileCount > 0 ? totalConversionRate / profileCount : 0;

      setRecruiters(recruiterPerformance);
      setStats({
        totalRecruiters: profileCount,
        totalCandidates,
        candidatesInMission: totalInMission,
        recentActivity: totalRecentActivity,
        averageConversionRate: avgConversionRate,
        averageConversionRates: {
          prequalToEC1: profileCount > 0 ? aggregatedConversionRates.prequalToEC1 / profileCount : 0,
          ec1ToEC2: profileCount > 0 ? aggregatedConversionRates.ec1ToEC2 / profileCount : 0,
          ec2ToPresentation: profileCount > 0 ? aggregatedConversionRates.ec2ToPresentation / profileCount : 0,
          globalToMission: profileCount > 0 ? aggregatedConversionRates.globalToMission / profileCount : 0
        }
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
