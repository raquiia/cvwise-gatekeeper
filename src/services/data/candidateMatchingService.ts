
// Full implementation of candidate matching service with job offer suggestions
import { supabase } from '@/integrations/supabase/client';

export interface Experience {
  min?: number;
  max?: number;
}

export interface Salary {
  min?: number;
  max?: number;
  currency?: string;
}

export interface JobOfferSuggestion {
  title?: string;
  location?: string;
  description?: string;
  requiredSkills?: string[];
  softSkills?: string[];
  toolsAndTechnologies?: string[];
  education?: string;
  experience?: Experience;
  contractType?: string;
  remotePreference?: string;
  salary?: Salary;
}

// These interfaces were previously exported and are needed by other parts of the application
export interface SkillsDetails {
  matchedSkills: string[];
  missingSkills: string[];
  additionalSkills: string[];
  skillsScore: number;
}

export interface MatchDetails {
  skills_details?: SkillsDetails;
  experience_details?: any;
  education_details?: any;
  location_details?: any;
}

export interface CandidateJobMatch {
  candidate_id: string;
  job_offer_id: string;
  match_score: number;
  skills_match_score: number;
  experience_match_score: number;
  education_match_score: number;
  location_match_score: number;
  match_details?: MatchDetails;
  created_at?: string;
  updated_at?: string;
}

export interface CandidateMatch {
  candidate: any;
  match: CandidateJobMatch;
}

// Full service that includes both job offer suggestions and candidate matching functionality
export const candidateMatchingService = {
  // Generate job offer suggestions using the Edge Function
  async generateJobOfferSuggestions(
    jobTitle: string,
    location?: string,
    freeformText?: string
  ): Promise<JobOfferSuggestion> {
    try {
      console.log("Generating suggestions for job offer:", jobTitle, location);
      console.log("Freeform text provided:", freeformText ? "Yes" : "No");
      
      if (freeformText) {
        console.log("Analyzing freeform text...");
      }
      
      const { data, error } = await supabase.functions.invoke('job-offer-suggestions', {
        body: {
          jobTitle,
          location,
          freeformText
        }
      });
      
      if (error) {
        console.error("Error calling job-offer-suggestions function:", error);
        throw new Error(error.message || "Failed to generate suggestions");
      }
      
      if (!data.success) {
        throw new Error(data.message || "Failed to generate suggestions");
      }
      
      return data.data as JobOfferSuggestion;
    } catch (error: any) {
      console.error("Error generating suggestions:", error);
      throw error;
    }
  },

  // Calculate matches for a job offer (previously existing function)
  async calculateMatchesForJobOffer(jobOfferId: string): Promise<boolean> {
    try {
      console.log(`Calculating matches for job offer ID: ${jobOfferId}`);
      
      const { data, error } = await supabase.functions.invoke('calculate-job-matches', {
        body: { jobOfferId }
      });
      
      if (error) {
        console.error("Error calculating matches:", error);
        throw new Error(error.message || "Failed to calculate matches");
      }
      
      return true;
    } catch (error: any) {
      console.error("Error calculating matches:", error);
      return false;
    }
  },
  
  // Get a specific candidate-job match (previously existing function)
  async getCandidateJobMatch(candidateId: string, jobOfferId: string): Promise<CandidateJobMatch | null> {
    try {
      console.log(`Getting match for candidate ${candidateId} and job offer ${jobOfferId}`);
      
      const { data, error } = await supabase.rpc('get_candidate_job_match', {
        p_candidate_id: candidateId,
        p_job_offer_id: jobOfferId
      });
      
      if (error) throw error;
      
      return data as CandidateJobMatch;
    } catch (error: any) {
      console.error("Error fetching candidate-job match:", error);
      return null;
    }
  },
  
  // Get all matches for a job offer (previously existing function)
  async getMatchesForJobOffer(jobOfferId: string): Promise<CandidateMatch[]> {
    try {
      console.log(`Getting matches for job offer ID: ${jobOfferId}`);
      
      const { data, error } = await supabase.rpc('get_matches_for_job_offer', {
        p_job_offer_id: jobOfferId
      });
      
      if (error) throw error;
      
      return data as CandidateMatch[];
    } catch (error: any) {
      console.error("Error fetching matches for job offer:", error);
      return [];
    }
  },
  
  // Get top candidates for a job offer (previously existing function)
  async getTopCandidatesForJobOffer(jobOfferId: string, limit: number = 5): Promise<CandidateMatch[]> {
    try {
      const matches = await this.getMatchesForJobOffer(jobOfferId);
      
      // Sort by match score and take the top 'limit' matches
      return matches
        .sort((a, b) => b.match.match_score - a.match.match_score)
        .slice(0, limit);
    } catch (error: any) {
      console.error("Error fetching top candidates:", error);
      return [];
    }
  }
};
