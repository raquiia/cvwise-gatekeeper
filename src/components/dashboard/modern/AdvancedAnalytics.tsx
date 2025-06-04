
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Calendar, Filter, Download, TrendingUp, Users, Clock, Target } from 'lucide-react';

interface AdvancedAnalyticsProps {
  candidatesData: any[];
  educationData: any[];
  sectorData: any[];
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  candidatesData,
  educationData,
  sectorData
}) => {
  const [timeFilter, setTimeFilter] = useState('7d');
  
  // Générer des données de tendance temporelle simulées
  const generateTrendData = () => {
    const days = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        candidats: Math.floor(Math.random() * 10) + candidatesData.length / days,
        cvs: Math.floor(Math.random() * 15) + 5,
        matches: Math.floor(Math.random() * 5) + 2
      };
    });
  };

  const trendData = generateTrendData();
  
  // Données de performance par heure
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}h`,
    activite: Math.floor(Math.random() * 100) + (i >= 8 && i <= 18 ? 50 : 10)
  }));

  // Données de funnel de conversion
  const funnelData = [
    { stage: 'CVs reçus', value: candidatesData.length + 47, color: '#8884d8' },
    { stage: 'Analysés', value: candidatesData.length + 23, color: '#82ca9d' },
    { stage: 'Qualifiés', value: candidatesData.length, color: '#ffc658' },
    { stage: 'Excellents', value: Math.floor(candidatesData.length * 0.3), color: '#ff7300' }
  ];

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30 dark:border-purple-800/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              Analytics Avancées
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {['7d', '30d', '90d'].map((period) => (
                  <Button
                    key={period}
                    size="sm"
                    variant={timeFilter === period ? 'default' : 'ghost'}
                    onClick={() => setTimeFilter(period)}
                    className={timeFilter === period ? 'bg-purple-600 text-white' : ''}
                  >
                    {period}
                  </Button>
                ))}
              </div>
              <Button size="sm" variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/50 dark:bg-navy-dark/50 backdrop-blur-sm">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictions">Prédictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Secteurs Chart */}
            <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
              <CardHeader>
                <CardTitle className="text-lg">Répartition par Secteur</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Funnel de Conversion */}
            <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
              <CardHeader>
                <CardTitle className="text-lg">Funnel de Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelData.map((stage, index) => {
                    const percentage = index === 0 ? 100 : (stage.value / funnelData[0].value) * 100;
                    return (
                      <div key={stage.stage} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{stage.stage}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{stage.value}</span>
                            <Badge variant="outline">{percentage.toFixed(0)}%</Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: stage.color 
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Éducation Chart */}
          <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
            <CardHeader>
              <CardTitle className="text-lg">Niveaux d'Éducation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={educationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tendances temporelles */}
            <Card className="lg:col-span-2 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
              <CardHeader>
                <CardTitle className="text-lg">Évolution dans le Temps</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Area type="monotone" dataKey="candidats" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="cvs" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="matches" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activité par heure */}
            <Card className="lg:col-span-2 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
              <CardHeader>
                <CardTitle className="text-lg">Activité par Heure</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Bar dataKey="activite" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
            <CardHeader>
              <CardTitle className="text-lg">Métriques de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">2.3min</div>
                  <div className="text-sm text-muted-foreground">Temps moyen de traitement</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">94.7%</div>
                  <div className="text-sm text-muted-foreground">Précision de l'IA</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">87%</div>
                  <div className="text-sm text-muted-foreground">Satisfaction utilisateur</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
            <CardHeader>
              <CardTitle className="text-lg">Prédictions IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl">
                  <h4 className="font-semibold mb-2">Prochains 30 jours</h4>
                  <p className="text-sm text-muted-foreground">
                    L'IA prédit une augmentation de 23% des candidatures dans le secteur IT, 
                    avec un pic attendu autour du 15 du mois.
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <h4 className="font-semibold mb-2">Opportunités détectées</h4>
                  <p className="text-sm text-muted-foreground">
                    5 candidats avec un score > 90% pourraient être disponibles pour un nouveau poste. 
                    Recommandation : les contacter dans les 48h.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;
