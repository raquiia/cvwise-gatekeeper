
import { useState, useEffect } from 'react';
import { candidateMatchingService } from '@/services/data/candidate-matching/candidateMatchingService';
import { calculateCandidateScore } from '@/services/scoring/candidateScoring';
import type { CandidateData } from '@/services/data/candidateService';
import type { ScoreBreakdown } from '@/services/scoring/candidateScoring';

export interface ContextualScore extends ScoreBreakdown {
  isJobSpecific: boolean;
  jobOfferTitle?: string;
  matchContext?: string;
}

export const useContextualScoring = () => {
  const [activeJobOfferId, setActiveJobOfferId] = useState<string | null>(null);
  const [activeJobOfferTitle, setActiveJobOfferTitle] = useState<string | null>(null);

  useEffect(() => {
    // Get the current active job offer
    const currentJobOfferId = candidateMatchingService.getActiveJobOfferId();
    setActiveJobOfferId(currentJobOfferId);
  }, []);

  const calculateContextualScore = async (candidate: CandidateData): Promise<ContextualScore> => {
    if (!activeJobOfferId) {
      // No active job offer - return general profile completeness score
      const generalScore = calculateCandidateScore(candidate);
      return {
        ...generalScore,
        isJobSpecific: false,
        matchContext: 'Score général de profil'
      };
    }

    try {
      // Calculate job-specific score
      const jobMatch = await candidateMatchingService.calculateCandidateActiveJobScore(candidate);
      
      return {
        skills: Math.round((jobMatch.details?.skills?.matchPercentage || 0)),
        experience: Math.round(jobMatch.details?.experienceLevel?.score || 0),
        education: Math.round(jobMatch.details?.educationLevel?.score || 0),
        profileCompleteness: calculateCandidateScore(candidate).profileCompleteness,
        overall: jobMatch.score,
        details: {
          skillsCount: jobMatch.details?.skills?.matched?.length || 0,
          experienceYears: jobMatch.details?.experienceLevel?.candidate || 0,
          educationLevel: jobMatch.details?.educationLevel?.candidate || 'Non spécifié',
          completenessPercentage: calculateCandidateScore(candidate).details.completenessPercentage
        },
        isJobSpecific: true,
        jobOfferTitle: activeJobOfferTitle,
        matchContext: activeJobOfferTitle ? `Score pour "${activeJobOfferTitle}"` : 'Score pour l\'offre sélectionnée'
      };
    } catch (error) {
      console.error('Error calculating job-specific score:', error);
      // Fallback to general score
      const generalScore = calculateCandidateScore(candidate);
      return {
        ...generalScore,
        isJobSpecific: false,
        matchContext: 'Score général de profil'
      };
    }
  };

  const updateActiveJobOffer = (jobOfferId: string | null, jobTitle?: string) => {
    setActiveJobOfferId(jobOfferId);
    setActiveJobOfferTitle(jobTitle || null);
  };

  return {
    activeJobOfferId,
    activeJobOfferTitle,
    calculateContextualScore,
    updateActiveJobOffer,
    isJobSpecific: !!activeJobOfferId
  };
};
