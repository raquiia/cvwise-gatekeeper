
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, TrendingUp, Target, Calendar } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';

interface AnalyticsKPIsProps {
  candidates: CandidateData[];
}

const AnalyticsKPIs: React.FC<AnalyticsKPIsProps> = ({ candidates }) => {
  // Calculate KPIs
  const totalCandidates = candidates.length;
  
  const newThisWeek = candidates.filter(c => {
    const createdDate = new Date(c.created_at || '');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate > weekAgo;
  }).length;
  
  const inProgress = candidates.filter(c => 
    ['contact', 'prequalification', 'ec1', 'ec2', 'presentation_client'].includes(c.detailed_status || '')
  ).length;
  
  const highScoreCandidates = candidates.filter(c => (c.score || 0) >= 80).length;
  
  const averageScore = candidates.length > 0 
    ? Math.round(candidates.reduce((sum, c) => sum + (c.score || 0), 0) / candidates.length)
    : 0;
  
  const placedCandidates = candidates.filter(c => c.detailed_status === 'en_mission').length;
  
  const placementRate = totalCandidates > 0 
    ? Math.round((placedCandidates / totalCandidates) * 100)
    : 0;

  const kpis = [
    {
      title: "Total Candidats",
      value: totalCandidates,
      icon: Users,
      description: "Dans votre base",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "+12%"
    },
    {
      title: "Nouveaux (7j)",
      value: newThisWeek,
      icon: Calendar,
      description: "Ajoutés récemment",
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "+5"
    },
    {
      title: "En cours de processus",
      value: inProgress,
      icon: Clock,
      description: "Entretiens & évaluations",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: `${Math.round((inProgress/totalCandidates)*100)}%`
    },
    {
      title: "Score moyen",
      value: averageScore,
      icon: Target,
      description: "Score global",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "pts"
    },
    {
      title: "Candidats excellents",
      value: highScoreCandidates,
      icon: UserCheck,
      description: "Score ≥ 80%",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      trend: `${Math.round((highScoreCandidates/totalCandidates)*100)}%`
    },
    {
      title: "Taux de placement",
      value: `${placementRate}%`,
      icon: TrendingUp,
      description: "En mission",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      trend: `${placedCandidates} placés`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-navy-dark dark:text-sand">
                {kpi.title}
              </CardTitle>
              <div className={`${kpi.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy-dark dark:text-sand mb-1">
                {kpi.value}
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {kpi.description}
              </p>
              <div className="text-xs text-green-600">
                {kpi.trend}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AnalyticsKPIs;
