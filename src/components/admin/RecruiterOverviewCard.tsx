
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, TrendingUp, Target, Users, ChevronRight } from 'lucide-react';
import { RecruiterKPI } from '@/services/analytics/recruitmentAnalyticsService';

interface RecruiterOverviewCardProps {
  recruiter: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  kpi: RecruiterKPI | null;
  onClick: () => void;
}

const RecruiterOverviewCard: React.FC<RecruiterOverviewCardProps> = ({ 
  recruiter, 
  kpi,
  onClick 
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (rate >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const globalConversion = kpi ? Math.round((kpi.candidatesInMission / (kpi.totalCVs || 1)) * 100) : 0;

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl"
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Header avec avatar et nom */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {getInitials(recruiter.name)}
            </div>
            <div>
              <h3 className="font-semibold text-navy-dark dark:text-white">
                {recruiter.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {recruiter.email}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-600 transition-colors" />
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-navy-dark dark:text-white">
              {kpi?.totalCVs || 0}
            </div>
            <div className="text-xs text-muted-foreground">CVs ce mois</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {kpi?.candidatesInMission || 0}
            </div>
            <div className="text-xs text-muted-foreground">En mission</div>
          </div>
        </div>

        {/* Pipeline rapide */}
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="text-muted-foreground">Pipeline:</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              Préqual: {kpi?.candidatesInPrequalification || 0}
            </Badge>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              EC2: {kpi?.candidatesInEC2 || 0}
            </Badge>
          </div>
        </div>

        {/* Taux de conversion global */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Taux conversion global:</span>
          <Badge className={`text-xs font-medium ${getPerformanceColor(globalConversion)}`}>
            {globalConversion}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecruiterOverviewCard;
