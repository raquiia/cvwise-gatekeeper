
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingUp, Calendar, Users, Target, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/utils/dateFormatter';

interface RecruiterDetailData {
  recruiter: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    totalCandidates: number;
    candidatesInMission: number;
    conversionRate: number;
    lastActivity: string;
    status: 'excellent' | 'good' | 'warning' | 'inactive';
  };
  timelineData: Array<{
    period: string;
    cvs: number;
    conversions: number;
    rate: number;
  }>;
  pipelineData: Array<{
    stage: string;
    count: number;
    conversion: number;
  }>;
  periodStats: {
    period: string;
    totalCvs: number;
    averageProcessingTime: number;
    qualityRatio: number;
    teamAverage: number;
  };
}

const RecruiterDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [data, setData] = useState<RecruiterDetailData | null>(null);

  useEffect(() => {
    if (id) {
      fetchRecruiterDetails();
    }
  }, [id, selectedPeriod]);

  const fetchRecruiterDetails = async () => {
    try {
      setLoading(true);

      // Get recruiter profile
      const { data: profile, error: profileError } = await supabase
        .rpc('get_all_profiles_secure');
      
      if (profileError) throw profileError;

      const recruiter = profile?.find(p => p.id === id);
      if (!recruiter) {
        toast({
          title: "Erreur",
          description: "Recruteur non trouvé",
          variant: "destructive",
        });
        navigate('/admin');
        return;
      }

      // Get candidates data for this recruiter
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', id);

      if (candidatesError) throw candidatesError;

      // Process timeline data based on selected period
      const timelineData = generateTimelineData(candidates || [], selectedPeriod);
      const pipelineData = generatePipelineData(candidates || []);
      const periodStats = calculatePeriodStats(candidates || [], selectedPeriod);

      // Calculate recruiter metrics
      const candidatesInMission = candidates?.filter(c => c.detailed_status === 'en_mission').length || 0;
      const conversionRate = candidates?.length > 0 ? (candidatesInMission / candidates.length) * 100 : 0;
      
      let status: 'excellent' | 'good' | 'warning' | 'inactive' = 'inactive';
      if (conversionRate >= 15 && periodStats.totalCvs >= 5) status = 'excellent';
      else if (conversionRate >= 10 || periodStats.totalCvs >= 3) status = 'good';
      else if (periodStats.totalCvs >= 1) status = 'warning';

      const lastCandidate = candidates?.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      setData({
        recruiter: {
          id: recruiter.id,
          name: `${recruiter.first_name || ''} ${recruiter.last_name || ''}`.trim() || 'Utilisateur',
          email: recruiter.id,
          avatar_url: recruiter.avatar_url,
          totalCandidates: candidates?.length || 0,
          candidatesInMission,
          conversionRate,
          lastActivity: lastCandidate?.created_at || recruiter.created_at,
          status
        },
        timelineData,
        pipelineData,
        periodStats
      });

    } catch (error: any) {
      console.error('Error fetching recruiter details:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les détails du recruteur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimelineData = (candidates: any[], period: string) => {
    const now = new Date();
    const periods: Array<{ period: string; cvs: number; conversions: number; rate: number }> = [];
    
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '6m') days = 180;
    else if (period === '1y') days = 365;

    // Generate periods based on selection
    const periodCount = period === '7d' ? 7 : period === '30d' ? 4 : period === '90d' ? 12 : 12;
    
    for (let i = periodCount - 1; i >= 0; i--) {
      const endDate = new Date(now);
      const startDate = new Date(now);
      
      if (period === '7d') {
        endDate.setDate(endDate.getDate() - i);
        startDate.setDate(startDate.getDate() - i);
      } else {
        const weeksBack = i * (days / periodCount / 7);
        endDate.setDate(endDate.getDate() - weeksBack * 7);
        startDate.setDate(startDate.getDate() - (weeksBack + (days / periodCount / 7)) * 7);
      }

      const periodCandidates = candidates.filter(c => {
        const createdAt = new Date(c.created_at);
        return createdAt >= startDate && createdAt <= endDate;
      });

      const conversions = periodCandidates.filter(c => c.detailed_status === 'en_mission').length;
      const rate = periodCandidates.length > 0 ? (conversions / periodCandidates.length) * 100 : 0;

      periods.push({
        period: period === '7d' ? endDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) :
                period === '30d' ? `S${Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24 * 7))}` :
                endDate.toLocaleDateString('fr-FR', { month: 'short' }),
        cvs: periodCandidates.length,
        conversions,
        rate
      });
    }

    return periods;
  };

  const generatePipelineData = (candidates: any[]) => {
    const stages = [
      { key: 'initial', label: 'Initial' },
      { key: 'contact', label: 'Contact' },
      { key: 'prequalification', label: 'Préqualification' },
      { key: 'ec1', label: 'EC1' },
      { key: 'ec2', label: 'EC2' },
      { key: 'presentation_client', label: 'Présentation client' },
      { key: 'en_mission', label: 'En mission' }
    ];

    return stages.map((stage, index) => {
      const count = candidates.filter(c => c.detailed_status === stage.key).length;
      const previousStageCount = index === 0 ? candidates.length : 
        candidates.filter(c => stages.slice(0, index + 1).map(s => s.key).includes(c.detailed_status)).length;
      const conversion = previousStageCount > 0 ? (count / previousStageCount) * 100 : 0;

      return {
        stage: stage.label,
        count,
        conversion: Math.round(conversion)
      };
    });
  };

  const calculatePeriodStats = (candidates: any[], period: string) => {
    const now = new Date();
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '6m') days = 180;
    else if (period === '1y') days = 365;

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const periodCandidates = candidates.filter(c => 
      new Date(c.created_at) >= startDate
    );

    // Calculate average processing time (mock data for now)
    const averageProcessingTime = 12; // days
    
    // Calculate quality ratio (candidates that reached at least EC1)
    const qualifiedCandidates = periodCandidates.filter(c => 
      ['ec1', 'ec2', 'presentation_client', 'en_mission'].includes(c.detailed_status)
    ).length;
    const qualityRatio = periodCandidates.length > 0 ? (qualifiedCandidates / periodCandidates.length) * 100 : 0;

    return {
      period: `${days} derniers jours`,
      totalCvs: periodCandidates.length,
      averageProcessingTime,
      qualityRatio,
      teamAverage: 8.5 // Mock team average
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-amber-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Bon';
      case 'warning': return 'Attention';
      case 'inactive': return 'Inactif';
      default: return 'Inconnu';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) return null;

  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft size={16} />
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-navy/10 rounded-full flex items-center justify-center">
                <span className="text-navy-dark font-semibold">
                  {data.recruiter.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-navy-dark">{data.recruiter.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${getStatusColor(data.recruiter.status)} text-white border-none`}>
                    {getStatusLabel(data.recruiter.status)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Dernière activité: {formatDate(data.recruiter.lastActivity)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Période d'analyse:</span>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
                <SelectItem value="6m">6 derniers mois</SelectItem>
                <SelectItem value="1y">Dernière année</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CV Total</p>
                  <p className="text-2xl font-bold">{data.recruiter.totalCandidates}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En Mission</p>
                  <p className="text-2xl font-bold text-green-600">{data.recruiter.candidatesInMission}</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux Conversion</p>
                  <p className="text-2xl font-bold">{data.recruiter.conversionRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{data.periodStats.period}</p>
                  <p className="text-2xl font-bold">{data.periodStats.totalCvs}</p>
                </div>
                <Calendar className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des CV et Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cvs" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="CV ajoutés"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversions" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Conversions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Taux de Conversion par Période</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Taux de conversion']} />
                  <Bar dataKey="rate" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline de Recrutement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.pipelineData.map((stage, index) => (
                  <div key={stage.stage} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                        {index + 1}
                      </div>
                      <span className="font-medium">{stage.stage}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{stage.count}</span>
                      <Badge variant="secondary">{stage.conversion}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Temps de traitement moyen</span>
                    <span className="font-semibold">{data.periodStats.averageProcessingTime} jours</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(data.periodStats.averageProcessingTime / 30 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Ratio de qualité</span>
                    <span className="font-semibold">{data.periodStats.qualityRatio.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${data.periodStats.qualityRatio}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Performance vs équipe</span>
                    <span className="font-semibold">
                      {data.periodStats.totalCvs > data.periodStats.teamAverage ? '+' : ''}
                      {(data.periodStats.totalCvs - data.periodStats.teamAverage).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Moyenne équipe: {data.periodStats.teamAverage} CV/période
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Indicateurs clés</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">CV/semaine</div>
                      <div className="font-semibold">{(data.periodStats.totalCvs / 4).toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Tendance</div>
                      <div className="font-semibold text-green-600">↗ +12%</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RecruiterDetail;
