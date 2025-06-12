
import React, { useEffect, useRef, useState } from 'react';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import { useCandidateScore } from '@/hooks/use-candidate-score';
import AIScoreDisplay from '../AIScoreDisplay';
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
  
  return (
    <AIScoreDisplay
      candidateId={candidate.id!}
      score={aiScoreData.score}
      explanation={explanation || aiScoreData.explanation}
      breakdown={aiScoreData.breakdown}
      strengths={aiScoreData.strengths}
      weaknesses={aiScoreData.weaknesses}
      recommendations={aiScoreData.recommendations}
      isLoading={isLoading || aiScoreData.isLoading || scoreLoading || isAnalyzing}
      isJobSpecific={aiScoreData.isJobSpecific}
      error={aiScoreData.error}
      onRefresh={handleRefresh}
    />
  );
};

export default ScoreDisplay;
