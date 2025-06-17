
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserPlus, Clock, Award } from 'lucide-react';

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
  topCandidates,
}) => {
  const stats = [
    {
      title: "Total Candidats",
      value: totalCandidates,
      subtitle: "Profils dans la base",
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      trend: totalCandidates > 0 ? '+' : ''
    },
    {
      title: "Nouveaux (7j)",
      value: newThisWeek,
      subtitle: "Cette semaine",
      icon: UserPlus,
      color: 'from-green-500 to-emerald-500',
      trend: newThisWeek > 0 ? '+' : ''
    },
    {
      title: "En Cours",
      value: inProgress,
      subtitle: "Process actif",
      icon: Clock,
      color: 'from-orange-500 to-yellow-500',
      trend: ''
    },
    {
      title: "Excellence",
      value: topCandidates,
      subtitle: "Score IA ≥ 85%",
      icon: Award,
      color: 'from-purple-500 to-violet-500',
      trend: topCandidates > 0 ? '★' : ''
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card 
            key={stat.title} 
            className="group relative overflow-hidden bg-card/70 dark:bg-card/40 backdrop-blur-xl border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
            
            {/* Floating Icon Background */}
            <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-300`} />
            
            <CardContent className="relative p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Main Value */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </span>
                  {stat.trend && (
                    <span className="text-sm font-medium text-green-500">
                      {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
              </div>

              {/* Progress indicator */}
              <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-1000 group-hover:animate-pulse`}
                  style={{ width: `${Math.min((stat.value / Math.max(totalCandidates, 1)) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CandidateStats;
