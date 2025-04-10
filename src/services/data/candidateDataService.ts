import { MatchDetails } from './candidate-matching/types';

/**
 * Interface for the result of a candidate-job matching operation
 */
export interface CandidateJobMatch {
  score: number;
  details: MatchDetails;
}

/**
 * Service for candidate data operations
 */
export const candidateDataService = {
  // Add any needed service methods here
};
