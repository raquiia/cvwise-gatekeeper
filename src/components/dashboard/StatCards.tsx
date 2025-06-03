
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, TrendingUp, UserCheck } from 'lucide-react';

interface StatCardsProps {
  loading: boolean;
  resumesCount: number;
  candidatesCount: number;
  topCandidatesCount: number;
  usersCount: number;
}

const StatCards: React.FC<StatCardsProps> = ({
  loading,
  resumesCount,
  candidatesCount,
  topCandidatesCount,
  usersCount
}) => {
  const stats = [
    {
      title: "CVs analysés",
      value: resumesCount,
      icon: FileText,
      description: "Documents traités",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Candidats",
      value: candidatesCount,
      icon: Users,
      description: "Profils dans la base",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Candidats excellents",
      value: topCandidatesCount,
      icon: TrendingUp,
      description: "Score ≥ 85%",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Utilisateurs actifs",
      value: usersCount,
      icon: UserCheck,
      description: "Comptes créés",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-purple-200/30 dark:border-purple-800/20 overflow-hidden shadow-xl bg-white/50 dark:bg-navy-dark/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-navy-dark dark:text-sand">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy-dark dark:text-sand">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatCards;
