
import { supabase } from '@/integrations/supabase/client';
import type { JobOffer } from './job-offers/types';
import type { CandidateData } from './candidateService';
import { semanticMatchingService } from '../semantic/semanticMatchingService';
import { ensureArray } from '@/utils/candidateUtils';

// Define types for matching
export interface SkillsDetails {
  matched: string[];
  missing: string[];
  additional: string[];
  matchPercentage: number;
}

export interface MatchDetails {
  skills: SkillsDetails;
  experienceLevel: {
    required: number;
    candidate: number;
    match: boolean;
  };
  location: {
    required: string;
    candidate: string;
    match: boolean;
  };
  educationLevel: {
    required: string;
    candidate: string;
    match: boolean;
  };
  overall: number;
}

export interface CandidateMatch {
  candidateId: string;
  firstName: string;
  lastName: string;
  position?: string;
  company?: string;
  score: number;
  details?: MatchDetails;
}

export interface CandidateJobMatch {
  score: number;
  details: MatchDetails;
}

export interface JobOfferSuggestion {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  details?: MatchDetails;
  description?: string;
  requiredSkills?: string[];
  softSkills?: string[];
  toolsAndTechnologies?: string[];
  education?: string;
  experience?: {
    min: number;
    max: number;
  };
  contractType?: string;
  remotePreference?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  location?: string;
}

// Job offer matching service
export const candidateMatchingService = {
  // Storage for active job offer
  _activeJobOfferId: null as string | null,
  
  // Set the active job offer for the session
  setActiveJobOffer: async (jobOfferId: string | null): Promise<boolean> => {
    try {
      if (jobOfferId) {
        const { data: jobOffer, error } = await supabase
          .from('job_offers')
          .select('*')
          .eq('id', jobOfferId)
          .single();
          
        if (error || !jobOffer) {
          console.error('Error fetching job offer:', error);
          throw new Error('Job offer not found');
        }
      }
      
      candidateMatchingService._activeJobOfferId = jobOfferId;
      return true;
    } catch (error) {
      console.error('Error setting active job offer:', error);
      return false;
    }
  },
  
  // Get the active job offer ID
  getActiveJobOfferId: (): string | null => {
    return candidateMatchingService._activeJobOfferId;
  },
  
  // Calculate the match score and details for a candidate against the active job offer
  calculateCandidateActiveJobScore: async (candidate: CandidateData): Promise<CandidateJobMatch> => {
    try {
      console.log('Calculating active job score for candidate:', candidate.id);
      const jobOfferId = candidateMatchingService._activeJobOfferId;
      
      if (!jobOfferId) {
        console.log('No active job offer, returning standard candidate score');
        return {
          score: candidate.score || 0,
          details: {
            skills: {
              matched: [],
              missing: [],
              additional: [],
              matchPercentage: 0
            },
            experienceLevel: {
              required: 0,
              candidate: candidate.years_experience || 0,
              match: false
            },
            location: {
              required: '',
              candidate: candidate.location || '',
              match: false
            },
            educationLevel: {
              required: '',
              candidate: '',
              match: false
            },
            overall: candidate.score || 0
          }
        };
      }
      
      // Fetch the job offer
      const { data: jobOffer, error: jobOfferError } = await supabase
        .from('job_offers')
        .select('*')
        .eq('id', jobOfferId)
        .single();
        
      if (jobOfferError || !jobOffer) {
        console.error('Error fetching job offer:', jobOfferError);
        throw new Error('Job offer not found');
      }
      
      // Calculate match details between the candidate and job offer
      return await candidateMatchingService.getCandidateJobMatch(candidate, jobOffer);
    } catch (error) {
      console.error('Error calculating candidate active job score:', error);
      return {
        score: candidate.score || 0,
        details: {
          skills: {
            matched: [],
            missing: [],
            additional: [],
            matchPercentage: 0
          },
          experienceLevel: {
            required: 0,
            candidate: 0,
            match: false
          },
          location: {
            required: '',
            candidate: '',
            match: false
          },
          educationLevel: {
            required: '',
            candidate: '',
            match: false
          },
          overall: candidate.score || 0
        }
      };
    }
  },
  
  // Calculate match score between a candidate and a job offer
  getCandidateJobMatch: async (candidate: CandidateData, jobOffer: JobOffer): Promise<CandidateJobMatch> => {
    try {
      console.log('Calculating match between candidate and job offer:', 
        candidate.id, jobOffer.id);
      
      // Extract skills
      const candidateSkills = ensureArray<string>(candidate.skills)
        .map(s => typeof s === 'string' ? s.toLowerCase() : '');
        
      const jobSkills = ensureArray<string>(jobOffer.required_skills)
        .map(s => typeof s === 'string' ? s.toLowerCase() : '');
      
      // Match skills
      const matchedSkills = candidateSkills.filter(skill => 
        jobSkills.some(jobSkill => {
          // Direct match
          if (jobSkill === skill) return true;
          
          // Partial match with job skill containing candidate skill or vice versa
          if (jobSkill.includes(skill) || skill.includes(jobSkill)) return true;
          
          // Try semantic matching for complex matches
          return semanticMatchingService.isSemanticMatch({
            query: jobSkill,
            candidateText: skill
          });
        })
      );
      
      const missingSkills = jobSkills.filter(skill => 
        !matchedSkills.some(matched => 
          matched === skill || 
          matched.includes(skill) || 
          skill.includes(matched)
        )
      );
      
      const additionalSkills = candidateSkills.filter(skill => 
        !jobSkills.some(jobSkill => 
          jobSkill === skill || 
          jobSkill.includes(skill) || 
          skill.includes(jobSkill)
        )
      );
      
      const skillMatchPercentage = jobSkills.length > 0
        ? (matchedSkills.length / jobSkills.length) * 100
        : 0;
      
      // Match experience
      const experienceMatch = {
        required: jobOffer.experience_years_min || 0,
        candidate: candidate.years_experience || 0,
        match: (candidate.years_experience || 0) >= (jobOffer.experience_years_min || 0)
      };
      
      // Match location
      const locationMatch = {
        required: jobOffer.location || '',
        candidate: candidate.location || '',
        match: false
      };
      
      if (jobOffer.location && candidate.location) {
        // Direct match
        if (jobOffer.location.toLowerCase() === candidate.location.toLowerCase()) {
          locationMatch.match = true;
        } else {
          // Check if locations contain each other (e.g., "Paris" in "Paris, France")
          locationMatch.match = 
            jobOffer.location.toLowerCase().includes(candidate.location.toLowerCase()) ||
            candidate.location.toLowerCase().includes(jobOffer.location.toLowerCase());
        }
      }
      
      // Match education level
      const educationMatch = {
        required: jobOffer.education_level || '',
        candidate: '',
        match: false
      };
      
      const candidateEducation = ensureArray(candidate.education);
      
      if (candidateEducation.length > 0) {
        // Extract highest education level from candidate
        const candidateEduString = candidateEducation.map(edu => {
          if (typeof edu === 'string') return edu;
          return edu.degree || edu.diploma || '';
        }).join(' ');
        
        educationMatch.candidate = candidateEduString;
        
        if (jobOffer.education_level) {
          educationMatch.match = candidateEduString.toLowerCase().includes(
            jobOffer.education_level.toLowerCase()
          );
        }
      }
      
      // Calculate overall match score (weighted)
      const skillsWeight = 0.5;
      const experienceWeight = 0.3;
      const locationWeight = 0.1;
      const educationWeight = 0.1;
      
      const overallScore = Math.round(
        (skillMatchPercentage * skillsWeight) +
        (experienceMatch.match ? 100 : Math.min(100, (candidate.years_experience || 0) / (jobOffer.experience_years_min || 1) * 100)) * experienceWeight +
        (locationMatch.match ? 100 : 0) * locationWeight +
        (educationMatch.match ? 100 : 0) * educationWeight
      );
      
      return {
        score: overallScore,
        details: {
          skills: {
            matched: matchedSkills,
            missing: missingSkills,
            additional: additionalSkills,
            matchPercentage: skillMatchPercentage
          },
          experienceLevel: experienceMatch,
          location: locationMatch,
          educationLevel: educationMatch,
          overall: overallScore
        }
      };
    } catch (error) {
      console.error('Error calculating job match:', error);
      return {
        score: 0,
        details: {
          skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
          experienceLevel: { required: 0, candidate: 0, match: false },
          location: { required: '', candidate: '', match: false },
          educationLevel: { required: '', candidate: '', match: false },
          overall: 0
        }
      };
    }
  },
  
  // Calculate match scores for all candidates against a job offer
  calculateMatchesForJobOffer: async (jobOfferId: string): Promise<CandidateMatch[]> => {
    try {
      console.log('Calculating matches for job offer:', jobOfferId);
      
      // Fetch all candidates
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*');
        
      if (candidatesError) {
        console.error('Error fetching candidates:', candidatesError);
        throw candidatesError;
      }
      
      if (!candidates || candidates.length === 0) {
        return [];
      }
      
      // Fetch the job offer
      const { data: jobOffer, error: jobOfferError } = await supabase
        .from('job_offers')
        .select('*')
        .eq('id', jobOfferId)
        .single();
        
      if (jobOfferError || !jobOffer) {
        console.error('Error fetching job offer:', jobOfferError);
        throw new Error('Job offer not found');
      }
      
      // Calculate match scores for each candidate
      const matches: CandidateMatch[] = [];
      
      for (const candidate of candidates) {
        const match = await candidateMatchingService.getCandidateJobMatch(candidate, jobOffer);
        
        matches.push({
          candidateId: candidate.id,
          firstName: candidate.first_name,
          lastName: candidate.last_name,
          position: candidate.position,
          company: candidate.company,
          score: match.score,
          details: match.details
        });
      }
      
      // Sort by score (descending)
      matches.sort((a, b) => b.score - a.score);
      
      return matches;
    } catch (error) {
      console.error('Error calculating matches for job offer:', error);
      return [];
    }
  },
  
  // Get top candidates for a job offer
  getTopCandidatesForJobOffer: async (jobOfferId: string, limit: number = 5): Promise<CandidateMatch[]> => {
    try {
      const matches = await candidateMatchingService.calculateMatchesForJobOffer(jobOfferId);
      return matches.slice(0, limit);
    } catch (error) {
      console.error('Error getting top candidates:', error);
      return [];
    }
  },
  
  // Get all matches for a job offer with details
  getMatchesForJobOffer: async (jobOfferId: string): Promise<CandidateMatch[]> => {
    try {
      return await candidateMatchingService.calculateMatchesForJobOffer(jobOfferId);
    } catch (error) {
      console.error('Error getting matches for job offer:', error);
      return [];
    }
  },
  
  // Generate job offer suggestions for a candidate
  generateJobOfferSuggestions: async (
    jobTitle: string, 
    location?: string, 
    freeformText?: string
  ): Promise<JobOfferSuggestion> => {
    try {
      console.log('Generating job suggestions with:', { jobTitle, location, freeformText: freeformText?.substring(0, 100) + "..." });
      
      // Here we would normally communicate with an API or backend service
      // For now, we'll return a mock suggestion
      
      return {
        id: "suggestion-1",
        title: jobTitle,
        company: "Company Name",
        location: location || "Paris, France",
        matchScore: 85,
        description: freeformText || `Description for ${jobTitle}`,
        requiredSkills: ["JavaScript", "React", "TypeScript", "Node.js", "Git"],
        softSkills: ["Communication", "Teamwork", "Problem Solving"],
        toolsAndTechnologies: ["VS Code", "GitHub", "Docker"],
        education: "Bac+5",
        experience: {
          min: 2,
          max: 5
        },
        contractType: "CDI",
        remotePreference: "Hybride",
        salary: {
          min: 45000,
          max: 60000,
          currency: "EUR"
        }
      };
    } catch (error) {
      console.error('Error generating job offer suggestions:', error);
      throw error;
    }
  }
};
