import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Users, Target, Eye, BarChart, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface UnifiedChannelAnalyticsProps {
  candidatesData: any[];
}

const UnifiedChannelAnalytics: React.FC<UnifiedChannelAnalyticsProps> = ({ candidatesData }) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'performance'>('overview');

  // Fonctions helper définies avant leur utilisation
  const getSourceDisplayName = (source: string) => {
    const sourceNames: Record<string, string> = {
      'linkedin': 'LinkedIn',
      'jobboard': 'Job Boards',
      'cooptation': 'Cooptation',
      'candidature_spontanee': 'Candidature Spontanée',
      'cabinet': 'Cabinet Partenaire',
      'direct': 'Contact Direct',
      'autre': 'Autre'
    };
    return sourceNames[source] || source;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'linkedin': return '💼';
      case 'jobboard': return '📋';
      case 'cooptation': return '🤝';
      case 'candidature_spontanee': return '📧';
      case 'cabinet': return '🏢';
      case 'direct': return '☎️';
      default: return '📊';
    }
  };

  // Calculer les métriques unifiées par canal
  const channelMetrics = useMemo(() => {
    const channels = candidatesData.reduce((acc, candidate) => {
      const source = candidate.source || 'direct';
      
      if (!acc[source]) {
        acc[source] = {
          name: source,
          total: 0,
          initial: 0,
          contact: 0,
          prequalification: 0,
          ec1: 0,
          ec2: 0,
          presentation_client: 0,
          en_mission: 0,
          refus: 0,
          recent: 0,
        };
      }
      
      acc[source].total++;
      acc[source][candidate.detailed_status || 'initial']++;
      
      // Candidats récents (30 jours)
      const candidateDate = new Date(candidate.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (candidateDate > thirtyDaysAgo) {
        acc[source].recent++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(channels).map((channel: any) => ({
      ...channel,
      qualified: channel.ec1 + channel.ec2 + channel.presentation_client + channel.en_mission,
      conversionRate: channel.total > 0 ? (channel.en_mission / channel.total) * 100 : 0,
      qualificationRate: channel.total > 0 ? ((channel.ec1 + channel.ec2 + channel.presentation_client + channel.en_mission) / channel.total) * 100 : 0,
      trend: channel.recent > channel.total / 4 ? 'up' : 'down',
      efficiency: channel.total > 0 ? Math.round(((channel.ec1 + channel.ec2 + channel.presentation_client + channel.en_mission) / channel.total) * 100) : 0
    }));
  }, [candidatesData]);

  // Top des canaux performants
  const topChannels = channelMetrics
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 4);

  // Canal le plus actif
  const mostActiveChannel = channelMetrics
    .sort((a, b) => b.recent - a.recent)[0];

  // Alertes intelligentes
  const alerts = useMemo(() => {
    const channelAlerts = [];
    
    channelMetrics.forEach(source => {
      if (source.conversionRate < 5 && source.total > 10) {
        channelAlerts.push({
          type: 'warning',
          message: `${getSourceDisplayName(source.name)}: Taux de conversion faible (${source.conversionRate.toFixed(1)}%)`,
          action: 'Revoir la stratégie de sourcing'
        });
      }
    });

    return channelAlerts.slice(0, 2); // Limiter à 2 alertes
  }, [channelMetrics]);


  // Données pour les graphiques
  const barChartData = channelMetrics.map(source => ({
    name: getSourceDisplayName(source.name),
    total: source.total,
    qualified: source.qualified,
    placed: source.en_mission
  }));

  const pieChartData = channelMetrics.map(source => ({
    name: getSourceDisplayName(source.name),
    value: source.total
  }));

  const COLORS = ['hsl(var(--blue))', 'hsl(var(--green))', 'hsl(var(--purple))', 'hsl(var(--gold))', 'hsl(var(--navy))'];

  return (
    <Card className="card-modern">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-blue">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Analyse des Canaux</CardTitle>
              <p className="text-sm text-muted-foreground">Performance et efficacité par canal d'acquisition</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={selectedView === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('overview')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Synthèse
            </Button>
            <Button
              variant={selectedView === 'performance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('performance')}
            >
              <BarChart className="h-4 w-4 mr-1" />
              Performance
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Alertes intelligentes */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg border-l-4 bg-orange-50 border-orange-400 dark:bg-orange-950/20"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as any)}>
          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Top des canaux performants */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="icon-green">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold">Top Performance</h3>
                </div>
                
                <div className="space-y-3">
                  {topChannels.slice(0, 3).map((channel, index) => (
                    <div key={channel.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getSourceIcon(channel.name)}</span>
                        <div>
                          <p className="text-sm font-medium">{getSourceDisplayName(channel.name)}</p>
                          <p className="text-xs text-muted-foreground">{channel.total} candidats</p>
                        </div>
                      </div>
                      <Badge variant={channel.conversionRate > 15 ? 'default' : channel.conversionRate > 5 ? 'secondary' : 'destructive'} className="text-xs">
                        {channel.conversionRate.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Canal le plus actif */}
              {mostActiveChannel && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="icon-blue">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold">Plus Actif (30j)</h3>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl mb-2">{getSourceIcon(mostActiveChannel.name)}</div>
                    <h4 className="font-medium">{getSourceDisplayName(mostActiveChannel.name)}</h4>
                    <p className="text-sm text-muted-foreground">{mostActiveChannel.recent} nouveaux</p>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Qualification</span>
                        <span>{mostActiveChannel.qualificationRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={mostActiveChannel.qualificationRate} className="h-2" />
                    </div>
                  </div>
                </Card>
              )}

              {/* Synthèse globale */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="icon-purple">
                    <BarChart className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold">Synthèse</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Canaux actifs:</span>
                    <span className="font-medium">{channelMetrics.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total candidats:</span>
                    <span className="font-medium">{channelMetrics.reduce((sum, c) => sum + c.total, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conversion moy.:</span>
                    <span className="font-medium">
                      {channelMetrics.length > 0 
                        ? (channelMetrics.reduce((sum, c) => sum + c.conversionRate, 0) / channelMetrics.length).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Meilleur canal:</span>
                    <span className="font-medium text-xs">
                      {topChannels[0] ? getSourceDisplayName(topChannels[0].name) : 'N/A'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Répartition visuelle */}
            {pieChartData.length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Répartition par Source</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Performance détaillée */}
          <TabsContent value="performance" className="space-y-6">
            {barChartData.length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Performance par Canal</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Bar dataKey="total" fill="hsl(var(--blue))" name="Total candidats" />
                      <Bar dataKey="qualified" fill="hsl(var(--purple))" name="Qualifiés" />
                      <Bar dataKey="placed" fill="hsl(var(--green))" name="En mission" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Tableau détaillé */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Détail par Canal</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2">Canal</th>
                      <th className="text-right p-2">Total</th>
                      <th className="text-right p-2">Qualifiés</th>
                      <th className="text-right p-2">En mission</th>
                      <th className="text-right p-2">Conversion</th>
                      <th className="text-right p-2">Efficacité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelMetrics.map((source) => (
                      <tr key={source.name} className="border-b border-border/50">
                        <td className="p-2 font-medium">{getSourceDisplayName(source.name)}</td>
                        <td className="text-right p-2">{source.total}</td>
                        <td className="text-right p-2">{source.qualified}</td>
                        <td className="text-right p-2">{source.en_mission}</td>
                        <td className="text-right p-2">
                          <Badge variant={source.conversionRate > 15 ? 'default' : source.conversionRate > 5 ? 'secondary' : 'destructive'}>
                            {source.conversionRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-right p-2">
                          <Badge variant={source.efficiency > 50 ? 'default' : source.efficiency > 30 ? 'secondary' : 'destructive'}>
                            {source.efficiency}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UnifiedChannelAnalytics;