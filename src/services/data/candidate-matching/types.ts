
/**
 * Types for candidate matching functionality
 */

export type SkillsMatchDetails = {
  matched: string[];
  missing: string[];
  additional: string[];
  matchPercentage: number;
};

export type ExperienceLevelMatch = {
  required: number;
  candidate: number;
  match: boolean;
  score?: number;
};

export type LocationMatch = {
  required: string;
  candidate: string;
  match: boolean;
  score?: number;
};

export type EducationLevelMatch = {
  required: string;
  candidate: string;
  match: boolean;
  score?: number;
};

export type MatchDetails = {
  skills: SkillsMatchDetails;
  experienceLevel: ExperienceLevelMatch;
  location: LocationMatch;
  educationLevel: EducationLevelMatch;
  overall: number;
};

export type CandidateJobMatch = {
  score: number;
  details: MatchDetails;
};

export type CandidateMatch = {
  candidateId: string;
  firstName: string;
  lastName: string;
  position: string;
  company: string;
  score: number;
  details: MatchDetails;
};

export type JobMatchWeight = {
  skills: number;
  experience: number;
  location: number;
  education: number;
};
