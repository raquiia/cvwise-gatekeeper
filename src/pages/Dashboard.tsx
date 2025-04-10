
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, FileText, Search, CheckCircle, 
  ChevronRight, Upload, Briefcase, Award, User,
  TrendingUp, TrendingDown, PieChart, LineChart, Calendar,
  ArrowUp, ArrowDown, ArrowUpRight, BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserData } from '@/hooks/useUserData';
import UserStats from '@/components/admin/UserStats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDate } from '@/utils/dateFormatter';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartLegendContent, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line } from 'recharts';
import MockDataAlert from '@/components/MockDataAlert';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const { toast } = useToast();
  const { realUsers, loading: usersLoading } = useUserData();
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [resumesCount, setResumesCount] = useState(0);
  const [topCandidatesCount, setTopCandidatesCount] = useState(0);
  
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
        
        const highScoredCandidates = (candidatesData || []).filter(
          candidate => candidate.score >= 85
        );
        setTopCandidatesCount(highScoredCandidates.length);
        
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
  
  // Sample data for KPI charts
  const monthlyResumesData = [
    { name: 'Jan', count: 12 },
    { name: 'Fév', count: 19 },
    { name: 'Mar', count: 15 },
    { name: 'Avr', count: 27 },
    { name: 'Mai', count: 32 },
    { name: 'Juin', count: 24 },
  ];
  
  const candidatesByDepartmentData = [
    { name: 'Tech', value: 35, color: '#8884d8' },
    { name: 'Marketing', value: 25, color: '#82ca9d' },
    { name: 'Finance', value: 20, color: '#ffc658' },
    { name: 'RH', value: 15, color: '#ff8042' },
    { name: 'Autre', value: 5, color: '#0088fe' },
  ];
  
  const candidateScoreData = [
    { name: '0-50', count: 5 },
    { name: '51-70', count: 15 },
    { name: '71-85', count: 25 },
    { name: '86-100', count: 20 },
  ];
  
  const conversionRateData = [
    { month: 'Jan', rate: 30 },
    { month: 'Fév', rate: 28 },
    { month: 'Mar', rate: 35 },
    { month: 'Avr', rate: 42 },
    { month: 'Mai', rate: 50 },
    { month: 'Juin', rate: 55 },
  ];
  
  const calculateGrowth = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Mock KPI metrics
  const kpiMetrics = {
    monthlyActiveUsers: {
      current: 457,
      previous: 410,
      growth: 11.5,
      positive: true
    },
    averageTimeToHire: {
      current: 18,
      previous: 23,
      growth: 21.7,
      positive: true,
      unit: 'jours'
    },
    candidateConversionRate: {
      current: 28,
      previous: 22,
      growth: 27.3,
      positive: true,
      unit: '%'
    },
    costPerHire: {
      current: 2250,
      previous: 2800,
      growth: 19.6,
      positive: true,
      unit: '€'
    }
  };
  
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
        
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {!loading ? (
            <>
              {/* KPI - Monthly Active Users */}
              <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Utilisateurs actifs</p>
                      <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">{kpiMetrics.monthlyActiveUsers.current}</h3>
                        <div className={`flex items-center ${kpiMetrics.monthlyActiveUsers.positive ? 'text-green-500' : 'text-red-500'} text-sm font-medium`}>
                          {kpiMetrics.monthlyActiveUsers.positive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          {kpiMetrics.monthlyActiveUsers.growth}%
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg text-white">
                      <Users size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">vs mois précédent</p>
                  <div className="mt-3">
                    <Progress value={85} className="h-1.5 bg-blue-100 dark:bg-blue-900/30" />
                  </div>
                </CardContent>
              </Card>
              
              {/* KPI - Average Time to Hire */}
              <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Temps de recrutement</p>
                      <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">{kpiMetrics.averageTimeToHire.current}</h3>
                        <div className={`flex items-center ${kpiMetrics.averageTimeToHire.positive ? 'text-green-500' : 'text-red-500'} text-sm font-medium`}>
                          {kpiMetrics.averageTimeToHire.positive ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                          {kpiMetrics.averageTimeToHire.growth}%
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-400 p-2 rounded-lg text-white">
                      <Calendar size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">jours en moyenne</p>
                  <div className="mt-3">
                    <Progress value={70} className="h-1.5 bg-green-100 dark:bg-green-900/30" />
                  </div>
                </CardContent>
              </Card>
              
              {/* KPI - Candidate Conversion Rate */}
              <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Taux de conversion</p>
                      <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">{kpiMetrics.candidateConversionRate.current}%</h3>
                        <div className={`flex items-center ${kpiMetrics.candidateConversionRate.positive ? 'text-green-500' : 'text-red-500'} text-sm font-medium`}>
                          {kpiMetrics.candidateConversionRate.positive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          {kpiMetrics.candidateConversionRate.growth}%
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600 to-violet-500 p-2 rounded-lg text-white">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">CV à embauches</p>
                  <div className="mt-3">
                    <Progress value={kpiMetrics.candidateConversionRate.current} className="h-1.5 bg-purple-100 dark:bg-purple-900/30" />
                  </div>
                </CardContent>
              </Card>
              
              {/* KPI - Cost Per Hire */}
              <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Coût par embauche</p>
                      <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent">{kpiMetrics.costPerHire.current}€</h3>
                        <div className={`flex items-center ${kpiMetrics.costPerHire.positive ? 'text-green-500' : 'text-red-500'} text-sm font-medium`}>
                          {kpiMetrics.costPerHire.positive ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                          {kpiMetrics.costPerHire.growth}%
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-orange-400 p-2 rounded-lg text-white">
                      <BarChart size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">économisé vs moyenne du secteur</p>
                  <div className="mt-3">
                    <Progress value={65} className="h-1.5 bg-amber-100 dark:bg-amber-900/30" />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="glass rounded-xl p-5 backdrop-blur-sm">
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
          )}
        </div>
        
        {/* Stats Cards Section - Standard stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="glass rounded-xl p-5 backdrop-blur-sm">
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
              <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">CV analysés</p>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">{resumesCount}</h3>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg text-white">
                      <FileText size={20} />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Link to="/resumes" className="text-xs font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 flex items-center group">
                      Voir tous les CV
                      <ChevronRight size={14} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Candidats</p>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">{candidatesCount}</h3>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-400 p-2 rounded-lg text-white">
                      <Users size={20} />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Link to="/candidates" className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center group">
                      Voir tous les candidats
                      <ChevronRight size={14} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Top Candidats</p>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent">{topCandidatesCount}</h3>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-green-400 p-2 rounded-lg text-white">
                      <Award size={20} />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground">
                      Score 85% ou plus
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Utilisateurs</p>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{realUsers.length}</h3>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600 to-pink-500 p-2 rounded-lg text-white">
                      <User size={20} />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Link to="/admin" className="text-xs font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 flex items-center group">
                      Panneau d'administration
                      <ChevronRight size={14} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Resumes Chart */}
          <Card className="border-purple-200/30 dark:border-purple-800/20 overflow-hidden shadow-xl bg-white/50 dark:bg-navy-dark/30 backdrop-blur-sm">
            <CardHeader className="p-5 border-b border-purple-100/50 dark:border-purple-900/30 backdrop-blur-sm bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-navy-dark/90 dark:to-purple-950/30">
              <CardTitle className="text-lg font-semibold text-navy-dark dark:text-sand">CV analysés par mois</CardTitle>
              <CardDescription className="text-muted-foreground">Evolution du nombre de CV traités</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={monthlyResumesData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)' }} />
                    <YAxis tick={{ fill: 'var(--muted-foreground)' }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-navy-dark p-2 border border-purple-200/50 dark:border-purple-900/30 rounded-md shadow-md">
                              <p className="text-sm font-medium">{`${payload[0].payload.name} : ${payload[0].value} CV`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#C4B5FD" />
                      </linearGradient>
                    </defs>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Candidates by Department Pie Chart */}
          <Card className="border-purple-200/30 dark:border-purple-800/20 overflow-hidden shadow-xl bg-white/50 dark:bg-navy-dark/30 backdrop-blur-sm">
            <CardHeader className="p-5 border-b border-purple-100/50 dark:border-purple-900/30 backdrop-blur-sm bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-navy-dark/90 dark:to-purple-950/30">
              <CardTitle className="text-lg font-semibold text-navy-dark dark:text-sand">Candidats par département</CardTitle>
              <CardDescription className="text-muted-foreground">Répartition par spécialité</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={candidatesByDepartmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {candidatesByDepartmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-navy-dark p-2 border border-purple-200/50 dark:border-purple-900/30 rounded-md shadow-md">
                              <p className="text-sm font-medium" style={{ color: payload[0].payload.color }}>
                                {`${payload[0].name} : ${payload[0].value} candidats`}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {candidatesByDepartmentData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Candidate Score Distribution Chart */}
          <Card className="border-purple-200/30 dark:border-purple-800/20 overflow-hidden shadow-xl bg-white/50 dark:bg-navy-dark/30 backdrop-blur-sm">
            <CardHeader className="p-5 border-b border-purple-100/50 dark:border-purple-900/30 backdrop-blur-sm bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-navy-dark/90 dark:to-purple-950/30">
              <CardTitle className="text-lg font-semibold text-navy-dark dark:text-sand">Distribution des scores</CardTitle>
              <CardDescription className="text-muted-foreground">Candidats par plage de score</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={candidateScoreData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)' }} />
                    <YAxis tick={{ fill: 'var(--muted-foreground)' }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-navy-dark p-2 border border-purple-200/50 dark:border-purple-900/30 rounded-md shadow-md">
                              <p className="text-sm font-medium">{`Score ${payload[0].payload.name} : ${payload[0].value} candidats`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="url(#scoreGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="100%" stopColor="#93C5FD" />
                      </linearGradient>
                    </defs>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Conversion Rate Trend Chart */}
          <Card className="border-purple-200/30 dark:border-purple-800/20 overflow-hidden shadow-xl bg-white/50 dark:bg-navy-dark/30 backdrop-blur-sm">
            <CardHeader className="p-5 border-b border-purple-100/50 dark:border-purple-900/30 backdrop-blur-sm bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-navy-dark/90 dark:to-purple-950/30">
              <CardTitle className="text-lg font-semibold text-navy-dark dark:text-sand">Tendance du taux de conversion</CardTitle>
              <CardDescription className="text-muted-foreground">Évolution sur les 6 derniers mois</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={conversionRateData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                    <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)' }} />
                    <YAxis tick={{ fill: 'var(--muted-foreground)' }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-navy-dark p-2 border border-purple-200/50 dark:border-purple-900/30 rounded-md shadow-md">
                              <p className="text-sm font-medium">{`${payload[0].payload.month} : ${payload[0].value}%`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ stroke: '#10B981', strokeWidth: 2, r: 4, fill: '#fff' }}
                      activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#fff' }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <MockDataAlert 
          feature="d'analyse avancée" 
          icon={<BarChart3 className="h-4 w-4" />}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-purple-200/30 dark:border-purple-800/20 overflow-hidden shadow-xl bg-white/50 dark:bg-navy-dark/30 backdrop-blur-sm">
              <CardHeader className="p-5 border-b border-purple-100/50 dark:border-purple-900/30 backdrop-blur-sm bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-navy-dark/90 dark:to-purple-950/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-navy-dark dark:text-sand">Candidats récents</h2>
                  <Link to="/candidates">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-navy-dark dark:hover:text-sand">
                      Voir tout
                      <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-purple-50/80 dark:bg-purple-900/20">
                      <th className="text-left p-4 text-sm font-medium text-navy-dark dark:text-sand">Nom</th>
                      <th className="text-left p-4 text-sm font-medium text-navy-dark dark:text-sand">Poste</th>
                      <th className="text-left p-4 text-sm font-medium text-navy-dark dark:text-sand">Score</th>
                      <th className="text-left p-4 text-sm font-medium text-navy-dark dark:text-sand">Date</th>
                      <th className="text-right p-4 text-sm font-medium text-navy-dark dark:text-sand">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array(5).fill(0).map((_, idx) => (
                        <tr key={idx} className="border-b border-purple-100/10 dark:border-purple-900/10">
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
                        <tr key={idx} className="border-b border-purple-100/10 dark:border-purple-900/10 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-800 dark:to-indigo-900 flex items-center justify-center text-purple-700 dark:text-purple-300 font-medium">
                                {candidate.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="font-medium text-navy-dark dark:text-sand">{candidate.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <Briefcase size={14} className="mr-2 text-muted-foreground" />
                              {candidate.position}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              candidate.status === 'high' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                              candidate.status === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
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
                              <Button variant="outline" size="sm" className="border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                Détails
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center py-6">
                            <div className="w-16 h-16 text-purple-300 dark:text-purple-700 opacity-50 mb-3">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                              </svg>
                            </div>
                            <p className="text-lg font-medium text-purple-700 dark:text-purple-300">Aucun candidat trouvé</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              <Link to="/resumes/upload" className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 underline">
                                Importez des CV
                              </Link> pour commencer à créer des profils de candidats
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
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
