
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  User, 
  Target, 
  Briefcase, 
  CheckCircle, 
  XCircle,
  Clock,
  GraduationCap
} from 'lucide-react';
import type { ImprovedScoreBreakdown } from '@/services/scoring/improvedScoringService';
import { cn } from '@/lib/utils';

interface ScoreBreakdownCardProps {
  scoreBreakdown: ImprovedScoreBreakdown;
  isLoading?: boolean;
}

const ScoreBreakdownCard: React.FC<ScoreBreakdownCardProps> = ({ 
  scoreBreakdown, 
  isLoading 
}) => {
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

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500 border-emerald-300 text-white';
    if (score >= 70) return 'bg-green-500 border-green-300 text-white';
    if (score >= 55) return 'bg-amber-500 border-amber-300 text-white';
    if (score >= 40) return 'bg-orange-500 border-orange-300 text-white';
    return 'bg-red-500 border-red-300 text-white';
  };

  const getScoreLabel = (score: number, isJobSpecific: boolean) => {
    if (isJobSpecific) {
      if (score >= 85) return 'Excellent match';
      if (score >= 70) return 'Très bon match';
      if (score >= 55) return 'Bon match';
      if (score >= 40) return 'Match partiel';
      return 'Faible match';
    } else {
      if (score >= 85) return 'Excellent profil';
      if (score >= 70) return 'Très bon profil';
      if (score >= 55) return 'Bon profil';
      if (score >= 40) return 'Profil à potentiel';
      return 'Profil à développer';
    }
  };

  const scoreComponents = [
    {
      icon: TrendingUp,
      label: scoreBreakdown.isJobSpecific ? 'Compétences requises' : 'Compétences',
      score: scoreBreakdown.skills,
      color: 'text-blue-600',
      details: scoreBreakdown.isJobSpecific ? (
        <div className="space-y-2">
          {scoreBreakdown.details.skillsMatched.length > 0 && (
            <div>
              <div className="text-sm font-medium text-green-700 mb-1">
                ✓ Compétences matchées ({scoreBreakdown.details.skillsMatched.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {scoreBreakdown.details.skillsMatched.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {scoreBreakdown.details.skillsMissing.length > 0 && (
            <div>
              <div className="text-sm font-medium text-red-700 mb-1">
                ✗ Compétences manquantes ({scoreBreakdown.details.skillsMissing.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {scoreBreakdown.details.skillsMissing.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          {scoreBreakdown.details.skillsCount} compétences listées
        </div>
      )
    },
    {
      icon: Clock,
      label: 'Expérience',
      score: scoreBreakdown.experience,
      color: 'text-green-600',
      details: (
        <div className="space-y-2">
          <div className="text-sm">
            <strong>Total:</strong> {scoreBreakdown.details.experienceYears} ans
          </div>
          {scoreBreakdown.details.experienceBreakdown.professional > 0 && (
            <div className="text-sm text-green-700">
              • Professionnel: {scoreBreakdown.details.experienceBreakdown.professional} ans
            </div>
          )}
          {scoreBreakdown.details.experienceBreakdown.alternance > 0 && (
            <div className="text-sm text-blue-700">
              • Alternance: {scoreBreakdown.details.experienceBreakdown.alternance} ans
            </div>
          )}
          {scoreBreakdown.details.experienceBreakdown.internships > 0 && (
            <div className="text-sm text-orange-700">
              • Stages: {scoreBreakdown.details.experienceBreakdown.internships} ans
            </div>
          )}
        </div>
      )
    },
    {
      icon: GraduationCap,
      label: 'Formation',
      score: scoreBreakdown.education,
      color: 'text-purple-600',
      details: (
        <div className="space-y-2">
          <div className="text-sm">
            <strong>Niveau:</strong> {scoreBreakdown.details.educationLevel}
          </div>
          {scoreBreakdown.details.certifications.length > 0 && (
            <div>
              <div className="text-sm font-medium text-purple-700 mb-1">
                Certifications ({scoreBreakdown.details.certifications.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {scoreBreakdown.details.certifications.map((cert, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      icon: User,
      label: 'Complétude du profil',
      score: scoreBreakdown.profileCompleteness,
      color: 'text-orange-600',
      details: (
        <div className="text-sm text-gray-600">
          {scoreBreakdown.details.completenessPercentage}% des informations renseignées
        </div>
      )
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {scoreBreakdown.isJobSpecific ? (
            <>
              <Briefcase size={20} className="text-purple-600" />
              Score de correspondance
            </>
          ) : (
            <>
              <Target size={20} className="text-gray-600" />
              Score général du profil
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score principal */}
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center text-3xl font-bold border-4",
            getScoreColor(scoreBreakdown.overall)
          )}>
            {scoreBreakdown.overall}
            <span className="text-lg ml-1">%</span>
          </div>
          
          <div className={cn(
            "mt-4 px-4 py-2 rounded-full text-sm font-medium",
            scoreBreakdown.isJobSpecific ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
          )}>
            {getScoreLabel(scoreBreakdown.overall, scoreBreakdown.isJobSpecific)}
          </div>

          {scoreBreakdown.matchContext && (
            <div className="mt-2 text-sm text-gray-600 text-center">
              {scoreBreakdown.matchContext}
            </div>
          )}
        </div>

        <Separator />

        {/* Détail des composantes */}
        <div className="space-y-6">
          <h4 className="text-sm font-medium text-gray-900">
            Détail du calcul
          </h4>
          
          {scoreComponents.map((component, index) => {
            const Icon = component.icon;
            return (
              <div key={index} className="space-y-3">
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
                <div className="pl-6">
                  {component.details}
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Explication de la pondération */}
        <div className="text-center">
          <div className="text-xs text-gray-500">
            {scoreBreakdown.isJobSpecific ? (
              'Pondération : Compétences 50% • Expérience 25% • Formation 15% • Profil 10%'
            ) : (
              'Pondération : Compétences 35% • Expérience 35% • Formation 20% • Profil 10%'
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Score calculé en temps réel selon les données du profil
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreBreakdownCard;
