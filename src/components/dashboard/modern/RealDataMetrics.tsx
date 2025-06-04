

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip, Legend } from 'recharts';
import { Users, MapPin, Star, Clock, TrendingUp, Globe } from 'lucide-react';

interface RealDataMetricsProps {
  candidatesData: any[];
}

const RealDataMetrics: React.FC<RealDataMetricsProps> = ({ candidatesData }) => {
  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Helper function to extract correct status (same logic as Candidates page)
  const extractCandidateStatus = (candidate: any): string => {
    let statusValue = 'initial';
    
    try {
      if (candidate.detailed_status && 
          candidate.detailed_status !== '' && 
          candidate.detailed_status !== 'undefined' && 
          candidate.detailed_status !== 'null') {
        
        if (typeof candidate.detailed_status === 'string') {
          const trimmedStatus = candidate.detailed_status.trim();
          if (trimmedStatus !== '' && trimmedStatus !== 'undefined' && trimmedStatus !== 'null') {
            return trimmedStatus;
          }
        }
        
        if (typeof candidate.detailed_status === 'object' && candidate.detailed_status !== null) {
          const statusObj = candidate.detailed_status as Record<string, any>;
          
          if ('value' in statusObj && statusObj.value !== undefined) {
            const extractedValue = String(statusObj.value).trim();
            if (extractedValue !== '' && extractedValue !== 'undefined' && extractedValue !== 'null') {
              return extractedValue;
            }
          }
          
          if ('status' in statusObj && statusObj.status !== undefined) {
            const extractedValue = String(statusObj.status).trim();
            if (extractedValue !== '' && extractedValue !== 'undefined' && extractedValue !== 'null') {
              return extractedValue;
            }
          }
        }
      }
    } catch (err) {
      console.error("Error extracting candidate status:", err);
    }
    
    return statusValue;
  };

  // Calcul des métriques temporelles
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
      .slice(-4); // 4 dernières semaines
  };

  // Répartition par statut - IMPROVED with correct status extraction
  const getStatusData = () => {
    const statusMap = candidatesData.reduce((acc, candidate) => {
      // Use the same extraction logic as the Candidates page
      const status = extractCandidateStatus(candidate);
      
      console.log('Dashboard - Candidate status extracted:', { 
        id: candidate.id, 
        detailed_status: candidate.detailed_status, 
        status: candidate.status,
        extracted_status: status 
      });
      
      const statusLabels = {
        'initial': 'Initial',
        'contact': 'Contact',
        'prequalification': 'Pré-qualification', 
        'ec1': 'Entretien 1',
        'ec2': 'Entretien 2',
        'presentation_client': 'Présentation client',
        'en_mission': 'En mission',
        'refus': 'Refusé',
        'ancien_employe': 'Ancien employé',
        'pending': 'En attente',
        'active': 'Actif',
        'archived': 'Archivé'
      };
      
      const label = statusLabels[status] || status || 'Non défini';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    console.log('Dashboard - Status distribution:', statusMap);

    return Object.entries(statusMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number));
  };

  // Répartition par années d'expérience
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
      .slice(0, 10);
  };

  // Complétude des profils
  const getCompletenessStats = () => {
    const ranges = {
      '0-20%': 0,
      '21-40%': 0,
      '41-60%': 0,
      '61-80%': 0,
      '81-100%': 0
    };

    candidatesData.forEach(candidate => {
      const completeness = candidate.profile_completeness || 0;
      if (completeness <= 20) ranges['0-20%']++;
      else if (completeness <= 40) ranges['21-40%']++;
      else if (completeness <= 60) ranges['41-60%']++;
      else if (completeness <= 80) ranges['61-80%']++;
      else ranges['81-100%']++;
    });

    return Object.entries(ranges)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  };

  // Métriques d'activité récente - FIXED
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

  const activityData = getActivityData();
  const statusData = getStatusData();
  const experienceData = getExperienceData();
  const topSkills = getTopSkills();
  const completenessData = getCompletenessStats();
  const recentActivity = getRecentActivity();

  if (candidatesData.length === 0) {
    return (
      <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune donnée de candidat disponible pour afficher les métriques</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques d'activité récente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">7 derniers jours</p>
                <p className="text-2xl font-bold">{recentActivity.recent7}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">30 derniers jours</p>
                <p className="text-2xl font-bold">{recentActivity.recent30}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score moyen</p>
                <p className="text-2xl font-bold">
                  {Math.round(candidatesData.reduce((sum, c) => sum + (c.score || 0), 0) / candidatesData.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution de l'activité */}
        {activityData.length > 0 && (
          <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
            <CardHeader>
              <CardTitle className="text-lg">Nouveaux candidats (4 dernières semaines)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="candidats" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Répartition par statut */}
        {statusData.length > 0 && (
          <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
            <CardHeader>
              <CardTitle className="text-lg">Répartition par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Années d'expérience */}
        {experienceData.length > 0 && (
          <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
            <CardHeader>
              <CardTitle className="text-lg">Répartition par Expérience</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={experienceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top compétences */}
        {topSkills.length > 0 && (
          <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
            <CardHeader>
              <CardTitle className="text-lg">Top 10 Compétences</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topSkills} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Complétude des profils */}
      {completenessData.length > 0 && (
        <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
          <CardHeader>
            <CardTitle className="text-lg">Complétude des Profils</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={completenessData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealDataMetrics;
