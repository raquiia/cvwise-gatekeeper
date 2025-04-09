import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, FileText, Search, CheckCircle, 
  ChevronRight, Upload, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserData } from '@/hooks/useUserData';
import UserStats from '@/components/admin/UserStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/utils/dateFormatter';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const { toast } = useToast();
  const { realUsers, loading: usersLoading } = useUserData();
  const [companiesCount, setCompaniesCount] = useState(0);
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [resumesCount, setResumesCount] = useState(0);
  
  useEffect(() => {
    if (realUsers.length > 0) {
      const uniqueCompanies = new Set(
        realUsers
          .filter(user => user.company || (user.profile && user.profile.company))
          .map(user => user.company || (user.profile && user.profile.company))
          .filter(Boolean)
      );
      setCompaniesCount(uniqueCompanies.size);
    }
  }, [realUsers]);
  
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
        
        setCandidatesCount(candidatesData?.length || 0);
        
        const recentCandidatesList = (candidatesData || [])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(candidate => ({
            id: candidate.id,
            name: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
            position: candidate.position || 'Not specified',
            score: candidate.score || Math.floor(Math.random() * 30) + 70,
            date: formatDate(candidate.created_at),
            status: candidate.score >= 85 ? 'high' : (candidate.score >= 65 ? 'medium' : 'low')
          }));
        
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
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4 pb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-navy-dark mb-1">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome. Here is an overview of your activity.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search candidate..."
                className="input-field pl-10 w-full sm:w-auto"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Link to="/resumes/upload">
              <Button className="button-primary w-full sm:w-auto">
                <Upload size={18} className="mr-2" />
                Import Resume
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="glass rounded-xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : (
            <>
              <div className="glass rounded-xl p-5 card-hover">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-muted-foreground text-sm">Analyzed resumes</p>
                    <h3 className="text-2xl font-bold text-navy-dark">{resumesCount}</h3>
                  </div>
                  <div className="bg-navy p-2 rounded-lg text-white">
                    <FileText size={20} />
                  </div>
                </div>
                <div className="flex items-center">
                  <Link to="/resumes" className="text-xs font-medium text-blue-600 hover:text-blue-800">
                    View all resumes
                  </Link>
                </div>
              </div>
              
              <div className="glass rounded-xl p-5 card-hover">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-muted-foreground text-sm">Candidates</p>
                    <h3 className="text-2xl font-bold text-navy-dark">{candidatesCount}</h3>
                  </div>
                  <div className="bg-blue-500 p-2 rounded-lg text-white">
                    <Users size={20} />
                  </div>
                </div>
                <div className="flex items-center">
                  <Link to="/candidates" className="text-xs font-medium text-blue-600 hover:text-blue-800">
                    View all candidates
                  </Link>
                </div>
              </div>
              
              <div className="glass rounded-xl p-5 card-hover">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-muted-foreground text-sm">Companies</p>
                    <h3 className="text-2xl font-bold text-navy-dark">{companiesCount}</h3>
                  </div>
                  <div className="bg-emerald-500 p-2 rounded-lg text-white">
                    <Briefcase size={20} />
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground">
                    From user profiles
                  </span>
                </div>
              </div>
              
              <div className="glass rounded-xl p-5 card-hover">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-muted-foreground text-sm">Users</p>
                    <h3 className="text-2xl font-bold text-navy-dark">{realUsers.length}</h3>
                  </div>
                  <div className="bg-purple-500 p-2 rounded-lg text-white">
                    <Users size={20} />
                  </div>
                </div>
                <div className="flex items-center">
                  <Link to="/admin" className="text-xs font-medium text-blue-600 hover:text-blue-800">
                    Admin panel
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border/30">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-navy-dark">Recent Candidates</h2>
                <Link to="/candidates">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-navy-dark">
                    View all
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-navy/5">
                    <th className="text-left p-4 text-sm font-medium text-navy-dark">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-navy-dark">Position</th>
                    <th className="text-left p-4 text-sm font-medium text-navy-dark">Score</th>
                    <th className="text-left p-4 text-sm font-medium text-navy-dark">Date</th>
                    <th className="text-right p-4 text-sm font-medium text-navy-dark">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(5).fill(0).map((_, idx) => (
                      <tr key={idx} className="border-b border-border/10">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </td>
                        <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="p-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : recentCandidates.length > 0 ? (
                    recentCandidates.map((candidate, idx) => (
                      <tr key={idx} className="border-b border-border/10 hover:bg-navy/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy-dark font-medium">
                              {candidate.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-medium text-navy-dark">{candidate.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <Briefcase size={14} className="mr-2 text-muted-foreground" />
                            {candidate.position}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`rating-chip ${
                            candidate.status === 'high' ? 'rating-high' : 
                            candidate.status === 'medium' ? 'rating-medium' : 
                            'rating-low'
                          }`}>
                            <CheckCircle size={12} />
                            {candidate.score}%
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {candidate.date}
                        </td>
                        <td className="p-4 text-right">
                          <Link to={`/candidates/${candidate.id}`}>
                            <Button variant="ghost" size="sm">
                              Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No candidates found. <Link to="/resumes/upload" className="text-blue-600 hover:underline">Upload resumes</Link> to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            {!usersLoading && (
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
                companiesCount={companiesCount}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
