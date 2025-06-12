import React, { useEffect, useRef, useState } from 'react';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import { useCandidateScore } from '@/hooks/use-candidate-score';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, RefreshCw, Zap } from 'lucide-react';
import { analyzeResume } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';
import type { CandidateData } from '@/services/data/candidateService';

interface ScoreDisplayProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ candidate, isLoading, onRefresh }) => {
  const { getAIScore, forceRefresh } = useAIScoring();
  const { score: candidateScore, explanation, isLoading: scoreLoading } = useCandidateScore(candidate);
  const aiScoreData = getAIScore(candidate.id!);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Éviter les rechargements inutiles avec useRef
  const lastCandidateIdRef = useRef<string>();
  const hasMountedRef = useRef(false);
  
  useEffect(() => {
    // Ne précharger qu'une seule fois par candidat
    if (candidate.id && candidate.id !== lastCandidateIdRef.current && !hasMountedRef.current) {
      console.log('ScoreDisplay: Initial load for candidate:', candidate.id);
      lastCandidateIdRef.current = candidate.id;
      hasMountedRef.current = true;
    }
  }, [candidate.id]);
  
  const handleAnalyzeCV = async () => {
    if (!candidate.resume_id) {
      toast({
        title: "CV non trouvé",
        description: "Aucun CV associé à ce candidat. Veuillez d'abord uploader un CV.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      console.log('🚀 Starting CV analysis for resume:', candidate.resume_id);
      
      // Effacer le cache avant de relancer l'analyse
      if (candidate.id) {
        console.log('🗑️ Clearing AI score cache before re-analysis');
        forceRefresh(candidate.id);
      }
      
      toast({
        title: "Analyse en cours",
        description: "L'analyse IA du CV a commencé...",
      });

      const result = await analyzeResume(candidate.resume_id);
      
      if (result.success) {
        toast({
          title: "Analyse terminée",
          description: "Le CV a été analysé avec succès. Le score IA et les informations ont été mis à jour.",
        });
        
        // Forcer le rafraîchissement du score après l'analyse
        if (candidate.id) {
          console.log('🔄 Forcing score refresh after successful analysis');
          setTimeout(() => {
            forceRefresh(candidate.id!);
          }, 1000); // Petit délai pour laisser le temps à la base de données
        }
        
        // Rafraîchir les données du candidat
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(result.error || 'Échec de l\'analyse');
      }
      
    } catch (error: any) {
      console.error('❌ Error analyzing CV:', error);
      toast({
        title: "Erreur d'analyse",
        description: error.message || "Impossible d'analyser le CV",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefresh = () => {
    console.log('ScoreDisplay: Manual refresh requested');
    if (candidate.id) {
      console.log('🔄 Forcing immediate score refresh');
      forceRefresh(candidate.id);
    }
    // Si pas de score après le refresh, proposer de relancer l'analyse
    setTimeout(() => {
      const refreshedScore = getAIScore(candidate.id!);
      if (!refreshedScore.score && !refreshedScore.isLoading) {
        handleAnalyzeCV();
      }
    }, 2000);
  };

  // Extraire correctement le score numérique
  const getNumericScore = (): number | null => {
    if (aiScoreData.score !== null) {
      return aiScoreData.score;
    }
    if (candidateScore && typeof candidateScore === 'object' && 'overall' in candidateScore) {
      return candidateScore.overall;
    }
    return null;
  };

  const displayScore = getNumericScore();
  const displayExplanation = explanation || aiScoreData.explanation;

  return (
    <Card className="border-navy/10 shadow-sm bg-gradient-to-br from-purple/5 to-blue/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-semibold text-navy-dark">Score IA</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || aiScoreData.isLoading || scoreLoading || isAnalyzing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${(isLoading || aiScoreData.isLoading || scoreLoading || isAnalyzing) ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {displayScore !== null ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-navy-dark">
                {displayScore}/100
              </div>
              <Badge 
                variant={displayScore >= 80 ? 'default' : displayScore >= 60 ? 'secondary' : 'outline'}
                className={displayScore >= 80 ? 'bg-green-500' : displayScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
              >
                {displayScore >= 80 ? 'Excellent' : displayScore >= 60 ? 'Bon' : 'À améliorer'}
              </Badge>
            </div>
            {displayExplanation && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {displayExplanation}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Aucun score disponible</p>
            <Button
              onClick={handleAnalyzeCV}
              disabled={isAnalyzing || !candidate.resume_id}
              size="sm"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analyser le CV
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScoreDisplay;
