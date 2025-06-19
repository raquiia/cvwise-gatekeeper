
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, Target, TrendingUp } from 'lucide-react';
import { GlobalRecruitmentStats } from '@/services/analytics/recruitmentAnalyticsService';

interface RecruitmentKPICardsProps {
  loading: boolean;
  stats: GlobalRecruitmentStats | null;
  resumesCount: number;
  candidatesCount: number;
}

const RecruitmentKPICards: React.FC<RecruitmentKPICardsProps> = ({
  loading,
  stats,
  resumesCount,
  candidatesCount
}) => {
  const kpis = [
    {
      title: "CVs Analysés",
      value: resumesCount,
      subtitle: "Documents traités par l'IA",
      icon: FileText,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: "CVs ce mois",
      value: stats?.totalCVsThisMonth || 0,
      subtitle: "Nouveaux candidats",
      icon: Target,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: "Candidats en mission",
      value: stats?.totalCandidatesInMission || 0,
      subtitle: "Placements réussis",
      icon: Users,
      color: 'from-purple-500 to-violet-500'
    },
    {
      title: "Taux conversion global",
      value: stats?.globalConversionRate || 0,
      subtitle: "Vers mission",
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse bg-white/50 dark:bg-navy-dark/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        
        return (
          <Card 
            key={kpi.title} 
            className="group relative overflow-hidden bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30 dark:border-purple-800/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
            
            {/* Floating Icon Background */}
            <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${kpi.color} opacity-10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300`} />
            
            <CardContent className="relative p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">{kpi.title}</h3>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${kpi.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Main Value */}
              <div className="space-y-2">
                <div className="text-3xl font-bold text-navy-dark dark:text-white">
                  {kpi.value}
                  {kpi.title.includes('Taux') && '%'}
                </div>
                <p className="text-sm text-muted-foreground">{kpi.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RecruitmentKPICards;
