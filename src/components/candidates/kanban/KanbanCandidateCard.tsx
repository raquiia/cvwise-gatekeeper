
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Edit, Trash2, Mail, Phone, Brain, TrendingUp } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';
import { candidateService } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { useAIScoring } from '@/hooks/use-ai-scoring';

interface KanbanCandidateCardProps {
  candidate: CandidateData;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
  isDragging?: boolean;
  jobOfferId?: string;
}

const KanbanCandidateCard: React.FC<KanbanCandidateCardProps> = ({
  candidate,
  onViewCandidate,
  onCandidateDeleted,
  isDragging = false,
  jobOfferId
}) => {
  const { toast } = useToast();
  const { getAIScore, isJobSpecific } = useAIScoring();
  const skills = ensureStringArray(candidate.skills);
  
  // Utiliser uniquement le système AI scoring unifié
  const aiScore = getAIScore(candidate.id!, jobOfferId);
  const jobSpecific = isJobSpecific(jobOfferId);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!candidate.id) return;
    
    try {
      await candidateService.deleteCandidate(candidate.id);
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
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreSource = (source?: string) => {
    switch (source) {
      case 'database': return 'BDD';
      case 'fresh_calculation': return 'Nouveau';
      case 'cache': return 'Cache';
      default: return 'IA';
    }
  };

  // SUPPRIMÉ : Plus de useEffect pour déclencher automatiquement les calculs
  // Les scores seront calculés à la demande ou préchargés intelligemment

  return (
    <Card 
      className={`group cursor-pointer border-purple-200/30 dark:border-purple-800/20 bg-white/90 dark:bg-navy-dark/90 backdrop-blur-sm hover:shadow-md transition-all duration-200 ${
        isDragging ? 'rotate-3 shadow-lg' : ''
      }`}
      onClick={() => onViewCandidate(candidate.id!)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
              {candidate.first_name?.[0]}{candidate.last_name?.[0]}
            </div>
            <div>
              <h4 className="font-medium text-sm text-navy-dark dark:text-sand">
                {candidate.first_name} {candidate.last_name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {candidate.position || 'Poste non spécifié'}
              </p>
            </div>
          </div>
          
          {/* Score - Uniquement système AI */}
          <div className="flex flex-col items-end gap-1">
            {aiScore.isLoading ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-muted-foreground">Calcul...</span>
              </div>
            ) : aiScore.error ? (
              <div className="flex flex-col items-end gap-1" title={aiScore.error}>
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  N/A
                </div>
                <Badge variant="destructive" className="text-xs">
                  Erreur
                </Badge>
              </div>
            ) : aiScore.score !== null ? (
              <div className="flex flex-col items-end gap-1">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(aiScore.score)}`}>
                  {aiScore.score}%
                </div>
                <div className="flex items-center gap-1">
                  <Badge 
                    variant="default"
                    className="text-xs bg-purple-100 text-purple-800 border-purple-300"
                    title={aiScore.explanation || "Score calculé par l'IA"}
                  >
                    <Brain size={8} className="mr-1" />
                    {getScoreSource(aiScore.source)}
                  </Badge>
                  {jobSpecific && (
                    <div title="Score de correspondance">
                      <TrendingUp size={10} className="text-purple-600" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  En attente
                </div>
                <Badge variant="secondary" className="text-xs">
                  <Brain size={8} className="mr-1" />
                  IA
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Company and Location */}
        <div className="space-y-1 mb-3 text-xs text-muted-foreground">
          <div className="flex items-center">
            <MapPin size={10} className="mr-1" />
            {candidate.location || 'Non spécifié'}
          </div>
          <div className="flex items-center">
            <Calendar size={10} className="mr-1" />
            {candidate.years_experience ? `${candidate.years_experience} ans` : 'Exp. NS'}
          </div>
        </div>

        {/* Skills */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 2).map((skill, idx) => (
              <Badge key={idx} variant="outline" className="text-xs py-0">
                {skill}
              </Badge>
            ))}
            {skills.length > 2 && (
              <Badge variant="secondary" className="text-xs py-0">
                +{skills.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Contact Info */}
        {(candidate.email || candidate.phone) && (
          <div className="space-y-1 mb-3 text-xs text-muted-foreground">
            {candidate.email && (
              <div className="flex items-center truncate">
                <Mail size={10} className="mr-1" />
                <span className="truncate">{candidate.email}</span>
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center">
                <Phone size={10} className="mr-1" />
                {candidate.phone}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewCandidate(candidate.id!);
            }}
            className="h-6 w-6 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            <Edit size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanCandidateCard;
