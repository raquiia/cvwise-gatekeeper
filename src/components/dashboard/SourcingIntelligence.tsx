import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, Target, DollarSign, Eye, BarChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface SourcingIntelligenceProps {
  candidatesData: any[];
}

const SourcingIntelligence: React.FC<SourcingIntelligenceProps> = ({ candidatesData }) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'performance' | 'roi'>('overview');

  // Calculer les données de sourcing
  const sourcingData = useMemo(() => {
    const sources = candidatesData.reduce((acc, candidate) => {
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
        };
      }
      
      acc[source].total++;
      acc[source][candidate.detailed_status || 'initial']++;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(sources).map((source: any) => ({
      ...source,
      conversionRate: source.total > 0 ? Math.round((source.en_mission / source.total) * 100) : 0,
      qualificationRate: source.total > 0 ? Math.round(((source.ec1 + source.ec2 + source.presentation_client + source.en_mission) / source.total) * 100) : 0,
      // ROI simulé basé sur les conversions
      estimatedROI: source.en_mission * 5000 - (source.total * 50), // 5k€ par placement, 50€ par candidat
    }));
  }, [candidatesData]);

  // Top des canaux performants
  const topChannels = useMemo(() => {
    return sourcingData
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5);
  }, [sourcingData]);

  // Alertes intelligentes
  const alerts = useMemo(() => {
    const channelAlerts = [];
    
    sourcingData.forEach(source => {
      if (source.conversionRate < 5 && source.total > 10) {
        channelAlerts.push({
          type: 'warning',
          message: `${source.name}: Taux de conversion faible (${source.conversionRate}%)`,
          action: 'Revoir la stratégie de sourcing'
        });
      }
      
      if (source.estimatedROI < 0 && source.total > 5) {
        channelAlerts.push({
          type: 'danger',
          message: `${source.name}: ROI négatif (${source.estimatedROI}€)`,
          action: 'Optimiser ou arrêter ce canal'
        });
      }
    });

    return channelAlerts;
  }, [sourcingData]);

  // Données pour les graphiques
  const barChartData = sourcingData.map(source => ({
    name: source.name,
    total: source.total,
    qualified: source.ec1 + source.ec2 + source.presentation_client + source.en_mission,
    placed: source.en_mission
  }));

  const pieChartData = sourcingData.map(source => ({
    name: source.name,
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
              <CardTitle className="text-xl font-semibold">Intelligence de Sourcing</CardTitle>
              <p className="text-sm text-muted-foreground">Performance et ROI par canal d'acquisition</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={selectedView === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('overview')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Vue d'ensemble
            </Button>
            <Button
              variant={selectedView === 'performance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('performance')}
            >
              <BarChart className="h-4 w-4 mr-1" />
              Performance
            </Button>
            <Button
              variant={selectedView === 'roi' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('roi')}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              ROI
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
                className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'warning' 
                    ? 'bg-orange-50 border-orange-400 dark:bg-orange-950/20' 
                    : 'bg-red-50 border-red-400 dark:bg-red-950/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                    alert.type === 'warning' ? 'text-orange-500' : 'text-red-500'
                  }`} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top des canaux */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Top Canaux Performants
                </h3>
                
                <div className="space-y-3">
                  {topChannels.map((channel, index) => (
                    <div key={channel.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`}
                             style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{channel.name}</p>
                          <p className="text-xs text-muted-foreground">{channel.total} candidats</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant={channel.conversionRate > 15 ? 'default' : channel.conversionRate > 5 ? 'secondary' : 'destructive'}>
                          {channel.conversionRate}% conversion
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {channel.en_mission} placements
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Répartition par source */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Répartition par Source</h3>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
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
              </div>
            </div>
          </TabsContent>

          {/* Performance détaillée */}
          <TabsContent value="performance" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Performance par Canal</h3>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--foreground))"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--foreground))"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
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

              {/* Tableau détaillé */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2">Canal</th>
                      <th className="text-right p-2">Total</th>
                      <th className="text-right p-2">Qualifiés</th>
                      <th className="text-right p-2">En mission</th>
                      <th className="text-right p-2">Taux conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourcingData.map((source, index) => (
                      <tr key={source.name} className="border-b border-border/50">
                        <td className="p-2 font-medium capitalize">{source.name}</td>
                        <td className="text-right p-2">{source.total}</td>
                        <td className="text-right p-2">{source.ec1 + source.ec2 + source.presentation_client + source.en_mission}</td>
                        <td className="text-right p-2">{source.en_mission}</td>
                        <td className="text-right p-2">
                          <Badge variant={source.conversionRate > 15 ? 'default' : source.conversionRate > 5 ? 'secondary' : 'destructive'}>
                            {source.conversionRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ROI Analysis */}
          <TabsContent value="roi" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sourcingData.map((source, index) => (
                <Card key={source.name} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize">{source.name}</h4>
                      <Badge variant={source.estimatedROI > 0 ? 'default' : 'destructive'}>
                        {source.estimatedROI > 0 ? '+' : ''}{source.estimatedROI.toLocaleString()}€
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenus estimés:</span>
                        <span className="font-medium">{(source.en_mission * 5000).toLocaleString()}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coûts estimés:</span>
                        <span className="font-medium">{(source.total * 50).toLocaleString()}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Placements:</span>
                        <span className="font-medium">{source.en_mission}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SourcingIntelligence;