import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserData } from '@/hooks/useUserData';
import UserStats from '@/components/admin/UserStats';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate } from '@/utils/dateFormatter';
import { calculateCandidateScore } from '@/services/scoring/candidateScoring';
import { formatCandidateData } from '@/services/data/candidateService';
import { aggregateEducationData, aggregateSectorData } from '@/utils/dashboardUtils';
import { recruitmentAnalyticsService, GlobalRecruitmentStats } from '@/services/analytics/recruitmentAnalyticsService';

// Import our modern components
import DashboardHeader from '@/components/dashboard/modern/DashboardHeader';
import RecruitmentKPICards from '@/components/dashboard/modern/RecruitmentKPICards';
import AdvancedAnalytics from '@/components/dashboard/modern/AdvancedAnalytics';
import RealDataMetrics from '@/components/dashboard/modern/RealDataMetrics';
import RecentCandidatesTable from '@/components/dashboard/RecentCandidatesTable';
import RecruitmentUserStats from '@/components/admin/RecruitmentUserStats';
import TaskCenter from '@/components/dashboard/TaskCenter';
import InterviewCalendar from '@/components/dashboard/InterviewCalendar';
import SourcingIntelligence from '@/components/dashboard/SourcingIntelligence';
import ChannelPerformanceWidget from '@/components/dashboard/ChannelPerformanceWidget';
import MyDayWidget from '@/components/dashboard/modern/MyDayWidget';
import { RecruitmentPipeline } from '@/components/dashboard/modern/RecruitmentPipeline';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [recruitmentStats, setRecruitmentStats] = useState<GlobalRecruitmentStats | null>(null);
  const { toast } = useToast();
  const { realUsers, loading: usersLoading } = useUserData();
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [resumesCount, setResumesCount] = useState(0);
  const [candidatesData, setCandidatesData] = useState([]);
  const [educationData, setEducationData] = useState([]);
  const [sectorData, setSectorData] = useState([]);
  
  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        // Récupérer les candidats via le service (contourne le problème RPC)
        const { candidateService } = await import('@/services/data/candidateService');
        const candidatesData = await candidateService.getUserCandidates();
        
        const formattedCandidates = (candidatesData || []).map(formatCandidateData);
        setCandidatesData(formattedCandidates);
        setCandidatesCount(formattedCandidates?.length || 0);
        
        setEducationData(aggregateEducationData(formattedCandidates || []));
        setSectorData(aggregateSectorData(formattedCandidates || []));
        
        // Récupérer les stats de recrutement
        const recruitmentStatsData = await recruitmentAnalyticsService.getGlobalStats();
        setRecruitmentStats(recruitmentStatsData);
        
        const recentCandidatesList = formattedCandidates
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(candidate => {
            const score = calculateCandidateScore(candidate);
            return {
              id: candidate.id,
              name: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
              position: candidate.position || 'Non spécifié',
              score: score.overall,
              date: formatDate(candidate.created_at),
              status: candidate.detailed_status || 'initial'
            };
          });
        
        setRecentCandidates(recentCandidatesList);
        
        // Récupérer les CVs
        const { data: userResumes, error: resumesError } = await supabase
          .rpc('get_user_resumes', { user_id_param: user.id });
          
        if (resumesError) {
          console.error('Error fetching resumes:', resumesError);
          throw resumesError;
        }
        
        setResumesCount(userResumes?.length || 0);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Erreur lors du chargement",
          description: "Impossible de charger les données du tableau de bord.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  return (
    <Layout className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-blue-50/30 dark:from-navy-dark/90 dark:via-navy-dark dark:to-purple-950/30">
      <div className="container mx-auto px-4 py-6 pb-16 space-y-8">
        
        {/* Modern Header */}
        <DashboardHeader onSearch={handleSearch} />
        
        {/* Phase 1: Smart Personalized Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MyDayWidget candidatesData={candidatesData} />
          <RecruitmentPipeline candidatesData={candidatesData} />
        </div>
        
        {/* Recruitment KPI Cards */}
        <RecruitmentKPICards 
          loading={loading}
          stats={recruitmentStats}
          resumesCount={resumesCount}
          candidatesCount={candidatesCount}
        />
        
        {/* Channel Performance Widget - Phase 1 */}
        <ChannelPerformanceWidget candidatesData={candidatesData} />
        
        {/* Sourcing Intelligence - Phase 1 */}
        <SourcingIntelligence candidatesData={candidatesData} />
        
        {/* Advanced Analytics - Only Real Data */}
        <AdvancedAnalytics 
          candidatesData={candidatesData}
          educationData={educationData}
          sectorData={sectorData}
        />
        
        {/* New Real Data Metrics */}
        <RealDataMetrics candidatesData={candidatesData} />
        
        {/* Task Center & Interview Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TaskCenter candidatesData={candidatesData} />
          <InterviewCalendar candidatesData={candidatesData} />
        </div>
        
        {/* Bottom Grid - Recent Data & User Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentCandidatesTable 
              loading={loading}
              candidates={recentCandidates}
            />
          </div>
          
          <div>
            {!usersLoading && (
              <div className="animate-fade-in">
                <Card className="border-purple-200/30 dark:border-purple-800/20 overflow-hidden shadow-xl bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl">
                  <CardHeader className="p-5 border-b border-purple-100/50 dark:border-purple-900/30 backdrop-blur-sm bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-navy-dark/90 dark:to-purple-950/30">
                    <CardTitle className="text-lg font-semibold text-navy-dark dark:text-sand">Équipe de recrutement</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <RecruitmentUserStats 
                      activeUsersCount={realUsers.length}
                      pendingUsersCount={0}
                      recentUsers={realUsers.slice(0, 3).map(user => ({
                        id: user.id,
                        email: user.email || '',
                        first_name: user.profile?.first_name || user.first_name || '',
                        last_name: user.profile?.last_name || user.last_name || '',
                        created_at: user.created_at,
                        last_sign_in_at: user.last_sign_in_at
                      }))}
                      formatDate={formatDate}
                      totalRecruiterCVs={resumesCount}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
