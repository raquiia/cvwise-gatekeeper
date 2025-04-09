// Full implementation of candidate matching service with job offer suggestions
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { generateMockMatches } from './mocks/candidateMatchMocks';
import { Json } from '@/integrations/supabase/types';
import { calculateOverallMatch, MatchResult } from '@/services/analysis/matchingUtils';

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
  skillsMatch: number;
  experienceMatch: number;
  otherFactorsMatch: number;
  matchedSkills: string[];
  missingSkills: string[];
  // Add the skills_details property to match what's being used in the code
  skills_details?: SkillsDetails;
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

// Track currently active job offer (for context-based scoring)
let activeJobOfferId: string | null = null;
let activeJobOffer: any = null;

// Helper function to safely convert Json to MatchDetails
const convertJsonToMatchDetails = (jsonData: Json | null): MatchDetails | undefined => {
  if (!jsonData) return undefined;
  
  try {
    // If jsonData is already an object, use it directly
    const details = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    // Ensure we return an object that conforms to the MatchDetails interface
    const matchDetails: MatchDetails = {
      skillsMatch: details.skillsMatch || 0,
      experienceMatch: details.experienceMatch || 0,
      otherFactorsMatch: details.otherFactorsMatch || 0,
      matchedSkills: Array.isArray(details.matchedSkills) ? details.matchedSkills : [],
      missingSkills: Array.isArray(details.missingSkills) ? details.missingSkills : [],
    };
    
    // Only add skills_details if it exists in the JSON
    if (details.skills_details) {
      matchDetails.skills_details = {
        matchedSkills: Array.isArray(details.skills_details.matchedSkills) 
          ? details.skills_details.matchedSkills 
          : [],
        missingSkills: Array.isArray(details.skills_details.missingSkills) 
          ? details.skills_details.missingSkills 
          : [],
        additionalSkills: Array.isArray(details.skills_details.additionalSkills) 
          ? details.skills_details.additionalSkills 
          : [],
        skillsScore: typeof details.skills_details.skillsScore === 'number' 
          ? details.skills_details.skillsScore 
          : 0
      };
    }
    
    return matchDetails;
  } catch (error) {
    console.error("Error converting JSON to MatchDetails:", error);
    // Return a valid default MatchDetails object instead of undefined
    return {
      skillsMatch: 0,
      experienceMatch: 0,
      otherFactorsMatch: 0,
      matchedSkills: [],
      missingSkills: []
    };
  }
};

// Full service that includes both job offer suggestions and candidate matching functionality
export const candidateMatchingService = {
  // Get currently active job offer ID
  getActiveJobOfferId: () => activeJobOfferId,
  
  // Set active job offer (which will be used for candidate scoring)
  setActiveJobOffer: async (jobOfferId: string | null) => {
    activeJobOfferId = jobOfferId;
    
    if (jobOfferId) {
      try {
        // Fetch the job offer details
        const { data, error } = await supabase
          .from('job_offers')
          .select('*')
          .eq('id', jobOfferId)
          .single();
          
        if (error) throw error;
        
        activeJobOffer = data;
        
        console.log("Active job offer set:", activeJobOffer.title);
        return true;
      } catch (error) {
        console.error("Error setting active job offer:", error);
        activeJobOffer = null;
        return false;
      }
    } else {
      activeJobOffer = null;
      return true;
    }
  },
  
  // Calculate a candidate's match score against the active job offer
  calculateCandidateActiveJobScore: async (candidate: any): Promise<MatchResult> => {
    if (!activeJobOffer || !candidate) {
      // Return default score when no active job offer or candidate
      return { 
        score: candidate?.score || 0, 
        details: {
          skillsMatch: 0,
          experienceMatch: 0,
          otherFactorsMatch: 0,
          matchedSkills: [],
          missingSkills: []
        } 
      };
    }
    
    try {
      // Debug logs to track calculation inputs
      console.log("Calculating match for candidate:", candidate.first_name, candidate.last_name);
      console.log("Against job offer:", activeJobOffer.title);
      console.log("Candidate skills:", candidate.skills);
      console.log("Job required skills:", activeJobOffer.required_skills);
      
      // Use the matching utility function
      const matchResult = calculateOverallMatch(candidate, activeJobOffer);
      
      // Debug the result
      console.log("Match result:", matchResult);
      
      return matchResult;
    } catch (error) {
      console.error("Error calculating active job score:", error);
      return { 
        score: 0, 
        details: {
          skillsMatch: 0,
          experienceMatch: 0,
          otherFactorsMatch: 0,
          matchedSkills: [],
          missingSkills: []
        } 
      };
    }
  },
  
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
      
      // Option 1: Use the Edge Function (if available)
      try {
        const { data, error } = await supabase.functions.invoke('calculate-job-matches', {
          body: { jobOfferId }
        });
        
        if (error) {
          console.error("Error calling calculate-job-matches function:", error);
          throw error;
        }
        
        return true;
      } catch (edgeFunctionError) {
        console.error("Error with Edge Function:", edgeFunctionError);
        
        // Option 2: Fallback to using the database function directly
        try {
          const { data, error } = await supabase.rpc('calculate_all_candidates_job_matches', {
            p_job_offer_id: jobOfferId
          });
          
          if (error) {
            console.error("Error calling RPC function:", error);
            throw error;
          }
          
          return true;
        } catch (rpcError) {
          console.error("Error with RPC function:", rpcError);
          
          // If both methods fail, display a message to the user
          toast({
            title: "Problème de calcul des correspondances",
            description: "Le système n'a pas pu calculer les correspondances. Veuillez réessayer plus tard.",
            variant: "destructive",
          });
          
          return false;
        }
      }
    } catch (error: any) {
      console.error("Error calculating matches:", error);
      return false;
    }
  },
  
  // Get a specific candidate-job match (previously existing function)
  async getCandidateJobMatch(candidateId: string, jobOfferId: string): Promise<CandidateJobMatch | null> {
    try {
      console.log(`Getting match for candidate ${candidateId} and job offer ${jobOfferId}`);
      
      // Using direct query instead of RPC since the function doesn't exist
      const { data, error } = await supabase
        .from('candidate_job_matches')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('job_offer_id', jobOfferId)
        .single();
      
      if (error) throw error;
      
      // Convert the raw database result to CandidateJobMatch type
      if (data) {
        const matchDetails = convertJsonToMatchDetails(data.match_details);
        
        // Cast as unknown first, then to CandidateJobMatch
        const typedMatch: CandidateJobMatch = {
          candidate_id: data.candidate_id,
          job_offer_id: data.job_offer_id,
          match_score: data.match_score || 0,
          skills_match_score: data.skills_match_score || 0,
          experience_match_score: data.experience_match_score || 0,
          education_match_score: data.education_match_score || 0,
          location_match_score: data.location_match_score || 0,
          match_details: matchDetails,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        
        return typedMatch;
      }
      
      return null;
    } catch (error: any) {
      console.error("Error fetching candidate-job match:", error);
      return null;
    }
  },
  
  // Get all matches for a job offer with a fixed query that avoids recursive issues
  async getMatchesForJobOffer(jobOfferId: string): Promise<CandidateMatch[]> {
    try {
      console.log(`Getting matches for job offer ID: ${jobOfferId}`);
      
      // Step 1: Get all matches for the job offer
      const { data: matchesData, error: matchesError } = await supabase
        .from('candidate_job_matches')
        .select('*')
        .eq('job_offer_id', jobOfferId);
      
      if (matchesError) {
        console.error("Error fetching matches:", matchesError);
        throw matchesError;
      }
      
      if (!matchesData || matchesData.length === 0) {
        console.log("No matches found in database");
        return [];
      }
      
      // Step 2: Get candidate details separately to avoid recursion issues
      const candidateIds = matchesData.map(match => match.candidate_id);
      
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .in('id', candidateIds);
      
      if (candidatesError) {
        console.error("Error fetching candidates:", candidatesError);
        throw candidatesError;
      }
      
      // Step 3: Combine the data, ensuring proper type conversion
      const combinedData: CandidateMatch[] = matchesData.map(match => {
        const candidate = candidatesData.find(c => c.id === match.candidate_id) || null;
        
        // Convert match_details from Json to MatchDetails using our helper function
        const matchDetails = convertJsonToMatchDetails(match.match_details);
        
        // Fix TypeScript error by explicitly constructing a CandidateJobMatch object
        const typedMatch: CandidateJobMatch = {
          candidate_id: match.candidate_id,
          job_offer_id: match.job_offer_id,
          match_score: match.match_score || 0,
          skills_match_score: match.skills_match_score || 0,
          experience_match_score: match.experience_match_score || 0,
          education_match_score: match.education_match_score || 0,
          location_match_score: match.location_match_score || 0,
          match_details: matchDetails,
          created_at: match.created_at,
          updated_at: match.updated_at
        };
        
        return {
          candidate,
          match: typedMatch
        };
      }).filter(item => item.candidate !== null);
      
      return combinedData;
    } catch (error: any) {
      console.error("Error fetching matches for job offer:", error);
      toast({
        title: "Erreur de récupération des correspondances",
        description: "Une erreur s'est produite lors de la récupération des correspondances.",
        variant: "destructive",
      });
      
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
  },
  
  // Modifier le flag pour indiquer que nous n'utilisons pas de données fictives
  usingMockData: false
};
