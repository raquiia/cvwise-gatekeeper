
import { useState, useEffect } from 'react';
import { persistentScoringService } from '@/services/scoring/persistentScoringService';
import { useActiveJob } from '@/context/ActiveJobContext';
import type { CandidateData } from '@/services/data/candidateService';

export interface ContextualScore {
  skills: number;
  experience: number;
  education: number;
  profileCompleteness: number;
  overall: number;
  details: {
    skillsCount: number;
    experienceYears: number;
    educationLevel: string;
    completenessPercentage: number;
  };
  isJobSpecific: boolean;
  matchContext?: string;
}

export const useCandidateScore = (candidate: CandidateData) => {
  const [score, setScore] = useState<ContextualScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeJobOfferId, activeJobOfferTitle } = useActiveJob();

  useEffect(() => {
    if (!candidate.id) return;

    const loadScore = async () => {
      setIsLoading(true);
      
      try {
        let scoreDetails = null;
        
        if (activeJobOfferId) {
          // Get job-specific score
          scoreDetails = await persistentScoringService.getCandidateJobScore(candidate.id, activeJobOfferId);
          
          if (scoreDetails) {
            setScore({
              ...scoreDetails,
              isJobSpecific: true,
              matchContext: activeJobOfferTitle ? `Score pour "${activeJobOfferTitle}"` : 'Score pour l\'offre sélectionnée'
            });
          } else {
            // Calculate job score if missing
            await persistentScoringService.calculateAndStoreJobScore(candidate.id, activeJobOfferId);
            scoreDetails = await persistentScoringService.getCandidateJobScore(candidate.id, activeJobOfferId);
            
            if (scoreDetails) {
              setScore({
                ...scoreDetails,
                isJobSpecific: true,
                matchContext: activeJobOfferTitle ? `Score pour "${activeJobOfferTitle}"` : 'Score pour l\'offre sélectionnée'
              });
            }
          }
        } else {
          // Get general score
          scoreDetails = await persistentScoringService.getCandidateGeneralScore(candidate.id);
          
          if (scoreDetails) {
            setScore({
              ...scoreDetails,
              isJobSpecific: false,
              matchContext: 'Score général de profil'
            });
          } else {
            // Recalculate general score if missing
            await persistentScoringService.recalculateGeneralScore(candidate.id);
            scoreDetails = await persistentScoringService.getCandidateGeneralScore(candidate.id);
            
            if (scoreDetails) {
              setScore({
                ...scoreDetails,
                isJobSpecific: false,
                matchContext: 'Score général de profil'
              });
            }
          }
        }
        
        // Simple fallback if no score available
        if (!scoreDetails) {
          const skillsArray = Array.isArray(candidate.skills) ? candidate.skills : [];
          setScore({
            skills: Math.min(Math.round((skillsArray.length / 10) * 100), 100),
            experience: candidate.years_experience ? Math.min(candidate.years_experience * 10, 100) : 0,
            education: 50,
            profileCompleteness: candidate.profile_completeness || 0,
            overall: candidate.score || 50,
            details: {
              skillsCount: skillsArray.length,
              experienceYears: candidate.years_experience || 0,
              educationLevel: 'Non spécifié',
              completenessPercentage: candidate.profile_completeness || 0
            },
            isJobSpecific: !!activeJobOfferId,
            matchContext: !!activeJobOfferId ? 'Score contextuel' : 'Score général'
          });
        }
      } catch (error) {
        console.error(`Error loading score for candidate ${candidate.id}:`, error);
        
        // Error fallback
        const skillsArray = Array.isArray(candidate.skills) ? candidate.skills : [];
        setScore({
          skills: Math.min(Math.round((skillsArray.length / 10) * 100), 100),
          experience: candidate.years_experience ? Math.min(candidate.years_experience * 10, 100) : 0,
          education: 50,
          profileCompleteness: candidate.profile_completeness || 0,
          overall: candidate.score || 50,
          details: {
            skillsCount: skillsArray.length,
            experienceYears: candidate.years_experience || 0,
            educationLevel: 'Non spécifié',
            completenessPercentage: candidate.profile_completeness || 0
          },
          isJobSpecific: !!activeJobOfferId,
          matchContext: 'Erreur de chargement'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadScore();
  }, [candidate.id, activeJobOfferId, activeJobOfferTitle]);

  return {
    score,
    isLoading,
    isJobSpecific: !!activeJobOfferId
  };
};
