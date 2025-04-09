
import { candidateService } from './candidateService';
import { jobOfferService } from './jobOfferService';
import { candidateMatchingService } from './candidateMatchingService';
import type { JobOffer } from './jobOfferService';
import type { CandidateJobMatch } from './candidateMatchingService';

/**
 * Re-export all the services to maintain backward compatibility
 */
export const candidateDataService = {
  // Re-export candidate services
  getUserCandidates: candidateService.getUserCandidates,
  getCandidateById: candidateService.getCandidateById,
  deleteCandidate: candidateService.deleteCandidate,
  filterCandidates: candidateService.filterCandidates,
  
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
  getTopCandidatesForJobOffer: candidateMatchingService.getTopCandidatesForJobOffer
};

// Re-export types to maintain backward compatibility
export { JobOffer, CandidateJobMatch };
