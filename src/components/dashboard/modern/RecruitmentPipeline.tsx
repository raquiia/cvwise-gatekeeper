import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  UserCheck, 
  Phone, 
  Briefcase, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from "lucide-react";

interface PipelineStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface RecruitmentPipelineProps {
  candidatesData?: any[];
}

export const RecruitmentPipeline: React.FC<RecruitmentPipelineProps> = ({ 
  candidatesData = [] 
}) => {
  const pipelineData = useMemo(() => {
    // Données mockées réalistes pour le pipeline
    const stages: PipelineStage[] = [
      {
        id: 'sourced',
        name: 'Sourcés',
        count: 156,
        percentage: 100,
        icon: <Users className="h-5 w-5" />,
        color: 'bg-blue-500',
        trend: 'up',
        trendValue: 12
      },
      {
        id: 'qualified',
        name: 'Qualifiés',
        count: 89,
        percentage: 57,
        icon: <UserCheck className="h-5 w-5" />,
        color: 'bg-green-500',
        trend: 'up',
        trendValue: 8
      },
      {
        id: 'interviewed',
        name: 'Entretiens',
        count: 34,
        percentage: 22,
        icon: <Phone className="h-5 w-5" />,
        color: 'bg-yellow-500',
        trend: 'stable',
        trendValue: 0
      },
      {
        id: 'final',
        name: 'Finalisés',
        count: 12,
        percentage: 8,
        icon: <Briefcase className="h-5 w-5" />,
        color: 'bg-orange-500',
        trend: 'down',
        trendValue: -3
      },
      {
        id: 'hired',
        name: 'Embauchés',
        count: 7,
        percentage: 4,
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'bg-emerald-500',
        trend: 'up',
        trendValue: 5
      }
    ];

    return stages;
  }, [candidatesData]);

  const totalCandidates = pipelineData[0]?.count || 0;
  const conversionRate = totalCandidates > 0 ? Math.round((pipelineData[pipelineData.length - 1]?.count / totalCandidates) * 100) : 0;

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <div className="h-3 w-3" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Pipeline de recrutement
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Taux global: {conversionRate}%
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Vue d'ensemble */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalCandidates}</div>
            <div className="text-sm text-muted-foreground">Candidats actifs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{conversionRate}%</div>
            <div className="text-sm text-muted-foreground">Taux conversion</div>
          </div>
        </div>

        {/* Pipeline visuel */}
        <div className="space-y-4">
          {pipelineData.map((stage, index) => (
            <div key={stage.id} className="space-y-2">
              {/* En-tête de l'étape */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stage.color} text-white`}>
                    {stage.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{stage.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {stage.count} candidats ({stage.percentage}%)
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getTrendIcon(stage.trend)}
                  <span className={`text-xs font-medium ${getTrendColor(stage.trend)}`}>
                    {stage.trend !== 'stable' && (stage.trendValue > 0 ? '+' : '')}{stage.trendValue}%
                  </span>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="pl-11">
                <Progress 
                  value={stage.percentage} 
                  className="h-2 bg-muted"
                />
              </div>

              {/* Flèche de transition */}
              {index < pipelineData.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Métriques clés */}
        <div className="pt-4 border-t space-y-3">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Métriques cette semaine
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nouveaux candidats:</span>
              <span className="font-medium">+23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entretiens planifiés:</span>
              <span className="font-medium">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Offres envoyées:</span>
              <span className="font-medium">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temps moyen:</span>
              <span className="font-medium">12j</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};