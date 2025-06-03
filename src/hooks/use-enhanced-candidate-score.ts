
import { useState, useEffect } from 'react';
import { useActiveJob } from '@/context/ActiveJobContext';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { calculateGeneralCandidateScore, calculateJobMatchScore, type ImprovedScoreBreakdown } from '@/services/scoring/improvedScoringService';
import { persistentScoringService } from '@/services/scoring/persistentScoringService';
import type { CandidateData } from '@/services/data/candidateService';

export interface EnhancedScoreResult {
  scoreBreakdown: ImprovedScoreBreakdown;
  isLoading: boolean;
  isJobSpecific: boolean;
  scoreSource: 'general' | 'job-specific' | 'calculated';
  canForceRecalculate: boolean;
  forceRecalculate: () => void;
}

export const useEnhancedCandidateScore = (candidate: CandidateData): EnhancedScoreResult => {
  const [scoreBreakdown, setScoreBreakdown] = useState<ImprovedScoreBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreSource, setScoreSource] = useState<'general' | 'job-specific' | 'calculated'>('general');
  const { activeJobOfferId, activeJobOfferTitle } = useActiveJob();

  const calculateScore = async (forceRecalculate = false) => {
    setIsLoading(true);
    
    try {
      if (activeJobOfferId && !forceRecalculate) {
        console.log(`Trying to get job-specific score for candidate ${candidate.id} and job ${activeJobOfferId}`);
        
        // Try to get existing job-specific score first
        const jobScoreDetails = await persistentScoringService.getCandidateJobScore(candidate.id!, activeJobOfferId);
        
        if (jobScoreDetails) {
          console.log('Found existing job-specific score:', jobScoreDetails.overall);
          const jobSpecificScore: ImprovedScoreBreakdown = {
            ...jobScoreDetails,
            isJobSpecific: true,
            matchContext: activeJobOfferTitle ? `Score pour "${activeJobOfferTitle}"` : 'Score pour l\'offre sélectionnée',
            details: {
              ...jobScoreDetails.details,
              skillsMatched: [],
              skillsMissing: [],
              experienceBreakdown: { 
                total: jobScoreDetails.details.experienceYears, 
                professional: jobScoreDetails.details.experienceYears, 
                internships: 0, 
                alternance: 0 
              },
              educationScore: jobScoreDetails.education,
              certifications: []
            }
          };
          setScoreBreakdown(jobSpecificScore);
          setScoreSource('job-specific');
          return;
        }
        
        console.log('No existing job-specific score found, trying to calculate...');
        
        // Try to calculate job-specific score
        try {
          const jobOffers = await jobOfferService.getUserJobOffers();
          const activeJobOffer = jobOffers.find(offer => offer.id === activeJobOfferId);
          
          if (activeJobOffer) {
            console.log('Calculating new job-specific score...');
            const matchScore = calculateJobMatchScore(candidate, activeJobOffer);
            setScoreBreakdown(matchScore);
            setScoreSource('calculated');
            
            // Try to store it in background (non-blocking)
            persistentScoringService.calculateAndStoreJobScore(candidate.id!, activeJobOfferId)
              .catch(error => console.warn('Failed to store job score:', error));
            
            return;
          }
        } catch (jobError) {
          console.warn('Failed to calculate job-specific score:', jobError);
        }
        
        console.log('Falling back to general score...');
      }
      
      // Fallback to general score
      let generalScoreDetails = await persistentScoringService.getCandidateGeneralScore(candidate.id!);
      
      if (!generalScoreDetails || forceRecalculate) {
        console.log('Calculating general score...');
        const generalScore = calculateGeneralCandidateScore(candidate);
        setScoreBreakdown(generalScore);
        setScoreSource('calculated');
        
        // Try to store it in background (non-blocking)
        if (candidate.id) {
          persistentScoringService.recalculateGeneralScore(candidate.id)
            .catch(error => console.warn('Failed to store general score:', error));
        }
      } else {
        console.log('Using existing general score:', generalScoreDetails.overall);
        const generalScore: ImprovedScoreBreakdown = {
          ...generalScoreDetails,
          isJobSpecific: false,
          matchContext: 'Score général de profil',
          details: {
            ...generalScoreDetails.details,
            skillsMatched: [],
            skillsMissing: [],
            experienceBreakdown: { 
              total: generalScoreDetails.details.experienceYears, 
              professional: generalScoreDetails.details.experienceYears, 
              internships: 0, 
              alternance: 0 
            },
            educationScore: generalScoreDetails.education,
            certifications: []
          }
        };
        setScoreBreakdown(generalScore);
        setScoreSource('general');
      }
      
    } catch (error) {
      console.error('Error calculating candidate score:', error);
      
      // Ultimate fallback: calculate a basic score
      const fallbackScore = calculateGeneralCandidateScore(candidate);
      setScoreBreakdown(fallbackScore);
      setScoreSource('calculated');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (candidate?.id) {
      calculateScore();
    }
  }, [candidate?.id, activeJobOfferId]);

  const forceRecalculate = () => {
    calculateScore(true);
  };

  return {
    scoreBreakdown: scoreBreakdown || {
      overall: 0,
      skills: 0,
      experience: 0,
      education: 0,
      profileCompleteness: 0,
      isJobSpecific: !!activeJobOfferId,
      details: {
        skillsMatched: [],
        skillsMissing: [],
        skillsCount: 0,
        experienceYears: 0,
        experienceBreakdown: { total: 0, professional: 0, internships: 0, alternance: 0 },
        educationLevel: 'Non spécifié',
        educationScore: 0,
        certifications: [],
        completenessPercentage: 0
      },
      matchContext: 'Calcul en cours...'
    },
    isLoading,
    isJobSpecific: !!activeJobOfferId,
    scoreSource,
    canForceRecalculate: !!candidate?.id,
    forceRecalculate
  };
};
