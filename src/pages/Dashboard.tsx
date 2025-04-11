import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, Users, FileText, Search, CheckCircle, 
  ChevronRight, Upload, Briefcase, Award, GraduationCap, 
  Building, Heart, Terminal, Zap, Train, Microscope
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
import MockDataAlert from '@/components/MockDataAlert';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Sector, Legend
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const sectorIcons = {
  "IT": <Terminal size={16} className="mr-2" />,
  "Santé": <Heart size={16} className="mr-2" />,
  "Énergie": <Zap size={16} className="mr-2" />,
  "Ferroviaire": <Train size={16} className="mr-2" />,
  "Ingénierie": <Building size={16} className="mr-2" />,
  "Sciences": <Microscope size={16} className="mr-2" />,
};

const SectorPieChart = ({ data, loading }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#888" className="text-xs">
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill="#333" className="text-lg font-semibold">
          {value}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#888" className="text-xs">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.3}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Building size={48} className="mb-2 opacity-30" />
        <p>Aucune donnée de secteur disponible</p>
      </div>
    );
  }

  const COLORS = ['#8884d8', '#9c8edb', '#af97df', '#c3a1e2', '#d7aae6', '#eab4e9'];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          onMouseEnter={onPieEnter}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

const EducationBarChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3 py-8">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-5/6" />
        <Skeleton className="h-8 w-2/3" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <GraduationCap size={48} className="mb-2 opacity-30" />
        <p>Aucune donnée de niveau d'études disponible</p>
      </div>
    );
  }

  const getBarColor = (index) => {
    const colors = ['#8884d8', '#9c8edb', '#af97df', '#c3a1e2', '#d7aae6', '#eab4e9'];
    return colors[index % colors.length];
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white/90 dark:bg-gray-800/90 p-2 rounded border shadow">
                  <p className="font-medium">{payload[0].payload.name}</p>
                  <p className="text-sm">
                    <span className="font-medium">{payload[0].value}</span> candidats
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

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
  
  const extractEducationLevel = (candidate) => {
    if (!candidate.education || !Array.isArray(candidate.education) || candidate.education.length === 0) {
      return "Non spécifié";
    }
    
    const sortedEducation = [...candidate.education].sort((a, b) => {
      // Convert string dates to numeric timestamps for comparison
      const dateA = a.end_date ? new Date(a.end_date || "").getTime() : 0;
      const dateB = b.end_date ? new Date(b.end_date || "").getTime() : 0;
      return dateB - dateA;
    });
    
    const mostRecentEducation = sortedEducation[0];
    return mostRecentEducation.degree || mostRecentEducation.diploma || "Non spécifié";
  };
  
  const extractSector = (candidate) => {
    if (!candidate.experiences || !Array.isArray(candidate.experiences) || candidate.experiences.length === 0) {
      return "Non spécifié";
    }
    
    const sortedExperiences = [...candidate.experiences].sort((a, b) => {
      // Convert string dates to numeric timestamps for comparison
      const dateA = a.end_date ? new Date(a.end_date || "").getTime() : Number(Date.now());
      const dateB = b.end_date ? new Date(b.end_date || "").getTime() : Number(Date.now());
      return Number(dateB) - Number(dateA);
    });
    
    const mostRecentExperience = sortedExperiences[0];
    
    const title = (mostRecentExperience.title || "").toLowerCase();
    const company = (mostRecentExperience.company || "").toLowerCase();
    
    if (title.includes("développeur") || title.includes("informatique") || 
        title.includes("software") || title.includes("web") || title.includes("data")) {
      return "IT";
    } else if (title.includes("médecin") || title.includes("infirmier") || 
              title.includes("santé") || company.includes("hôpital") || 
              company.includes("clinique")) {
      return "Santé";
    } else if (title.includes("énergie") || title.includes("électricité") || 
              company.includes("edf") || company.includes("engie")) {
      return "Énergie";
    } else if (title.includes("ingénieur") || title.includes("engineer") || 
              title.includes("architecte")) {
      return "Ingénierie";
    } else if (title.includes("train") || title.includes("sncf") || 
              title.includes("ferroviaire") || company.includes("sncf")) {
      return "Ferroviaire";
    } else if (title.includes("science") || title.includes("recherche") || 
              title.includes("laboratoire")) {
      return "Sciences";
    }
    
    return "Autre";
  };
  
  const aggregateEducationData = (candidates) => {
    const educationMap = {};
    
    candidates.forEach(candidate => {
      const education = extractEducationLevel(candidate);
      educationMap[education] = (educationMap[education] || 0) + 1;
    });
    
    return Object.entries(educationMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };
  
  const aggregateSectorData = (candidates) => {
    const sectorMap = {};
    
    candidates.forEach(candidate => {
      const sector = extractSector(candidate);
      sectorMap[sector] = (sectorMap[sector] || 0) + 1;
    });
    
    return Object.entries(sectorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };
  
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
        
        setCandidatesData(candidatesData || []);
        setCandidatesCount(candidatesData?.length || 0);
        
        setEducationData(aggregateEducationData(candidatesData || []));
        setSectorData(aggregateSectorData(candidatesData || []));
        
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
            score: candidate.score || 0,
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
                      <Users size={20} />
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md">
            <CardHeader className="border-b border-purple-100/50 dark:border-purple-900/30">
              <div className="flex items-center">
                <GraduationCap className="mr-2 h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg font-semibold">Distribution par niveau d'études</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <EducationBarChart data={educationData} loading={loading} />
            </CardContent>
          </Card>
          
          <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md">
            <CardHeader className="border-b border-purple-100/50 dark:border-purple-900/30">
              <div className="flex items-center">
                <Building className="mr-2 h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg font-semibold">Distribution par secteur</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <SectorPieChart data={sectorData} loading={loading} />
            </CardContent>
          </Card>
        </div>
        
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
                        <tr key={idx} className="border-b border-purple-100/10 dark:border-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/50 transition-colors">
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                              </svg>
                            </div>
                            <p className="text-lg font-medium text-purple-700 dark:text-purple-300">Aucun candidat trouvé</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              <Link to="/resumes/upload" className="text-purple-600 hover:
