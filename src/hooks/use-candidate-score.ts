
import { useState, useEffect, useRef, useCallback } from 'react';
import { useOptimizedScoring, ContextualScore } from './use-optimized-scoring';
import { useAIScoring } from './use-ai-scoring';
import { CandidateData } from '@/services/data/candidateService';

export const useCandidateScore = (candidate: CandidateData) => {
  const [score, setScore] = useState<ContextualScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const { getCachedScore, isJobSpecific } = useOptimizedScoring();
  const { getAIScore } = useAIScoring();
  
  // Utiliser useRef pour éviter les re-créations de fonctions
  const lastProcessedRef = useRef<{ candidateId: string; timestamp: number } | null>(null);
  const processingRef = useRef(false);
  
  const generateScoreSuggestions = useCallback((score: ContextualScore, explanation: string): string[] => {
    const suggestions: string[] = [];
    
    if (score.skills < 60) {
      suggestions.push('Enrichissez votre profil avec des compétences techniques supplémentaires');
    }
    
    if (score.experience < 50) {
      suggestions.push('Détaillez davantage vos expériences professionnelles avec dates et réalisations');
    }
    
    if (score.education < 40) {
      suggestions.push('Ajoutez vos formations, diplômes et certifications');
    }
    
    if (score.profileCompleteness < 70) {
      suggestions.push('Complétez les informations manquantes de votre profil (contact, localisation, etc.)');
    }
    
    if (score.overall < 50) {
      suggestions.push('Votre profil a un potentiel d\'amélioration significatif');
    } else if (score.overall > 85) {
      suggestions.push('Excellent profil ! Maintenez-le à jour régulièrement');
    }
    
    if (explanation.toLowerCase().includes('manque')) {
      suggestions.push('Identifiez les éléments manqués mentionnés dans l\'analyse et complétez-les');
    }
    
    return suggestions.slice(0, 3);
  }, []);

  const processScore = useCallback(async () => {
    if (!candidate.id || processingRef.current) return;
    
    // Éviter le retraitement si le candidat et le timestamp n'ont pas changé
    const currentTimestamp = candidate.updated_at ? new Date(candidate.updated_at).getTime() : Date.now();
    if (lastProcessedRef.current?.candidateId === candidate.id && 
        lastProcessedRef.current?.timestamp === currentTimestamp) {
      return;
    }
    
    processingRef.current = true;
    const candidateId = candidate.id;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Priorité 1: Récupérer le score IA depuis le cache/base
      const aiScore = getAIScore(candidateId);
      
      if (aiScore.score !== null && !aiScore.isLoading && !aiScore.error) {
        console.log(`[use-candidate-score] Using AI score from cache/database: ${aiScore.score}`);
        
        const contextualScore: ContextualScore = {
          overall: aiScore.score,
          skills: aiScore.breakdown?.skills || 0,
          experience: aiScore.breakdown?.experience || 0,
          education: aiScore.breakdown?.education || 0,
          profileCompleteness: aiScore.breakdown?.cvStructure || aiScore.breakdown?.profileSummary || 50,
          isJobSpecific: aiScore.isJobSpecific,
          matchContext: aiScore.isJobSpecific ? 
            'Score IA de correspondance' : 
            'Score IA de complétude',
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
        setSuggestions(generateScoreSuggestions(contextualScore, aiScore.explanation || ''));
        lastProcessedRef.current = { candidateId, timestamp: currentTimestamp };
        return;
      }
      
      // Si le score IA est en cours de chargement, attendre
      if (aiScore.isLoading) {
        console.log('[use-candidate-score] AI score is loading, waiting...');
        return;
      }
      
      // Priorité 2: Utiliser le score classique depuis le cache
      const cachedScore = getCachedScore(candidateId);
      if (cachedScore) {
        console.log('[use-candidate-score] Using cached classic score as fallback');
        
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
        setSuggestions([]);
        lastProcessedRef.current = { candidateId, timestamp: currentTimestamp };
        return;
      }
      
      // Priorité 3: Utiliser le score legacy du candidat
      if (candidate.score) {
        console.log('[use-candidate-score] Using legacy candidate score as final fallback');
        
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
        setSuggestions([]);
        lastProcessedRef.current = { candidateId, timestamp: currentTimestamp };
        return;
      }
      
      // Aucun score disponible - ne pas refaire d'appels
      console.log('[use-candidate-score] No score available anywhere for candidate:', candidateId);
      setScore(null);
      setExplanation('Score sera calculé lors de l\'analyse du CV');
      setSuggestions(['Analysez le CV pour obtenir un score IA']);
      lastProcessedRef.current = { candidateId, timestamp: currentTimestamp };
      
    } catch (err: any) {
      console.error('[use-candidate-score] Error processing score:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      processingRef.current = false;
    }
  }, [candidate.id, candidate.updated_at, candidate.skills, candidate.years_experience, 
      candidate.education, candidate.score, candidate.profile_completeness, 
      getCachedScore, getAIScore, generateScoreSuggestions]);

  // Effect optimisé avec des dépendances stables
  useEffect(() => {
    if (candidate.id) {
      processScore();
    }
  }, [candidate.id, candidate.updated_at, isJobSpecific]);

  return {
    score,
    explanation,
    suggestions,
    isLoading: isLoading || getAIScore(candidate.id!).isLoading,
    error: error || getAIScore(candidate.id!).error,
    isJobSpecific
  };
};
