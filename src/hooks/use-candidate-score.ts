
import { useState, useEffect } from 'react';
import { optimizedScoringService } from '@/services/scoring/optimizedScoringService';
import { useOptimizedScoring, ContextualScore } from './use-optimized-scoring';
import { CandidateData } from '@/services/data/candidateService';

export const useCandidateScore = (candidate: CandidateData) => {
  const [score, setScore] = useState<ContextualScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { calculateContextualScore, getCachedScore, isScoreLoading, isJobSpecific } = useOptimizedScoring();
  
  useEffect(() => {
    if (!candidate.id) return;
    
    const candidateId = candidate.id;
    
    // Vérifier si un score est déjà en cache
    const cachedScore = getCachedScore(candidateId);
    if (cachedScore) {
      // Convertir le score en cache en ContextualScore
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
        matchContext: cachedScore.job_offer_id ? 'Offre active' : undefined,
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
    
    // Si pas de cache, calculer le score
    const loadScore = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const contextualScore = await calculateContextualScore(candidate);
        setScore(contextualScore);
        
      } catch (err: any) {
        console.error('Error loading candidate score:', err);
        setError(err.message || 'Erreur lors du calcul du score');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Vérifier si le score est déjà en cours de calcul
    if (!isScoreLoading(candidateId)) {
      loadScore();
    } else {
      setIsLoading(true);
    }
  }, [candidate.id, candidate.skills, candidate.years_experience, candidate.education, 
      calculateContextualScore, getCachedScore, isScoreLoading]);
  
  return {
    score,
    isLoading,
    error,
    isJobSpecific
  };
};
