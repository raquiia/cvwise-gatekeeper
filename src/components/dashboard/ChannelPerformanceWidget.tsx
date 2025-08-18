import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Users, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ChannelPerformanceWidgetProps {
  candidatesData: any[];
}

const ChannelPerformanceWidget: React.FC<ChannelPerformanceWidgetProps> = ({ candidatesData }) => {
  // Calculer les métriques par canal
  const channelMetrics = useMemo(() => {
    const channels = candidatesData.reduce((acc, candidate) => {
      const source = candidate.source || 'direct';
      
      if (!acc[source]) {
        acc[source] = {
          name: source,
          total: 0,
          qualified: 0,
          placed: 0,
          recent: 0, // candidats des 30 derniers jours
        };
      }
      
      acc[source].total++;
      
      // Candidats qualifiés (EC1+)
      if (['ec1', 'ec2', 'presentation_client', 'en_mission'].includes(candidate.detailed_status)) {
        acc[source].qualified++;
      }
      
      // Candidats placés
      if (candidate.detailed_status === 'en_mission') {
        acc[source].placed++;
      }
      
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
      conversionRate: channel.total > 0 ? (channel.placed / channel.total) * 100 : 0,
      qualificationRate: channel.total > 0 ? (channel.qualified / channel.total) * 100 : 0,
      recentActivity: channel.recent,
      trend: channel.recent > channel.total / 4 ? 'up' : 'down', // Tendance basée sur l'activité récente
      efficiency: channel.total > 0 ? Math.round((channel.placed * 100) / channel.total) : 0
    }));
  }, [candidatesData]);

  // Top 3 des canaux par performance
  const topChannels = channelMetrics
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 3);

  // Canal le plus actif récemment
  const mostActiveChannel = channelMetrics
    .sort((a, b) => b.recentActivity - a.recentActivity)[0];

  // Canal nécessitant attention
  const attentionChannel = channelMetrics
    .find(channel => channel.total > 5 && channel.conversionRate < 5);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Widget Performance Globale */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="icon-blue">
              <Target className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Performance Globale</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {topChannels.map((channel, index) => (
            <div key={channel.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getSourceIcon(channel.name)}</span>
                <div>
                  <p className="text-sm font-medium">{getSourceDisplayName(channel.name)}</p>
                  <p className="text-xs text-muted-foreground">{channel.total} candidats</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={channel.conversionRate > 15 ? 'default' : channel.conversionRate > 5 ? 'secondary' : 'destructive'} className="text-xs">
                  {channel.conversionRate.toFixed(1)}%
                </Badge>
                <div className="flex items-center gap-1 mt-1">
                  {channel.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-xs text-muted-foreground">{channel.placed} placés</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Widget Canal le Plus Actif */}
      {mostActiveChannel && (
        <Card className="card-modern">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="icon-green">
                <Users className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-base font-semibold">Canal le Plus Actif</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">{getSourceIcon(mostActiveChannel.name)}</div>
              <h3 className="font-semibold text-lg">{getSourceDisplayName(mostActiveChannel.name)}</h3>
              <p className="text-sm text-muted-foreground">30 derniers jours</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Nouveaux candidats</span>
                <span className="font-medium">{mostActiveChannel.recentActivity}</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Taux de qualification</span>
                  <span className="font-medium">{mostActiveChannel.qualificationRate.toFixed(1)}%</span>
                </div>
                <Progress value={mostActiveChannel.qualificationRate} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Taux de conversion</span>
                  <span className="font-medium">{mostActiveChannel.conversionRate.toFixed(1)}%</span>
                </div>
                <Progress value={mostActiveChannel.conversionRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Widget Alerte Canal */}
      {attentionChannel ? (
        <Card className="card-modern border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="icon-orange">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-base font-semibold">Canal à Optimiser</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">{getSourceIcon(attentionChannel.name)}</div>
              <h3 className="font-semibold text-lg">{getSourceDisplayName(attentionChannel.name)}</h3>
              <Badge variant="destructive" className="mt-1">
                Conversion faible: {attentionChannel.conversionRate.toFixed(1)}%
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total candidats:</span>
                <span className="font-medium">{attentionChannel.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Candidats placés:</span>
                <span className="font-medium">{attentionChannel.placed}</span>
              </div>
              <div className="flex justify-between">
                <span>Activité récente:</span>
                <span className="font-medium">{attentionChannel.recentActivity}</span>
              </div>
            </div>
            
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <p className="text-xs text-orange-700 dark:text-orange-300">
                💡 Recommandation: Revoir la stratégie de sourcing ou optimiser le processus de qualification.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Widget de synthèse si pas d'alerte
        <Card className="card-modern">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="icon-purple">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-base font-semibold">Synthèse Canaux</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{channelMetrics.length}</p>
                <p className="text-xs text-muted-foreground">Canaux actifs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {channelMetrics.reduce((sum, channel) => sum + channel.total, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total candidats</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversion moyenne:</span>
                <span className="font-medium">
                  {channelMetrics.length > 0 
                    ? (channelMetrics.reduce((sum, channel) => sum + channel.conversionRate, 0) / channelMetrics.length).toFixed(1)
                    : 0}%
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Meilleur canal:</span>
                <span className="font-medium">
                  {topChannels[0] ? getSourceDisplayName(topChannels[0].name) : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChannelPerformanceWidget;