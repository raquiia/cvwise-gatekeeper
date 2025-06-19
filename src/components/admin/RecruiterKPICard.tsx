
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, TrendingUp, Target, Users, Award } from 'lucide-react';
import { RecruiterKPI } from '@/services/analytics/recruitmentAnalyticsService';

interface RecruiterKPICardProps {
  kpi: RecruiterKPI;
}

const RecruiterKPICard: React.FC<RecruiterKPICardProps> = ({ kpi }) => {
  const getConversionColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600 bg-green-50';
    if (rate >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'current_month': return 'Ce mois';
      case 'last_month': return 'Mois dernier';
      case 'quarter': return 'Ce trimestre';
      default: return 'Période';
    }
  };

  return (
    <Card className="border-purple-200/30 dark:border-purple-800/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <User className="w-4 h-4 text-white" />
            </div>
            {kpi.recruiterName}
          </CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {getPeriodLabel(kpi.period)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Métriques principales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-navy-dark dark:text-white">
              {kpi.totalCVs}
            </div>
            <div className="text-sm text-muted-foreground">CVs ajoutés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {kpi.candidatesInMission}
            </div>
            <div className="text-sm text-muted-foreground">En mission</div>
          </div>
        </div>

        {/* Pipeline de candidats */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-navy-dark dark:text-white">Pipeline</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Préqualification:</span>
              <span className="font-medium">{kpi.candidatesInPrequalification}</span>
            </div>
            <div className="flex justify-between">
              <span>EC1:</span>
              <span className="font-medium">{kpi.candidatesInEC1}</span>
            </div>
            <div className="flex justify-between">
              <span>EC2:</span>
              <span className="font-medium">{kpi.candidatesInEC2}</span>
            </div>
            <div className="flex justify-between">
              <span>Présentation:</span>
              <span className="font-medium">{kpi.candidatesInPresentation}</span>
            </div>
          </div>
        </div>

        {/* Taux de conversion */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-navy-dark dark:text-white">Taux de conversion</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs">Préqual → EC1:</span>
              <Badge className={`text-xs ${getConversionColor(kpi.conversionPrequalToEC1)}`}>
                {kpi.conversionPrequalToEC1}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">EC1 → EC2:</span>
              <Badge className={`text-xs ${getConversionColor(kpi.conversionEC1ToEC2)}`}>
                {kpi.conversionEC1ToEC2}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">EC2 → Présentation:</span>
              <Badge className={`text-xs ${getConversionColor(kpi.conversionEC2ToPresentation)}`}>
                {kpi.conversionEC2ToPresentation}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">EC2 → Mission:</span>
              <Badge className={`text-xs ${getConversionColor(kpi.conversionEC2ToMission)}`}>
                {kpi.conversionEC2ToMission}%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecruiterKPICard;
