
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
  const { calculateAIScore, getAIScore, preloadScoresFromDatabase } = useAIScoring();
  
  useEffect(() => {
    if (!candidate.id) return;
    
    const candidateId = candidate.id;
    
    // Priorité 1: vérifier si on a déjà un score IA dans le cache/state
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
    
    // Priorité 2: Si le score IA est en cours de chargement, afficher l'état de chargement
    if (aiScore.isLoading) {
      setIsLoading(true);
      setError(null);
      return;
    }
    
    // Priorité 3: Précharger depuis la base de données (pour les scores calculés lors de l'analyse)
    if (!aiScore.score && !aiScore.isLoading && !aiScore.error) {
      const loadFromDatabase = async () => {
        try {
          setIsLoading(true);
          
          console.log('🔍 Checking database for existing AI score for candidate:', candidateId);
          const loadedScores = await preloadScoresFromDatabase([candidateId]);
          const preloadedScore = loadedScores[candidateId];
          
          if (preloadedScore && preloadedScore.score !== null) {
            console.log('✅ Found existing AI score in database:', preloadedScore.score);
            
            const contextualScore: ContextualScore = {
              overall: preloadedScore.score,
              skills: preloadedScore.breakdown?.skills || 0,
              experience: preloadedScore.breakdown?.experience || 0,
              education: preloadedScore.breakdown?.education || 0,
              profileCompleteness: preloadedScore.breakdown?.cvStructure || preloadedScore.breakdown?.profileSummary || 50,
              isJobSpecific: preloadedScore.isJobSpecific,
              matchContext: preloadedScore.isJobSpecific ? 
                'Score IA de correspondance (BDD)' : 
                'Score IA de complétude (BDD)',
              details: {
                skillsCount: Array.isArray(candidate.skills) ? candidate.skills.length : 0,
                experienceYears: candidate.years_experience || 0,
                educationLevel: Array.isArray(candidate.education) && candidate.education.length > 0 ? 
                  'Renseigné' : 'Non renseigné',
                completenessPercentage: preloadedScore.score
              }
            };
            
            setScore(contextualScore);
            setExplanation(preloadedScore.explanation || '');
            setError(null);
            return;
          }
          
          console.log('⚠️ No AI score found in database, checking other options...');
          
        } catch (dbError) {
          console.warn('⚠️ Error loading score from database:', dbError);
        } finally {
          setIsLoading(false);
        }
        
        // Fallback 1: utiliser le système de scoring classique si disponible
        const cachedScore = getCachedScore(candidateId);
        if (cachedScore) {
          console.log('📊 Using cached classic score as fallback');
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
          setError(null);
          return;
        }
        
        // Derniers fallback: l'ancien score du candidat s'il existe
        if (candidate.score) {
          console.log('📊 Using legacy candidate score as final fallback');
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
          setError(null);
          return;
        }
        
        // Aucun score disponible - ne pas calculer automatiquement pour éviter les coûts
        console.log('ℹ️ No score found anywhere for candidate:', candidateId);
        setScore(null);
        setExplanation('');
        setError(null);
      };
      
      loadFromDatabase();
    }
    
    // Si erreur dans l'AI mais on a un ancien score, l'utiliser temporairement
    if (aiScore.error && candidate.score) {
      const fallbackScore: ContextualScore = {
        overall: candidate.score,
        skills: 0,
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
      setExplanation(aiScore.explanation || '');
      setError(aiScore.error);
      return;
    }
    
  }, [candidate.id, candidate.skills, candidate.years_experience, candidate.education, candidate.score,
      calculateContextualScore, getCachedScore, isScoreLoading, getAIScore, preloadScoresFromDatabase]);

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
