
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Info, Target, User } from 'lucide-react';
import { useEnhancedCandidateScore } from '@/hooks/use-enhanced-candidate-score';
import type { CandidateData } from '@/services/data/candidateService';

interface EnhancedScoreDisplayProps {
  candidate: CandidateData;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
};

const getScoreColorClass = (score: number): string => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
};

const EnhancedScoreDisplay: React.FC<EnhancedScoreDisplayProps> = ({ candidate }) => {
  const { 
    scoreBreakdown, 
    isLoading, 
    isJobSpecific, 
    scoreSource, 
    canForceRecalculate, 
    forceRecalculate 
  } = useEnhancedCandidateScore(candidate);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Calcul du score...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isJobSpecific ? <Target className="h-4 w-4" /> : <User className="h-4 w-4" />}
            Score candidat
          </CardTitle>
          {canForceRecalculate && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={forceRecalculate}
              className="h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Recalculer
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={scoreSource === 'job-specific' ? 'default' : 'secondary'}>
            {scoreSource === 'job-specific' ? 'Spécifique à l\'offre' : 
             scoreSource === 'general' ? 'Score général' : 'Calculé à la volée'}
          </Badge>
          {scoreBreakdown.matchContext && (
            <span className="text-xs text-muted-foreground">{scoreBreakdown.matchContext}</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Score global */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(scoreBreakdown.overall)}`}>
            {scoreBreakdown.overall}%
          </div>
          <p className="text-sm text-muted-foreground">Score global</p>
        </div>

        {/* Détail des scores */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Compétences</span>
              <span className={getScoreColor(scoreBreakdown.skills)}>{scoreBreakdown.skills}%</span>
            </div>
            <Progress value={scoreBreakdown.skills} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Expérience</span>
              <span className={getScoreColor(scoreBreakdown.experience)}>{scoreBreakdown.experience}%</span>
            </div>
            <Progress value={scoreBreakdown.experience} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Éducation</span>
              <span className={getScoreColor(scoreBreakdown.education)}>{scoreBreakdown.education}%</span>
            </div>
            <Progress value={scoreBreakdown.education} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Complétude</span>
              <span className={getScoreColor(scoreBreakdown.profileCompleteness)}>{scoreBreakdown.profileCompleteness}%</span>
            </div>
            <Progress value={scoreBreakdown.profileCompleteness} className="h-2" />
          </div>
        </div>

        {/* Détails supplémentaires pour le matching d'offre */}
        {isJobSpecific && scoreBreakdown.details.skillsMatched && scoreBreakdown.details.skillsMatched.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Correspondance</span>
            </div>
            
            {scoreBreakdown.details.skillsMatched.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-muted-foreground">Compétences correspondantes:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {scoreBreakdown.details.skillsMatched.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-emerald-50">
                      {skill}
                    </Badge>
                  ))}
                  {scoreBreakdown.details.skillsMatched.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{scoreBreakdown.details.skillsMatched.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {scoreBreakdown.details.skillsMissing && scoreBreakdown.details.skillsMissing.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Compétences manquantes:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {scoreBreakdown.details.skillsMissing.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-red-50">
                      {skill}
                    </Badge>
                  ))}
                  {scoreBreakdown.details.skillsMissing.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{scoreBreakdown.details.skillsMissing.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informations de base */}
        <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
          <div>Compétences: {scoreBreakdown.details.skillsCount}</div>
          <div>Expérience: {scoreBreakdown.details.experienceYears} ans</div>
          <div>Éducation: {scoreBreakdown.details.educationLevel}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedScoreDisplay;
