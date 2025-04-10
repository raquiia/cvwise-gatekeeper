
import type { CandidateData } from '../candidateService';
import type { JobOffer } from '../job-offers/types';
import type { CandidateMatch, MatchDetails, SkillsDetails } from '../candidate-matching/types';

// Mock candidate data for testing
export const mockCandidates: CandidateData[] = [
  {
    id: 'c1',
    user_id: 'user1',
    first_name: 'John',
    last_name: 'Doe',
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
    years_experience: 5,
    location: 'Paris, France',
    position: 'Senior Frontend Developer',
    company: 'Tech Corp',
    score: 85
  },
  {
    id: 'c2',
    user_id: 'user1',
    first_name: 'Jane',
    last_name: 'Smith',
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
    years_experience: 3,
    location: 'Lyon, France',
    position: 'Backend Developer',
    company: 'Data Systems',
    score: 78
  },
  {
    id: 'c3',
    user_id: 'user1',
    first_name: 'Alex',
    last_name: 'Johnson',
    skills: ['Java', 'Spring Boot', 'Hibernate', 'MySQL'],
    years_experience: 8,
    location: 'Bordeaux, France',
    position: 'Lead Developer',
    company: 'Enterprise Solutions',
    score: 92
  }
];

// Mock job offer for testing
export const mockJobOffer: JobOffer = {
  id: 'j1',
  user_id: 'user1',
  title: 'Full Stack Developer',
  company: 'Innovative Tech',
  location: 'Paris, France',
  description: 'We are looking for a Full Stack Developer...',
  contract_type: 'CDI',
  remote_preference: 'Hybrid',
  experience_years_min: 3,
  experience_years_max: 7,
  education_level: 'Master',
  required_skills: ['JavaScript', 'React', 'Node.js', 'API Development'],
  salary_min: 45000,
  salary_max: 65000,
  salary_currency: 'EUR'
};

// Mock skills details for testing
export const mockSkillsDetails: SkillsDetails = {
  matched: ['JavaScript', 'React', 'Node.js'],
  missing: ['API Development'],
  additional: ['TypeScript'],
  matchPercentage: 75
};

// Mock match details for testing
export const mockMatchDetails: MatchDetails = {
  skills: {
    matched: ['JavaScript', 'React', 'Node.js'],
    missing: ['API Development'],
    additional: ['TypeScript'],
    matchPercentage: 75
  },
  experienceLevel: {
    required: 3,
    candidate: 5,
    match: true
  },
  location: {
    required: 'Paris, France',
    candidate: 'Paris, France',
    match: true
  },
  educationLevel: {
    required: 'Master',
    candidate: 'Master in Computer Science',
    match: true
  },
  overall: 85
};

// Mock candidate matches for testing
export const mockCandidateMatches: CandidateMatch[] = [
  {
    // Required CandidateMatch properties
    id: 'match-c1-j1',
    candidate_id: 'c1',
    job_offer_id: 'j1',
    match_score: 85,
    match_details: mockMatchDetails,
    
    // Frontend compatibility properties
    candidateId: 'c1',
    firstName: 'John',
    lastName: 'Doe',
    position: 'Senior Frontend Developer',
    company: 'Tech Corp',
    score: 85,
    details: mockMatchDetails
  },
  {
    // Required CandidateMatch properties
    id: 'match-c2-j1',
    candidate_id: 'c2',
    job_offer_id: 'j1',
    match_score: 65,
    match_details: {
      matched_skills: ['JavaScript'],
      missing_skills: ['React', 'Node.js', 'API Development'],
    },
    
    // Frontend compatibility properties
    candidateId: 'c2',
    firstName: 'Jane',
    lastName: 'Smith',
    position: 'Backend Developer',
    company: 'Data Systems',
    score: 65,
    details: {
      skills: {
        matched: ['JavaScript'],
        missing: ['React', 'Node.js', 'API Development'],
        additional: ['Python', 'Django', 'PostgreSQL', 'Docker'],
        matchPercentage: 25
      },
      experienceLevel: {
        required: 3,
        candidate: 3,
        match: true
      },
      location: {
        required: 'Paris, France',
        candidate: 'Lyon, France',
        match: false
      },
      educationLevel: {
        required: 'Master',
        candidate: 'Bachelor in Computer Science',
        match: false
      },
      overall: 65
    }
  },
  {
    // Required CandidateMatch properties
    id: 'match-c3-j1',
    candidate_id: 'c3',
    job_offer_id: 'j1',
    match_score: 55,
    match_details: {
      matched_skills: [],
      missing_skills: ['JavaScript', 'React', 'Node.js', 'API Development'],
    },
    
    // Frontend compatibility properties
    candidateId: 'c3',
    firstName: 'Alex',
    lastName: 'Johnson',
    position: 'Lead Developer',
    company: 'Enterprise Solutions',
    score: 55,
    details: {
      skills: {
        matched: [],
        missing: ['JavaScript', 'React', 'Node.js', 'API Development'],
        additional: ['Java', 'Spring Boot', 'Hibernate', 'MySQL'],
        matchPercentage: 0
      },
      experienceLevel: {
        required: 3,
        candidate: 8,
        match: true
      },
      location: {
        required: 'Paris, France',
        candidate: 'Bordeaux, France',
        match: false
      },
      educationLevel: {
        required: 'Master',
        candidate: 'PhD in Computer Science',
        match: true
      },
      overall: 55
    }
  }
];
