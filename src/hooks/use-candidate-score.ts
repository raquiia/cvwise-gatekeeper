
import { useState, useEffect } from 'react';
import { optimizedScoringService } from '@/services/scoring/optimizedScoringService';
import { useOptimizedScoring, ContextualScore } from './use-optimized-scoring';
import { useAIScoring } from './use-ai-scoring';
import { CandidateData } from '@/services/data/candidateService';

export const useCandidateScore = (candidate: CandidateData) => {
  const [score, setScore] = useState<ContextualScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  
  const { calculateContextualScore, getCachedScore, isScoreLoading, isJobSpecific } = useOptimizedScoring();
  const { calculateAIScore, getAIScore } = useAIScoring();
  
  useEffect(() => {
    if (!candidate.id) return;
    
    const candidateId = candidate.id;
    
    // Priorité absolue : utiliser le score IA (système unifié)
    const aiScore = getAIScore(candidateId);
    
    if (aiScore.score !== null && !aiScore.isLoading && !aiScore.error) {
      // Score IA disponible - l'utiliser immédiatement
      const contextualScore: ContextualScore = {
        overall: aiScore.score,
        skills: aiScore.breakdown?.skills || 0,
        experience: aiScore.breakdown?.experience || 0,
        education: aiScore.breakdown?.education || 0,
        profileCompleteness: aiScore.breakdown?.cvStructure || aiScore.breakdown?.profileSummary || 50,
        isJobSpecific: aiScore.isJobSpecific,
        matchContext: aiScore.isJobSpecific ? 
          `Score IA de correspondance${aiScore.source ? ` (${getSourceLabel(aiScore.source)})` : ''}` : 
          `Score IA de complétude${aiScore.source ? ` (${getSourceLabel(aiScore.source)})` : ''}`,
        details: {
          skillsCount: Array.isArray(candidate.skills) ? candidate.skills.length : 0,
          experienceYears: candidate.years_experience || 0,
          educationLevel: Array.isArray(candidate.education) && candidate.education.length > 0 ? 
            'Renseigné' : 'Non renseigné',
          completenessPercentage: aiScore.score
        }
      };
      
      setScore(contextualScore);
      setExplanation(aiScore.explanation || '');
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Si le score IA est en cours de chargement, afficher l'état de chargement
    if (aiScore.isLoading) {
      setIsLoading(true);
      setError(null);
      return;
    }
    
    // Si erreur dans l'AI mais on a un ancien score, l'utiliser temporairement
    if (aiScore.error && candidate.score) {
      const fallbackScore: ContextualScore = {
        overall: candidate.score,
        skills: 0, // Pas de détail disponible avec l'ancien système
        experience: 0,
        education: 0,
        profileCompleteness: candidate.profile_completeness || 50,
        isJobSpecific: false,
        matchContext: 'Score classique (fallback)',
        details: {
          skillsCount: Array.isArray(candidate.skills) ? candidate.skills.length : 0,
          experienceYears: candidate.years_experience || 0,
          educationLevel: Array.isArray(candidate.education) && candidate.education.length > 0 ? 
            'Renseigné' : 'Non renseigné',
          completenessPercentage: candidate.score
        }
      };
      
      setScore(fallbackScore);
      setExplanation('');
      setIsLoading(false);
      setError(aiScore.error);
      return;
    }
    
    // Fallback 1: utiliser le système de scoring classique si disponible
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
        matchContext: cachedScore.job_offer_id ? 'Score de correspondance (classique)' : 'Score de complétude (classique)',
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
      setExplanation('');
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Derniers fallback: l'ancien score du candidat s'il existe
    if (candidate.score) {
      const legacyScore: ContextualScore = {
        overall: candidate.score,
        skills: 0,
        experience: 0,
        education: 0,
        profileCompleteness: candidate.profile_completeness || 50,
        isJobSpecific: false,
        matchContext: 'Score hérité',
        details: {
          skillsCount: Array.isArray(candidate.skills) ? candidate.skills.length : 0,
          experienceYears: candidate.years_experience || 0,
          educationLevel: Array.isArray(candidate.education) && candidate.education.length > 0 ? 
            'Renseigné' : 'Non renseigné',
          completenessPercentage: candidate.score
        }
      };
      
      setScore(legacyScore);
      setExplanation('');
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Aucun score disponible - essayer de calculer avec l'IA de manière asynchrone
    if (!isScoreLoading(candidateId) && !aiScore.isLoading) {
      const loadScore = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          // Essayer de calculer avec l'IA
          await calculateAIScore(candidateId);
          
          // Le useEffect se déclenchera à nouveau avec le nouveau score
          
        } catch (err: any) {
          console.warn('IA scoring failed, falling back to classic scoring for candidate:', candidateId);
          
          try {
            // Fallback sur le système classique
            const contextualScore = await calculateContextualScore(candidate);
            setScore(contextualScore);
            setExplanation('');
          } catch (classicErr: any) {
            console.error('Classic scoring also failed:', classicErr);
            setError('Impossible de calculer le score du candidat');
            setExplanation('');
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      loadScore();
    }
  }, [candidate.id, candidate.skills, candidate.years_experience, candidate.education, candidate.score,
      calculateContextualScore, getCachedScore, isScoreLoading, calculateAIScore, getAIScore]);

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'database': return 'BDD';
      case 'fresh_calculation': return 'Nouveau';
      case 'cache': return 'Cache';
      default: return source;
    }
  };
  
  return {
    score,
    explanation,
    isLoading: isLoading || getAIScore(candidate.id!).isLoading,
    error: error || getAIScore(candidate.id!).error,
    isJobSpecific
  };
};
