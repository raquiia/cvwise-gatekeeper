
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Award, BookOpen, User, Target } from 'lucide-react';
import type { ScoreBreakdown } from '@/services/scoring/candidateScoring';
import { getScoreEvaluation } from '@/services/scoring/candidateScoring';

interface ScoreDisplayProps {
  scoreBreakdown: ScoreBreakdown & { matchContext?: string };
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

  const scoreComponents = [
    {
      icon: TrendingUp,
      label: 'Compétences',
      score: scoreBreakdown.skills,
      detail: `${scoreBreakdown.details.skillsCount} compétences`,
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
            </div>
            <div className="absolute -bottom-1 -right-1">
              <Target className="w-6 h-6 text-gray-600 bg-white rounded-full p-1" />
            </div>
          </div>
          
          <div className={`mt-4 px-3 py-1 rounded-full text-sm font-medium ${evaluation.bgColor} ${evaluation.color}`}>
            {evaluation.label}
          </div>

          {scoreBreakdown.matchContext && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              {scoreBreakdown.matchContext}
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Détail du scoring</h4>
          
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
            Score calculé automatiquement
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Compétences 40% • Expérience 30% • Formation 20% • Profil 10%
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreDisplay;
