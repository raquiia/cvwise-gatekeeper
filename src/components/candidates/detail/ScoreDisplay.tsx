
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Award, BookOpen, User, Target, Briefcase } from 'lucide-react';
import type { ScoreBreakdown } from '@/services/scoring/candidateScoring';
import { getScoreEvaluation } from '@/services/scoring/candidateScoring';

interface ScoreDisplayProps {
  scoreBreakdown: ScoreBreakdown & { 
    matchContext?: string;
    isJobSpecific?: boolean;
    jobOfferTitle?: string;
  };
  isLoading?: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ scoreBreakdown, isLoading }) => {
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

  const scoreComponents = [
    {
      icon: TrendingUp,
      label: isJobSpecific ? 'Compétences matchées' : 'Compétences',
      score: scoreBreakdown.skills,
      detail: isJobSpecific 
        ? `${scoreBreakdown.details.skillsCount} compétences matchées`
        : `${scoreBreakdown.details.skillsCount} compétences`,
      color: 'text-blue-600'
    },
    {
      icon: Award,
      label: 'Expérience',
      score: scoreBreakdown.experience,
      detail: `${scoreBreakdown.details.experienceYears} ans`,
      color: 'text-green-600'
    },
    {
      icon: BookOpen,
      label: 'Formation',
      score: scoreBreakdown.education,
      detail: scoreBreakdown.details.educationLevel,
      color: 'text-purple-600'
    },
    {
      icon: User,
      label: 'Profil',
      score: scoreBreakdown.profileCompleteness,
      detail: `${scoreBreakdown.details.completenessPercentage}% complet`,
      color: 'text-orange-600'
    }
  ];

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header with context indicator */}
        <div className="flex items-center justify-center mb-4">
          <Badge 
            variant={isJobSpecific ? "default" : "secondary"} 
            className={`text-xs ${isJobSpecific ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'}`}
          >
            {isJobSpecific ? <Briefcase size={12} className="mr-1" /> : <User size={12} className="mr-1" />}
            {scoreBreakdown.matchContext || (isJobSpecific ? 'Score contextuel' : 'Score général')}
          </Badge>
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
              {isJobSpecific ? scoreBreakdown.overall : scoreBreakdown.details.completenessPercentage}
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
              (scoreBreakdown.overall >= 70 ? 'Bon match' : 
               scoreBreakdown.overall >= 50 ? 'Match partiel' : 'Faible match') 
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
              ? 'Compétences 50% • Expérience 25% • Formation 15% • Profil 10%'
              : 'Compétences 40% • Expérience 30% • Formation 20% • Profil 10%'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreDisplay;
