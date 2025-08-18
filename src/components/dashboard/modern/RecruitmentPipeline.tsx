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
    if (!candidatesData || candidatesData.length === 0) {
      return [];
    }

    // Calculer les vrais nombres par statut
    const statusCounts = candidatesData.reduce((acc, candidate) => {
      const status = candidate.detailed_status || 'initial';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculer les tendances (comparaison avec les 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCounts = candidatesData
      .filter(c => new Date(c.created_at) > thirtyDaysAgo)
      .reduce((acc, candidate) => {
        const status = candidate.detailed_status || 'initial';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    // Mapping des statuts vers les étapes du pipeline
    const totalCandidates = candidatesData.length;
    const sourced = totalCandidates;
    const qualified = (statusCounts.contact || 0) + (statusCounts.prequalification || 0) + 
                     (statusCounts.ec1 || 0) + (statusCounts.ec2 || 0) + 
                     (statusCounts.presentation_client || 0) + (statusCounts.en_mission || 0);
    const interviewed = (statusCounts.ec1 || 0) + (statusCounts.ec2 || 0) + 
                       (statusCounts.presentation_client || 0) + (statusCounts.en_mission || 0);
    const finalized = (statusCounts.presentation_client || 0) + (statusCounts.en_mission || 0);
    const hired = statusCounts.en_mission || 0;

    // Calculer les tendances basées sur l'activité récente
    const calculateTrend = (current: number, recent: number): { trend: 'up' | 'down' | 'stable', trendValue: number } => {
      if (current === 0) return { trend: 'stable', trendValue: 0 };
      const recentRate = (recent / current) * 100;
      if (recentRate > 25) return { trend: 'up', trendValue: Math.round(recentRate - 25) };
      if (recentRate < 15) return { trend: 'down', trendValue: Math.round(15 - recentRate) };
      return { trend: 'stable', trendValue: 0 };
    };

    const qualifiedRecent = (recentCounts.contact || 0) + (recentCounts.prequalification || 0) + 
                           (recentCounts.ec1 || 0) + (recentCounts.ec2 || 0) + 
                           (recentCounts.presentation_client || 0) + (recentCounts.en_mission || 0);

    const stages: PipelineStage[] = [
      {
        id: 'sourced',
        name: 'Sourcés',
        count: sourced,
        percentage: 100,
        icon: <Users className="h-5 w-5" />,
        color: 'bg-blue-500',
        ...calculateTrend(sourced, recentCounts.initial || 0)
      },
      {
        id: 'qualified',
        name: 'Qualifiés',
        count: qualified,
        percentage: sourced > 0 ? Math.round((qualified / sourced) * 100) : 0,
        icon: <UserCheck className="h-5 w-5" />,
        color: 'bg-green-500',
        ...calculateTrend(qualified, qualifiedRecent)
      },
      {
        id: 'interviewed',
        name: 'Entretiens',
        count: interviewed,
        percentage: sourced > 0 ? Math.round((interviewed / sourced) * 100) : 0,
        icon: <Phone className="h-5 w-5" />,
        color: 'bg-yellow-500',
        ...calculateTrend(interviewed, (recentCounts.ec1 || 0) + (recentCounts.ec2 || 0) + (recentCounts.presentation_client || 0))
      },
      {
        id: 'final',
        name: 'Finalisés',
        count: finalized,
        percentage: sourced > 0 ? Math.round((finalized / sourced) * 100) : 0,
        icon: <Briefcase className="h-5 w-5" />,
        color: 'bg-orange-500',
        ...calculateTrend(finalized, (recentCounts.presentation_client || 0) + (recentCounts.en_mission || 0))
      },
      {
        id: 'hired',
        name: 'Embauchés',
        count: hired,
        percentage: sourced > 0 ? Math.round((hired / sourced) * 100) : 0,
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'bg-emerald-500',
        ...calculateTrend(hired, recentCounts.en_mission || 0)
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

        {/* Métriques calculées */}
        <div className="pt-4 border-t space-y-3">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Métriques cette semaine
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nouveaux candidats:</span>
              <span className="font-medium">+{(() => {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return candidatesData.filter(c => new Date(c.created_at) > sevenDaysAgo).length;
              })()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entretiens prévus:</span>
              <span className="font-medium">{candidatesData.filter(c => ['ec1', 'ec2'].includes(c.detailed_status)).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">En présentation:</span>
              <span className="font-medium">{candidatesData.filter(c => c.detailed_status === 'presentation_client').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taux conversion:</span>
              <span className="font-medium">{conversionRate}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};