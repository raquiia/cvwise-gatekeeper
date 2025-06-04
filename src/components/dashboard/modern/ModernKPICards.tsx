
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, FileText, Target, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KPIData {
  title: string;
  value: number;
  subtitle: string;
  trend: {
    value: number;
    direction: 'up' | 'down';
    period: string;
  };
  icon: React.ElementType;
  color: string;
  sparklineData?: number[];
}

interface ModernKPICardsProps {
  loading: boolean;
  resumesCount: number;
  candidatesCount: number;
  topCandidatesCount: number;
  usersCount: number;
}

const ModernKPICards: React.FC<ModernKPICardsProps> = ({
  loading,
  resumesCount,
  candidatesCount,
  topCandidatesCount,
  usersCount
}) => {
  const kpis: KPIData[] = [
    {
      title: "CVs Analysés",
      value: resumesCount,
      subtitle: "Documents traités par l'IA",
      trend: { value: 12, direction: 'up', period: 'cette semaine' },
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      sparklineData: [10, 15, 12, 18, 25, 22, 30]
    },
    {
      title: "Candidats Actifs",
      value: candidatesCount,
      subtitle: "Profils dans la base",
      trend: { value: 8, direction: 'up', period: 'ce mois' },
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      sparklineData: [20, 22, 19, 25, 28, 26, 32]
    },
    {
      title: "Candidats Excellence",
      value: topCandidatesCount,
      subtitle: "Score IA ≥ 85%",
      trend: { value: 15, direction: 'up', period: 'cette semaine' },
      icon: Target,
      color: 'from-purple-500 to-violet-500',
      sparklineData: [5, 7, 6, 9, 12, 11, 15]
    },
    {
      title: "Matching IA",
      value: Math.round((topCandidatesCount / candidatesCount) * 100) || 0,
      subtitle: "Taux de correspondance",
      trend: { value: 5, direction: 'up', period: 'ce mois' },
      icon: Zap,
      color: 'from-orange-500 to-red-500',
      sparklineData: [45, 48, 52, 49, 55, 53, 58]
    }
  ];

  const MiniSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    return (
      <div className="flex items-end gap-0.5 h-8 opacity-40">
        {data.map((value, index) => {
          const height = range > 0 ? ((value - min) / range) * 100 : 50;
          return (
            <div
              key={index}
              className={`w-1 bg-gradient-to-t ${color} rounded-full transition-all duration-300`}
              style={{ height: `${Math.max(height, 10)}%` }}
            />
          );
        })}
      </div>
    );
  };

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
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
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
        const TrendIcon = kpi.trend.direction === 'up' ? ArrowUp : ArrowDown;
        
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
              <div className="space-y-2 mb-4">
                <div className="text-3xl font-bold text-navy-dark dark:text-white">
                  {kpi.value}
                  {kpi.title.includes('Matching') && '%'}
                </div>
                <p className="text-sm text-muted-foreground">{kpi.subtitle}</p>
              </div>

              {/* Trend & Sparkline */}
              <div className="flex items-center justify-between">
                <Badge 
                  className={`${
                    kpi.trend.direction === 'up' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  } border-0 gap-1`}
                >
                  <TrendIcon className="w-3 h-3" />
                  +{kpi.trend.value}% {kpi.trend.period}
                </Badge>
                
                {kpi.sparklineData && (
                  <MiniSparkline data={kpi.sparklineData} color={kpi.color} />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ModernKPICards;
