
import { candidateService, CandidateData } from './candidateService';
import { jobOfferService } from './job-offers/jobOfferService';
import { candidateMatchingService } from './candidate-matching/candidateMatchingService';
import type { JobOffer } from './job-offers/types';
import type { 
  CandidateMatch, 
  JobOfferSuggestion,
  MatchDetails,
  SkillsMatchDetails
} from './candidate-matching/types';

/**
 * Re-export all the services to maintain backward compatibility
 */
export const candidateDataService = {
  // Re-export candidate services
  getUserCandidates: candidateService.getUserCandidates,
  getCandidateById: candidateService.getCandidateById,
  deleteCandidate: candidateService.deleteCandidate,
  
  // Re-export job offer services
  createJobOffer: jobOfferService.createJobOffer,
  updateJobOffer: jobOfferService.updateJobOffer,
  deleteJobOffer: jobOfferService.deleteJobOffer,
  getUserJobOffers: jobOfferService.getUserJobOffers,
  getJobOfferById: jobOfferService.getJobOfferById,
  
  // Re-export matching services
  calculateMatchesForJobOffer: candidateMatchingService.calculateMatchesForJobOffer,
  getCandidateJobMatch: candidateMatchingService.getCandidateJobMatch,
  getMatchesForJobOffer: candidateMatchingService.getMatchesForJobOffer,
  getTopCandidatesForJobOffer: candidateMatchingService.getTopCandidatesForJobOffer,
  generateJobOfferSuggestions: candidateMatchingService.generateJobOfferSuggestions
};

// Re-export types to maintain backward compatibility
export type { 
  CandidateData,
  JobOffer, 
  CandidateMatch,
  JobOfferSuggestion,
  MatchDetails,
  SkillsMatchDetails
};

// Create interface for backward compatibility
export interface CandidateJobMatch {
  score: number;
  details: MatchDetails;
}
