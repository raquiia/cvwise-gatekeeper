
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Award, BookOpen, User, Target, Briefcase, RefreshCw, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ContextualScore } from '@/hooks/use-optimized-scoring';
import { getScoreEvaluation } from '@/services/scoring/candidateScoring';

interface ScoreDisplayProps {
  scoreBreakdown: ContextualScore;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ scoreBreakdown, isLoading, onRefresh }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-32 h-32 rounded-full bg-gray-200 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const evaluation = getScoreEvaluation(scoreBreakdown.overall);
  const isJobSpecific = scoreBreakdown.isJobSpecific || false;

  const scoreComponents = isJobSpecific ? [
    {
      icon: TrendingUp,
      label: 'Compétences requises',
      score: scoreBreakdown.skills,
      detail: `${scoreBreakdown.details.skillsCount} compétences évaluées`,
      color: 'text-blue-600',
      maxPoints: '25 pts'
    },
    {
      icon: Award,
      label: 'Expérience pertinente', 
      score: Math.round((scoreBreakdown.experience / 20) * 100), // Convert to percentage
      detail: `${scoreBreakdown.details.experienceYears} ans d'expérience`,
      color: 'text-green-600',
      maxPoints: '20 pts'
    },
    {
      icon: BookOpen,
      label: 'Niveau d\'études',
      score: Math.round((scoreBreakdown.education / 20) * 100), // Convert to percentage
      detail: scoreBreakdown.details.educationLevel,
      color: 'text-purple-600',
      maxPoints: '20 pts'
    },
    {
      icon: MessageSquare,
      label: 'Notes d\'entretien',
      score: 50, // Placeholder - will be calculated from interview notes
      detail: 'Évaluation qualitative',
      color: 'text-orange-600',
      maxPoints: '15 pts'
    }
  ] : [
    {
      icon: TrendingUp,
      label: 'Compétences',
      score: Math.round((scoreBreakdown.skills / 20) * 100), // Convert to percentage
      detail: `${scoreBreakdown.details.skillsCount} compétences`,
      color: 'text-blue-600',
      maxPoints: '20 pts'
    },
    {
      icon: Award,
      label: 'Expérience',
      score: Math.round((scoreBreakdown.experience / 20) * 100), // Convert to percentage
      detail: `${scoreBreakdown.details.experienceYears} ans`,
      color: 'text-green-600',
      maxPoints: '20 pts'
    },
    {
      icon: BookOpen,
      label: 'Formation',
      score: Math.round((scoreBreakdown.education / 20) * 100), // Convert to percentage
      detail: scoreBreakdown.details.educationLevel,
      color: 'text-purple-600',
      maxPoints: '20 pts'
    },
    {
      icon: User,
      label: 'Profil',
      score: Math.round((scoreBreakdown.profileCompleteness / 10) * 100), // Convert to percentage
      detail: `${scoreBreakdown.details.completenessPercentage}% complet`,
      color: 'text-orange-600',
      maxPoints: '40 pts'
    }
  ];

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header with context indicator and refresh button */}
        <div className="flex items-center justify-between mb-4">
          <Badge 
            variant={isJobSpecific ? "default" : "secondary"} 
            className={`text-xs ${isJobSpecific ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'}`}
          >
            {isJobSpecific ? <Briefcase size={12} className="mr-1" /> : <User size={12} className="mr-1" />}
            {scoreBreakdown.matchContext || (isJobSpecific ? 'Score contextuel' : 'Score général')}
          </Badge>
          
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-6 w-6 p-0"
              title="Actualiser le score"
            >
              <RefreshCw size={12} />
            </Button>
          )}
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 ${
              scoreBreakdown.overall >= 85 ? 'bg-emerald-500 border-emerald-300' : 
              scoreBreakdown.overall >= 70 ? 'bg-green-500 border-green-300' :
              scoreBreakdown.overall >= 55 ? 'bg-amber-500 border-amber-300' :
              scoreBreakdown.overall >= 40 ? 'bg-orange-500 border-orange-300' :
              'bg-red-500 border-red-300'
            }`}>
              {scoreBreakdown.overall}
              <span className="text-sm ml-1">%</span>
            </div>
            <div className="absolute -bottom-1 -right-1">
              {isJobSpecific ? (
                <Briefcase className="w-6 h-6 text-purple-600 bg-white rounded-full p-1" />
              ) : (
                <Target className="w-6 h-6 text-gray-600 bg-white rounded-full p-1" />
              )}
            </div>
          </div>
          
          <div className={`mt-4 px-3 py-1 rounded-full text-sm font-medium ${
            isJobSpecific ? 'bg-purple-100 text-purple-800' : `${evaluation.bgColor} ${evaluation.color}`
          }`}>
            {isJobSpecific ? 
              (scoreBreakdown.overall >= 70 ? 'Excellent match' : 
               scoreBreakdown.overall >= 50 ? 'Bon match' : 
               scoreBreakdown.overall >= 30 ? 'Match partiel' : 'Match faible') 
              : evaluation.label}
          </div>

          {!isJobSpecific && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Sélectionnez une offre d'emploi pour voir le score de correspondance
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {isJobSpecific ? 'Détail de la correspondance' : 'Détail du profil'}
          </h4>
          
          {scoreComponents.map((component, index) => {
            const Icon = component.icon;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={component.color} />
                    <span className="text-sm font-medium">{component.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{component.maxPoints}</span>
                    <span className="text-sm font-bold">{component.score}%</span>
                  </div>
                </div>
                <Progress 
                  value={component.score} 
                  className="h-2"
                />
                <div className="text-xs text-gray-500 pl-6">
                  {component.detail}
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="my-4" />

        <div className="text-center">
          <div className="text-xs text-gray-500">
            {isJobSpecific ? 'Score de correspondance calculé automatiquement' : 'Score de profil calculé automatiquement'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {isJobSpecific 
              ? 'Compétences 25% • Expérience 20% • Formation 20% • Localisation 10% • Autres 25%'
              : 'Compétences 20% • Expérience 20% • Formation 20% • Profil 40%'}
          </div>
          <div className="text-xs text-purple-600 mt-1 font-medium">
            ✨ Nouveau système de scoring optimisé
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreDisplay;
