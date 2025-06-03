
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
          console.log(`Loading job score for candidate ${candidate.id} and job ${activeJobOfferId}`);
          scoreDetails = await persistentScoringService.getCandidateJobScore(candidate.id, activeJobOfferId);
          
          if (scoreDetails) {
            setScore({
              ...scoreDetails,
              isJobSpecific: true,
              matchContext: activeJobOfferTitle ? `Score pour "${activeJobOfferTitle}"` : 'Score pour l\'offre sélectionnée'
            });
          } else {
            // Calculate and store job score if it doesn't exist
            console.log(`No job score found, calculating for candidate ${candidate.id}`);
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
          // Get general score from database first
          console.log(`Loading general score for candidate ${candidate.id}`);
          scoreDetails = await persistentScoringService.getCandidateGeneralScore(candidate.id);
          
          if (scoreDetails) {
            setScore({
              ...scoreDetails,
              isJobSpecific: false,
              matchContext: 'Score général de profil'
            });
          } else {
            // Recalculate general score if it doesn't exist
            console.log(`No general score found, recalculating for candidate ${candidate.id}`);
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
        
        // Fallback if no score could be retrieved
        if (!scoreDetails) {
          console.warn(`Could not load score for candidate ${candidate.id}, using fallback`);
          setScore({
            skills: 0,
            experience: 0,
            education: 0,
            profileCompleteness: 0,
            overall: 0,
            details: {
              skillsCount: Array.isArray(candidate.skills) ? candidate.skills.length : 0,
              experienceYears: candidate.years_experience || 0,
              educationLevel: 'Non spécifié',
              completenessPercentage: 0
            },
            isJobSpecific: !!activeJobOfferId,
            matchContext: 'Score indisponible'
          });
        }
      } catch (error) {
        console.error(`Error loading score for candidate ${candidate.id}:`, error);
        // Fallback score in case of error
        setScore({
          skills: 0,
          experience: 0,
          education: 0,
          profileCompleteness: 0,
          overall: 0,
          details: {
            skillsCount: Array.isArray(candidate.skills) ? candidate.skills.length : 0,
            experienceYears: candidate.years_experience || 0,
            educationLevel: 'Non spécifié',
            completenessPercentage: 0
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
