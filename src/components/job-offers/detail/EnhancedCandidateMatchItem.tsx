
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Target,
  Zap,
  AlertTriangle
} from 'lucide-react';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

interface EnhancedCandidateMatchItemProps {
  match: ExtendedCandidateMatch;
  onViewCandidate: (candidateId: string) => void;
  sortKey: 'local' | 'global' | 'skills';
  renderMatchedSkills: (candidateId: string, jobOfferId: string) => React.ReactNode;
  renderMissingSkills: (candidateId: string, jobOfferId: string) => React.ReactNode;
  jobId: string;
}

const EnhancedCandidateMatchItem: React.FC<EnhancedCandidateMatchItemProps> = ({
  match,
  onViewCandidate,
  sortKey,
  renderMatchedSkills,
  renderMissingSkills,
  jobId
}) => {
  // Déterminer le score à afficher selon l'onglet
  const getDisplayScore = () => {
    switch (sortKey) {
      case 'local':
        return match.localScore || match.score;
      case 'global':
        return match.globalScore || match.score;
      case 'skills':
        return match.skillsOnlyScore || match.score;
      default:
        return match.score;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700 bg-green-100 border-green-200';
    if (score >= 60) return 'text-blue-700 bg-blue-100 border-blue-200';
    if (score >= 40) return 'text-orange-700 bg-orange-100 border-orange-200';
    return 'text-red-700 bg-red-100 border-red-200';
  };

  const getScoreIcon = () => {
    switch (sortKey) {
      case 'local':
        return <MapPin className="h-4 w-4" />;
      case 'global':
        return <Target className="h-4 w-4" />;
      case 'skills':
        return <Zap className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const displayScore = getDisplayScore();
  const needsRelocation = match.details?.location?.needsRelocation;

  return (
    <Card className="transition-all duration-200 hover:shadow-lg border border-purple-100/50 bg-white/80 dark:bg-navy-dark/40 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* En-tête avec nom et score */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-dark dark:text-sand">
                    {match.firstName} {match.lastName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {match.position && (
                      <span>{match.position}</span>
                    )}
                    {match.position && match.company && <span>•</span>}
                    {match.company && (
                      <span>{match.company}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {needsRelocation && sortKey === 'global' && (
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Relocalisation
                  </Badge>
                )}
                
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${getScoreColor(displayScore)}`}>
                  {getScoreIcon()}
                  <span>{displayScore}%</span>
                </div>
              </div>
            </div>

            {/* Informations détaillées */}
            <div className="space-y-3">
              {/* Localisation */}
              {match.candidate?.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{match.candidate.location}</span>
                  {needsRelocation && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      Relocalisation nécessaire
                    </Badge>
                  )}
                </div>
              )}

              {/* Expérience */}
              {match.candidate?.years_experience !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {match.candidate.years_experience} année{match.candidate.years_experience > 1 ? 's' : ''} d'expérience
                  </span>
                </div>
              )}

              {/* Scores détaillés pour l'onglet global */}
              {sortKey === 'global' && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>Skills: {match.skillsOnlyScore || match.details?.skills?.matchPercentage || 0}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>Local: {match.localScore || match.score}%</span>
                  </div>
                </div>
              )}

              {/* Compétences correspondantes */}
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Compétences correspondantes:</span>
                  <div className="mt-1">
                    {renderMatchedSkills(match.candidateId, jobId)}
                  </div>
                </div>
                
                {match.details?.skills?.missing && match.details.skills.missing.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Compétences manquantes:</span>
                    <div className="mt-1">
                      {renderMissingSkills(match.candidateId, jobId)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bouton d'action */}
          <div className="ml-4 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewCandidate(match.candidateId)}
              className="hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-900/20"
            >
              <span className="hidden sm:inline">Voir le profil</span>
              <span className="sm:hidden">Voir</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedCandidateMatchItem;
