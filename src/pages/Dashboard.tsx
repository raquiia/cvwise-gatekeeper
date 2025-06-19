
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRecruiterPerformance } from '@/hooks/useRecruiterPerformance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate } from '@/utils/dateFormatter';
import { calculateCandidateScore } from '@/services/scoring/candidateScoring';
import { formatCandidateData } from '@/services/data/candidateService';

// Import our modern components
import DashboardHeader from '@/components/dashboard/modern/DashboardHeader';
import ModernKPICards from '@/components/dashboard/modern/ModernKPICards';
import RecentCandidatesTable from '@/components/dashboard/RecentCandidatesTable';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const { toast } = useToast();
  const { stats: recruiterStats, loading: recruiterLoading } = useRecruiterPerformance();
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [resumesCount, setResumesCount] = useState(0);
  const [topCandidatesCount, setTopCandidatesCount] = useState(0);
  
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
        
        // Get current user's candidates
        const { data: candidatesData, error: candidatesError } = await supabase
          .rpc('get_user_candidates', { user_id_param: user.id });
          
        if (candidatesError) {
          console.error('Error fetching candidates:', candidatesError);
          throw candidatesError;
        }
        
        const formattedCandidates = (candidatesData || []).map(formatCandidateData);
        setCandidatesCount(formattedCandidates?.length || 0);
        
        // Calculate excellent candidates
        const excellentCandidates = formattedCandidates.filter(candidateData => {
          const score = calculateCandidateScore(candidateData);
          return score.overall >= 85;
        });
        setTopCandidatesCount(excellentCandidates.length);
        
        const recentCandidatesList = formattedCandidates
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(candidate => {
            const score = calculateCandidateScore(candidate);
            return {
              id: candidate.id,
              name: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
              position: candidate.position || 'Not specified',
              score: score.overall,
              date: formatDate(candidate.created_at),
              status: score.overall >= 85 ? 'high' : (score.overall >= 70 ? 'medium' : 'low')
            };
          });
        
        setRecentCandidates(recentCandidatesList);
        
        // Get user resumes
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
          title: "Error loading data",
          description: "Could not load your dashboard data. Please try again later.",
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
        
        <DashboardHeader onSearch={handleSearch} />
        
        <ModernKPICards 
          loading={loading}
          resumesCount={resumesCount}
          candidatesCount={candidatesCount}
          topCandidatesCount={topCandidatesCount}
          usersCount={1}
        />
        
        <div className="grid grid-cols-1 gap-6">
          <RecentCandidatesTable 
            loading={loading}
            candidates={recentCandidates}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
