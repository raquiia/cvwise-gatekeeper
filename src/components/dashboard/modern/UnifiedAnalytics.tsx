import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip, Legend } from 'recharts';
import { Users, TrendingUp, Star, Clock, Eye, BarChart3, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UnifiedAnalyticsProps {
  candidatesData: any[];
  educationData: any[];
  sectorData: any[];
}

const UnifiedAnalytics: React.FC<UnifiedAnalyticsProps> = ({
  candidatesData,
  educationData,
  sectorData
}) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed'>('overview');

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  // Métriques d'activité récente
  const getRecentActivity = () => {
    const today = new Date();
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recent7 = candidatesData.filter(c => {
      const candidateDate = new Date(c.created_at);
      return candidateDate.getTime() >= last7Days.getTime();
    }).length;
    
    const recent30 = candidatesData.filter(c => {
      const candidateDate = new Date(c.created_at);
      return candidateDate.getTime() >= last30Days.getTime();
    }).length;

    return { recent7, recent30 };
  };

  // Évolution temporelle
  const getActivityData = () => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const activityByWeek = candidatesData.reduce((acc, candidate) => {
      const date = new Date(candidate.created_at);
      if (date.getTime() >= last30Days.getTime()) {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        acc[weekKey] = (acc[weekKey] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(activityByWeek)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        candidats: count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-4);
  };

  // Répartition par statut
  const getStatusData = () => {
    const statusMap = candidatesData.reduce((acc, candidate) => {
      const status = candidate.detailed_status || 'initial';
      
      const statusLabels = {
        'initial': 'Initial',
        'contact': 'Contact',
        'prequalification': 'Préqualification', 
        'ec1': 'Entretien 1',
        'ec2': 'Entretien 2',
        'presentation_client': 'Présentation client',
        'en_mission': 'En mission',
        'refus': 'Refusé'
      };
      
      const label = statusLabels[status] || status || 'Initial';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number));
  };

  // Répartition par expérience
  const getExperienceData = () => {
    const experienceRanges = {
      '0-2 ans': 0,
      '3-5 ans': 0,
      '6-10 ans': 0,
      '11-15 ans': 0,
      '15+ ans': 0,
      'Non spécifié': 0
    };

    candidatesData.forEach(candidate => {
      const exp = candidate.years_experience;
      if (!exp || exp === 0) {
        experienceRanges['Non spécifié']++;
      } else if (exp <= 2) {
        experienceRanges['0-2 ans']++;
      } else if (exp <= 5) {
        experienceRanges['3-5 ans']++;
      } else if (exp <= 10) {
        experienceRanges['6-10 ans']++;
      } else if (exp <= 15) {
        experienceRanges['11-15 ans']++;
      } else {
        experienceRanges['15+ ans']++;
      }
    });

    return Object.entries(experienceRanges)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  };

  // Top des compétences
  const getTopSkills = () => {
    const skillsMap = {};
    candidatesData.forEach(candidate => {
      if (candidate.skills && Array.isArray(candidate.skills)) {
        candidate.skills.forEach(skill => {
          const skillName = typeof skill === 'string' ? skill : skill.name || skill;
          if (skillName) {
            skillsMap[skillName] = (skillsMap[skillName] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(skillsMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 8);
  };

  const recentActivity = getRecentActivity();
  const activityData = getActivityData();
  const statusData = getStatusData();
  const experienceData = getExperienceData();
  const topSkills = getTopSkills();
  const avgScore = candidatesData.length > 0 
    ? Math.round(candidatesData.reduce((sum, c) => sum + (c.score || 0), 0) / candidatesData.length)
    : 0;

  if (candidatesData.length === 0) {
    return (
      <Card className="card-modern">
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune donnée de candidat disponible pour afficher les analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-modern">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-blue">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Analytics des Candidats</CardTitle>
              <p className="text-sm text-muted-foreground">Analyse détaillée de votre base de candidats</p>
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
              variant={selectedView === 'detailed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('detailed')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Détaillé
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as any)}>
          
          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            
            {/* Métriques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="icon-green">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">7 derniers jours</p>
                    <p className="text-2xl font-bold">{recentActivity.recent7}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="icon-blue">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">30 derniers jours</p>
                    <p className="text-2xl font-bold">{recentActivity.recent30}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="icon-purple">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Score moyen</p>
                    <p className="text-2xl font-bold">{avgScore}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="icon-gold">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total candidats</p>
                    <p className="text-2xl font-bold">{candidatesData.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Graphiques principaux */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Évolution temporelle */}
              {activityData.length > 0 && (
                <Card className="p-4">
                  <CardTitle className="text-lg mb-4">Nouveaux candidats (4 semaines)</CardTitle>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="candidats" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Répartition par statut */}
              <Card className="p-4">
                <CardTitle className="text-lg mb-4">Répartition par Statut</CardTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* Vue détaillée */}
          <TabsContent value="detailed" className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Secteurs (provenant d'AdvancedAnalytics) */}
              {sectorData.length > 0 && (
                <Card className="p-4">
                  <CardTitle className="text-lg mb-4">Répartition par Secteur</CardTitle>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Éducation (provenant d'AdvancedAnalytics) */}
              {educationData.length > 0 && (
                <Card className="p-4">
                  <CardTitle className="text-lg mb-4">Niveaux d'Éducation</CardTitle>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={educationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Expérience */}
              {experienceData.length > 0 && (
                <Card className="p-4">
                  <CardTitle className="text-lg mb-4">Répartition par Expérience</CardTitle>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={experienceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Top compétences */}
              {topSkills.length > 0 && (
                <Card className="p-4">
                  <CardTitle className="text-lg mb-4">Top 8 Compétences</CardTitle>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topSkills} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--foreground))" />
                      <YAxis dataKey="name" type="category" width={80} stroke="hsl(var(--foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UnifiedAnalytics;