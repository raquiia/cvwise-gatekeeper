
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, TrendingUp, Calendar, Target } from 'lucide-react';

interface CandidateStatsProps {
  totalCandidates: number;
  newThisWeek: number;
  inProgress: number;
  topCandidates: number;
}

const CandidateStats: React.FC<CandidateStatsProps> = ({
  totalCandidates,
  newThisWeek,
  inProgress,
  topCandidates
}) => {
  const stats = [
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
      title: "Nouveaux cette semaine",
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
      trend: "23 actifs"
    },
    {
      title: "Candidats excellents",
      value: topCandidates,
      icon: Target,
      description: "Score ≥ 85%",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "+3"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-purple-200/30 dark:border-purple-800/20 overflow-hidden shadow-sm bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-navy-dark dark:text-sand">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy-dark dark:text-sand mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {stat.description}
              </p>
              <div className="flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-600">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CandidateStats;
