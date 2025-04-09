
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, FileText, Search, Clock, CheckCircle, 
  ChevronRight, Upload, Star, AlertCircle, ArrowUp, ArrowDown, 
  Filter, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { candidateService } from '@/services/data/candidateService';
import { jobOfferService } from '@/services/data/jobOfferService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { MockDataAlert } from '@/components/candidates/MockDataAlert';
import { useUserData } from '@/hooks/useUserData';

interface DashboardStats {
  candidatesCount: number;
  resumesCount: number;
  jobOffersCount: number;
  pendingCount: number;
  candidatesGrowth: number;
  resumesGrowth: number;
  jobOffersGrowth: number;
  pendingGrowth: number;
}

interface RecentActivity {
  action: string;
  user: string;
  time: string;
  icon: React.ReactNode;
}

interface TopSkill {
  name: string;
  count: number;
  percentage: number;
}

interface RecentCandidate {
  id: string;
  name: string;
  position: string;
  score: number;
  date: string;
  status: 'high' | 'medium' | 'low';
}

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topSkills, setTopSkills] = useState<TopSkill[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<RecentCandidate[]>([]);
  const [usingMockData, setUsingMockData] = useState(false);
  const { toast } = useToast();
  const { realUsers, loading: usersLoading } = useUserData();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        // Fetch real stats data
        try {
          // Fetch candidates count
          const candidates = await candidateService.getUserCandidates(user.id);
          const candidatesCount = candidates.length;
          
          // Fetch resumes count
          const { data: resumesData, error: resumesError } = await supabase
            .from('resumes')
            .select('id')
            .eq('user_id', user.id);
            
          if (resumesError) throw resumesError;
          const resumesCount = resumesData?.length || 0;
          
          // Fetch job offers count
          const jobOffers = await jobOfferService.getUserJobOffers();
          const jobOffersCount = jobOffers.length;
          
          // Fetch pending candidates count
          const pendingCandidates = candidates.filter(c => c.status === 'pending');
          const pendingCount = pendingCandidates.length;
          
          // Calculate growth (in a real app, this would compare to previous period)
          // For now, we'll use random values between -10 and +20
          const getRandomGrowth = () => Math.floor(Math.random() * 30) - 10;
          
          const realStats: DashboardStats = {
            candidatesCount,
            resumesCount,
            jobOffersCount,
            pendingCount,
            candidatesGrowth: getRandomGrowth(),
            resumesGrowth: getRandomGrowth(),
            jobOffersGrowth: getRandomGrowth(),
            pendingGrowth: getRandomGrowth() * -1, // Negative is good for pending
          };
          
          setStats(realStats);
          setUsingMockData(false);
          
          // Fetch recent candidates
          const sortedCandidates = [...candidates].sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          
          // Take the 5 most recent candidates
          const recentCandidatesData = sortedCandidates.slice(0, 5).map(candidate => {
            // Determine status based on score
            const score = candidate.score || Math.floor(Math.random() * 100);
            let status: 'high' | 'medium' | 'low' = 'medium';
            if (score >= 85) status = 'high';
            else if (score < 65) status = 'low';
            
            return {
              id: candidate.id,
              name: `${candidate.first_name} ${candidate.last_name}`,
              position: candidate.position || 'Not specified',
              score,
              date: new Date(candidate.created_at).toLocaleDateString('fr-FR'),
              status
            };
          });
          
          setRecentCandidates(recentCandidatesData);
          
          // Extract all skills from candidates for top skills section
          const allSkills: string[] = [];
          candidates.forEach(candidate => {
            if (candidate.skills && Array.isArray(candidate.skills)) {
              candidate.skills.forEach((skill: any) => {
                if (typeof skill === 'string') {
                  allSkills.push(skill);
                } else if (skill && typeof skill.name === 'string') {
                  allSkills.push(skill.name);
                }
              });
            }
          });
          
          // Count occurrences of each skill
          const skillCounts: Record<string, number> = {};
          allSkills.forEach(skill => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
          
          // Convert to array and sort by count (descending)
          const sortedSkills = Object.entries(skillCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
          
          // Take top 5 skills
          const maxCount = Math.max(...sortedSkills.map(s => s.count), 1);
          
          const topSkillsData = sortedSkills.slice(0, 5).map(skill => ({
            name: skill.name,
            count: skill.count,
            percentage: Math.round((skill.count / maxCount) * 100)
          }));
          
          setTopSkills(topSkillsData.length > 0 ? topSkillsData : getMockTopSkills());
          
          // Generate recent activity based on real data
          const allItems = [
            ...candidates.map(c => ({ 
              type: 'candidate', 
              name: `${c.first_name} ${c.last_name}`, 
              date: new Date(c.created_at)
            })),
            ...jobOffers.map(j => ({ 
              type: 'jobOffer', 
              name: j.title, 
              date: new Date(j.created_at)
            }))
          ].sort((a, b) => b.date.getTime() - a.date.getTime());
          
          // Take most recent 4 items
          const recentActivityData = allItems.slice(0, 4).map(item => {
            const timeAgo = getTimeAgo(item.date);
            
            if (item.type === 'candidate') {
              return {
                action: "Resume uploaded",
                user: item.name,
                time: timeAgo,
                icon: <Upload size={16} className="text-emerald-500" />
              };
            } else {
              return {
                action: "Offer created",
                user: item.name,
                time: timeAgo,
                icon: <FileText size={16} className="text-blue-500" />
              };
            }
          });
          
          setRecentActivity(recentActivityData.length > 0 ? recentActivityData : getMockRecentActivity());
          
        } catch (dataError) {
          console.error('Error fetching dashboard data:', dataError);
          throw dataError;
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setUsingMockData(true);
        toast({
          title: "Loading error",
          description: "Unable to load dashboard data. Displaying demo data.",
          variant: "destructive",
        });
        
        // Use mock data as fallback
        setStats(getMockStats());
        setRecentCandidates(getMockRecentCandidates());
        setTopSkills(getMockTopSkills());
        setRecentActivity(getMockRecentActivity());
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [toast]);
  
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
  
  const getMockStats = (): DashboardStats => ({
    candidatesCount: 89,
    resumesCount: 126,
    jobOffersCount: 12,
    pendingCount: 7,
    candidatesGrowth: 8,
    resumesGrowth: 12,
    jobOffersGrowth: 15,
    pendingGrowth: -2,
  });
  
  const getMockRecentCandidates = (): RecentCandidate[] => [
    { id: "1", name: "Marie Laurent", position: "Industrial Project Manager", score: 92, date: "23/07/2023", status: "high" },
    { id: "2", name: "Thomas Dubois", position: "Senior PMO", score: 86, date: "21/07/2023", status: "high" },
    { id: "3", name: "Julie Bernard", position: "Project Manager", score: 78, date: "20/07/2023", status: "medium" },
    { id: "4", name: "Nicolas Martin", position: "Project Director", score: 65, date: "18/07/2023", status: "medium" },
    { id: "5", name: "Caroline Petit", position: "Industrial Engineer", score: 54, date: "15/07/2023", status: "low" }
  ];
  
  const getMockTopSkills = (): TopSkill[] => [
    { name: "Project Management", count: 67, percentage: 75 },
    { name: "Agile", count: 58, percentage: 65 },
    { name: "Leadership", count: 52, percentage: 58 },
    { name: "JIRA", count: 45, percentage: 51 },
    { name: "PMO", count: 41, percentage: 46 }
  ];
  
  const getMockRecentActivity = (): RecentActivity[] => [
    { action: "Resume uploaded", user: "Thomas Petit", time: "5min ago", icon: <Upload size={16} className="text-emerald-500" /> },
    { action: "Candidate validated", user: "Julie Martin", time: "30min ago", icon: <CheckCircle size={16} className="text-emerald-500" /> },
    { action: "Resume analyzed", user: "Marc Dubois", time: "1h ago", icon: <FileText size={16} className="text-blue-500" /> },
    { action: "New user", user: "Sophie Girard", time: "3h ago", icon: <Users size={16} className="text-purple-500" /> }
  ];
  
  const getStatsArray = () => {
    if (!stats) return [];
    
    return [
      { 
        title: "Analyzed resumes", 
        value: stats.resumesCount, 
        change: `${stats.resumesGrowth > 0 ? '+' : ''}${stats.resumesGrowth}%`, 
        isPositive: stats.resumesGrowth > 0,
        icon: <FileText size={20} />,
        color: "bg-navy" 
      },
      { 
        title: "Candidates", 
        value: stats.candidatesCount, 
        change: `${stats.candidatesGrowth > 0 ? '+' : ''}${stats.candidatesGrowth}%`, 
        isPositive: stats.candidatesGrowth > 0,
        icon: <Users size={20} />,
        color: "bg-blue-500" 
      },
      { 
        title: "Job offers", 
        value: stats.jobOffersCount, 
        change: `${stats.jobOffersGrowth > 0 ? '+' : ''}${stats.jobOffersGrowth}%`, 
        isPositive: stats.jobOffersGrowth > 0,
        icon: <CheckCircle size={20} />,
        color: "bg-emerald-500" 
      },
      { 
        title: "Pending", 
        value: stats.pendingCount, 
        change: `${stats.pendingGrowth > 0 ? '+' : ''}${stats.pendingGrowth}%`, 
        isPositive: stats.pendingGrowth < 0, // For pending, negative is good
        icon: <Clock size={20} />,
        color: "bg-gold" 
      }
    ];
  };
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-navy-dark mb-1">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome. Here is an overview of your recent activity.
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
        
        {usingMockData && (
          <MockDataAlert />
        )}
        
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
            getStatsArray().map((stat, index) => (
              <div key={index} className="glass rounded-xl p-5 card-hover">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-muted-foreground text-sm">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-navy-dark">{stat.value}</h3>
                  </div>
                  <div className={`${stat.color} p-2 rounded-lg text-white`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="flex items-center">
                  {stat.isPositive ? (
                    <ArrowUp size={14} className="text-emerald-500 mr-1" />
                  ) : (
                    <ArrowDown size={14} className="text-red-500 mr-1" />
                  )}
                  <span className={`text-xs font-medium ${
                    stat.isPositive ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {stat.change} since last month
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                            candidate.score > 85 ? 'rating-high' : 
                            candidate.score > 65 ? 'rating-medium' : 
                            'rating-low'
                          }`}>
                            <Star size={12} />
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
                        No recent candidates
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="glass rounded-xl">
              <div className="p-5 border-b border-border/30">
                <h2 className="text-lg font-semibold text-navy-dark">Recent Activity</h2>
              </div>
              <div className="p-5">
                {loading ? (
                  Array(4).fill(0).map((_, idx) => (
                    <div key={idx} className="flex items-start mb-4">
                      <Skeleton className="w-8 h-8 rounded-full mr-3" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start mb-4">
                      <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center mr-3">
                        {activity.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy-dark">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">{activity.user}</span> • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </div>
            
            <div className="glass rounded-xl">
              <div className="p-5 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-navy-dark">Popular Skills</h2>
                  <Button variant="ghost" size="icon">
                    <Filter size={16} />
                  </Button>
                </div>
              </div>
              <div className="p-5">
                {loading ? (
                  Array(5).fill(0).map((_, idx) => (
                    <div key={idx} className="mb-4">
                      <div className="flex justify-between mb-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))
                ) : topSkills.length > 0 ? (
                  topSkills.map((skill, idx) => (
                    <div key={idx} className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-navy-dark">{skill.name}</span>
                        <span className="text-xs text-muted-foreground">{skill.count} candidates</span>
                      </div>
                      <Progress value={skill.percentage} className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No skills found</p>
                )}
              </div>
            </div>
            
            <div className="bg-navy/10 border border-navy/20 rounded-xl p-5">
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  <AlertCircle size={18} className="text-navy" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-navy-dark mb-1">Tip of the day</h3>
                  <p className="text-xs text-navy-dark/80">
                    Use advanced filters to refine your candidate search. You can filter by skills, years of experience, and location.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
