
import React, { useState, useEffect } from 'react';
import { Search, Upload, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserData } from '@/hooks/useUserData';
import UserStats from '@/components/admin/UserStats';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate } from '@/utils/dateFormatter';
import { calculateCandidateScore } from '@/services/scoring/candidateScoring';
import { formatCandidateData } from '@/services/data/candidateService';

// Import our new components
import StatCards from '@/components/dashboard/StatCards';
import RecentCandidatesTable from '@/components/dashboard/RecentCandidatesTable';
import ChartSections from '@/components/dashboard/ChartSections';
import { aggregateEducationData, aggregateSectorData } from '@/utils/dashboardUtils';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const { toast } = useToast();
  const { realUsers, loading: usersLoading } = useUserData();
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [resumesCount, setResumesCount] = useState(0);
  const [topCandidatesCount, setTopCandidatesCount] = useState(0);
  const [candidatesData, setCandidatesData] = useState([]);
  const [educationData, setEducationData] = useState([]);
  const [sectorData, setSectorData] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        const { data: candidatesData, error: candidatesError } = await supabase
          .rpc('get_user_candidates', { user_id_param: user.id });
          
        if (candidatesError) {
          console.error('Error fetching candidates:', candidatesError);
          throw candidatesError;
        }
        
        // Format candidates data to match CandidateData interface
        const formattedCandidates = (candidatesData || []).map(formatCandidateData);
        
        setCandidatesData(formattedCandidates);
        setCandidatesCount(formattedCandidates?.length || 0);
        
        setEducationData(aggregateEducationData(formattedCandidates || []));
        setSectorData(aggregateSectorData(formattedCandidates || []));
        
        // Calculer les candidats excellents avec le nouveau système de scoring
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
    <Layout className="py-8 bg-gradient-to-br from-purple-50/50 to-white dark:from-navy-dark/90 dark:to-navy-dark">
      <div className="container mx-auto px-4 pb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-navy-dark dark:text-sand mb-1 bg-gradient-to-r from-purple-700 to-indigo-600 dark:from-purple-400 dark:to-indigo-300 bg-clip-text text-transparent">
              Tableau de bord
            </h1>
            <p className="text-muted-foreground">
              Bienvenue sur le tableau de bord de Migso. Voici un aperçu de votre activité.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Rechercher un candidat..."
                className="border-purple-200/50 dark:border-purple-800/30 focus-visible:ring-purple-500 rounded-md pl-10 w-full sm:w-auto border bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm py-2 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Link to="/resumes/upload">
              <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 w-full sm:w-auto">
                <Upload size={18} className="mr-2" />
                Importer un CV
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Stat Cards */}
        <div className="mb-8">
          <StatCards 
            loading={loading}
            resumesCount={resumesCount}
            candidatesCount={candidatesCount}
            topCandidatesCount={topCandidatesCount}
            usersCount={realUsers.length}
          />
        </div>
        
        {/* Charts */}
        <div className="mb-8">
          <ChartSections 
            loading={loading}
            educationData={educationData}
            sectorData={sectorData}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RecentCandidatesTable 
              loading={loading}
              candidates={recentCandidates}
            />
          </div>
          
          <div>
            {!usersLoading && (
              <div className="animate-fade-in">
                <Card className="border-purple-200/30 dark:border-purple-800/20 overflow-hidden shadow-xl bg-white/50 dark:bg-navy-dark/30 backdrop-blur-sm">
                  <CardHeader className="p-5 border-b border-purple-100/50 dark:border-purple-900/30 backdrop-blur-sm bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-navy-dark/90 dark:to-purple-950/30">
                    <CardTitle className="text-lg font-semibold text-navy-dark dark:text-sand">Statistiques utilisateurs</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <UserStats 
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
                      companiesCount={topCandidatesCount}
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
