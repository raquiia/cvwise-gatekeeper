
import { useState, useEffect } from 'react';
import { optimizedScoringService } from '@/services/scoring/optimizedScoringService';
import { useOptimizedScoring, ContextualScore } from './use-optimized-scoring';
import { useAIScoring } from './use-ai-scoring';
import { CandidateData } from '@/services/data/candidateService';

export const useCandidateScore = (candidate: CandidateData) => {
  const [score, setScore] = useState<ContextualScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { calculateContextualScore, getCachedScore, isScoreLoading, isJobSpecific } = useOptimizedScoring();
  const { calculateAIScore, getAIScore } = useAIScoring();
  
  useEffect(() => {
    if (!candidate.id) return;
    
    const candidateId = candidate.id;
    
    // Priorité : utiliser le score IA si disponible
    const aiScore = getAIScore(candidateId);
    if (aiScore.score !== null && !aiScore.isLoading && !aiScore.error) {
      const contextualScore: ContextualScore = {
        overall: aiScore.score,
        skills: aiScore.breakdown.skills || 0,
        experience: aiScore.breakdown.experience || 0,
        education: aiScore.breakdown.education || 0,
        profileCompleteness: aiScore.breakdown.cvStructure || aiScore.breakdown.profileSummary || 50,
        isJobSpecific: aiScore.isJobSpecific,
        matchContext: aiScore.isJobSpecific ? 'Score IA de correspondance' : 'Score IA de complétude',
        details: {
          skillsCount: Array.isArray(candidate.skills) ? candidate.skills.length : 0,
          experienceYears: candidate.years_experience || 0,
          educationLevel: Array.isArray(candidate.education) && candidate.education.length > 0 ? 
            'Renseigné' : 'Non renseigné',
          completenessPercentage: aiScore.score
        }
      };
      
      setScore(contextualScore);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Fallback : utiliser le système de scoring classique
    const cachedScore = getCachedScore(candidateId);
    if (cachedScore) {
      const contextualScore: ContextualScore = {
        overall: cachedScore.is_job_specific ? 
          cachedScore.total_matching_score! : 
          cachedScore.general_score,
        skills: cachedScore.is_job_specific ? 
          cachedScore.skills_tools_score! : 
          cachedScore.skills_score,
        experience: cachedScore.is_job_specific ? 
          cachedScore.relevant_experience_score! : 
          cachedScore.experience_score,
        education: cachedScore.is_job_specific ? 
          cachedScore.education_match_score! : 
          cachedScore.education_score,
        profileCompleteness: cachedScore.is_job_specific ? 
          50 : cachedScore.cv_structure_score,
        isJobSpecific: cachedScore.is_job_specific,
        matchContext: cachedScore.job_offer_id ? 'Score de correspondance' : 'Score de complétude',
        details: {
          skillsCount: Array.isArray(candidate.skills) ? candidate.skills.length : 0,
          experienceYears: candidate.years_experience || 0,
          educationLevel: Array.isArray(candidate.education) && candidate.education.length > 0 ? 
            'Renseigné' : 'Non renseigné',
          completenessPercentage: cachedScore.is_job_specific ? 
            cachedScore.total_matching_score! : 
            cachedScore.general_score
        }
      };
      
      setScore(contextualScore);
      setIsLoading(false);
      return;
    }
    
    // Si aucun score n'est disponible, calculer avec l'IA en priorité
    const loadScore = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Essayer d'abord avec l'IA
        await calculateAIScore(candidateId);
        
        // Si l'IA échoue, fallback sur le système classique
        const aiScoreAfter = getAIScore(candidateId);
        if (aiScoreAfter.error) {
          console.warn('IA scoring failed, falling back to classic scoring');
          const contextualScore = await calculateContextualScore(candidate);
          setScore(contextualScore);
        }
        
      } catch (err: any) {
        console.error('Error loading candidate score:', err);
        setError(err.message || 'Erreur lors du calcul du score');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Vérifier si le score est déjà en cours de calcul
    if (!isScoreLoading(candidateId) && !aiScore.isLoading) {
      loadScore();
    } else {
      setIsLoading(true);
    }
  }, [candidate.id, candidate.skills, candidate.years_experience, candidate.education, 
      calculateContextualScore, getCachedScore, isScoreLoading, calculateAIScore, getAIScore]);
  
  return {
    score,
    isLoading: isLoading || getAIScore(candidate.id!).isLoading,
    error: error || getAIScore(candidate.id!).error,
    isJobSpecific
  };
};
