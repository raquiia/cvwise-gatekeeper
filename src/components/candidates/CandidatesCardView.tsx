
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, TrendingUp, Edit, Trash2, Mail, Phone, Brain } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';
import { candidateService } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateFormatter';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import { cn } from '@/lib/utils';

interface CandidatesCardViewProps {
  candidates: CandidateData[];
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
}

const CandidatesCardView: React.FC<CandidatesCardViewProps> = ({
  candidates,
  onViewCandidate,
  onCandidateDeleted
}) => {
  const { toast } = useToast();
  const { getAIScore, preloadScoresFromDatabase, isJobSpecific } = useAIScoring();

  // Précharger les scores AI pour tous les candidats visibles
  useEffect(() => {
    const candidateIds = candidates.map(c => c.id!).filter(Boolean);
    if (candidateIds.length > 0) {
      console.log('Preloading AI scores for card view candidates:', candidateIds.length);
      preloadScoresFromDatabase(candidateIds);
    }
  }, [candidates, preloadScoresFromDatabase]);

  const handleDelete = async (candidateId: string) => {
    try {
      await candidateService.deleteCandidate(candidateId);
      toast({
        title: "Candidat supprimé",
        description: "Le candidat a été supprimé avec succès",
      });
      if (onCandidateDeleted) {
        onCandidateDeleted();
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le candidat",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreSource = (source?: string) => {
    switch (source) {
      case 'database': return 'BDD';
      case 'fresh_calculation': return 'Nouveau';
      case 'cache': return 'Cache';
      default: return 'Ancien';
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucun candidat trouvé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {candidates.map((candidate) => {
        const skills = ensureStringArray(candidate.skills);
        const aiScore = getAIScore(candidate.id!);
        const displayScore = aiScore.score !== null ? aiScore.score : (candidate.score || 0);
        const isAIScore = aiScore.score !== null;

        return (
          <Card
            key={candidate.id}
            className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500"
            onClick={() => onViewCandidate(candidate.id!)}
          >
            <CardContent className="p-6">
              {/* Header avec avatar et score */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg font-semibold">
                    {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-navy-dark">
                      {candidate.first_name} {candidate.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {candidate.position || 'Poste non spécifié'}
                    </p>
                  </div>
                </div>
                
                {/* Score avec indicateur AI */}
                <div className="flex flex-col items-end gap-1">
                  {aiScore.isLoading ? (
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-gray-500">...</span>
                    </div>
                  ) : aiScore.error ? (
                    <div className="flex flex-col items-end gap-1" title={aiScore.error}>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-bold border",
                        getScoreColor(candidate.score || 0)
                      )}>
                        {candidate.score || 0}%
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Ancien
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-bold border",
                        getScoreColor(displayScore)
                      )}>
                        {displayScore}%
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={isAIScore ? "default" : "secondary"} 
                          className={cn(
                            "text-xs",
                            isAIScore ? "bg-purple-100 text-purple-800 border-purple-300" : ""
                          )}
                          title={isAIScore ? aiScore.explanation : "Score calculé avec l'ancien système"}
                        >
                          {isAIScore && <Brain size={10} className="mr-1" />}
                          {isAIScore ? getScoreSource(aiScore.source) : 'Ancien'}
                        </Badge>
                        {isJobSpecific && (
                          <div title="Score de correspondance">
                            <TrendingUp size={12} className="text-purple-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Company et localisation */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">{candidate.company || 'Entreprise non spécifiée'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={14} className="mr-2 text-gray-400" />
                  {candidate.location || 'Localisation non spécifiée'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={14} className="mr-2 text-gray-400" />
                  {candidate.years_experience ? `${candidate.years_experience} ans d'expérience` : 'Expérience non spécifiée'}
                </div>
              </div>

              {/* Compétences */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {skills.slice(0, 3).map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {skills.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{skills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact */}
              {(candidate.email || candidate.phone) && (
                <div className="space-y-1 mb-4 text-xs text-gray-600">
                  {candidate.email && (
                    <div className="flex items-center truncate">
                      <Mail size={12} className="mr-2 text-gray-400" />
                      <span className="truncate">{candidate.email}</span>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center">
                      <Phone size={12} className="mr-2 text-gray-400" />
                      {candidate.phone}
                    </div>
                  )}
                </div>
              )}

              {/* Date de mise à jour */}
              <div className="text-xs text-gray-500 mb-4">
                Mis à jour le {formatDate(candidate.updated_at || candidate.created_at || '')}
              </div>

              {/* Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewCandidate(candidate.id!);
                  }}
                  className="flex-1"
                >
                  <Edit size={14} className="mr-2" />
                  Voir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(candidate.id!);
                  }}
                  className="text-red-600 hover:text-red-800 hover:border-red-300"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CandidatesCardView;
