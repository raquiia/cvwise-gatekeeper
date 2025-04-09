
// Full implementation of candidate matching service with job offer suggestions
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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

export interface SkillsDetails {
  matchedSkills: string[];
  missingSkills: string[];
  additionalSkills: string[];
  skillsScore: number;
}

// Add an index signature to make it compatible with Json type
export interface MatchDetails {
  skillsMatch: number;
  experienceMatch: number;
  otherFactorsMatch: number;
  matchedSkills: string[];
  missingSkills: string[];
  skills_details?: SkillsDetails;
  [key: string]: any; // This adds the index signature
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

let activeJobOfferId: string | null = null;
let activeJobOffer: any = null;

const convertJsonToMatchDetails = (jsonData: Json | null): MatchDetails | undefined => {
  if (!jsonData) return undefined;
  
  try {
    const details = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    const matchDetails: MatchDetails = {
      skillsMatch: details.skillsMatch || 0,
      experienceMatch: details.experienceMatch || 0,
      otherFactorsMatch: details.otherFactorsMatch || 0,
      matchedSkills: Array.isArray(details.matchedSkills) ? details.matchedSkills : [],
      missingSkills: Array.isArray(details.missingSkills) ? details.missingSkills : [],
    };
    
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
    return {
      skillsMatch: 0,
      experienceMatch: 0,
      otherFactorsMatch: 0,
      matchedSkills: [],
      missingSkills: []
    };
  }
};

export const candidateMatchingService = {
  getActiveJobOfferId: () => activeJobOfferId,
  
  setActiveJobOffer: async (jobOfferId: string | null) => {
    activeJobOfferId = jobOfferId;
    
    if (jobOfferId) {
      try {
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
  
  calculateCandidateActiveJobScore: async (candidate: any): Promise<MatchResult> => {
    if (!activeJobOffer || !candidate) {
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
      console.log("Calculating match for candidate:", candidate.first_name, candidate.last_name);
      console.log("Against job offer:", activeJobOffer.title);
      console.log("Candidate skills:", candidate.skills);
      console.log("Job required skills:", activeJobOffer.required_skills);
      
      const matchResult = calculateOverallMatch(candidate, activeJobOffer);
      
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
  
  async calculateMatchesForJobOffer(jobOfferId: string): Promise<boolean> {
    try {
      console.log(`Calculating matches for job offer ID: ${jobOfferId}`);
      
      // First attempt: Try the Edge Function
      try {
        const { data, error } = await supabase.functions.invoke('calculate-job-matches', {
          body: { jobOfferId }
        });
        
        if (error) {
          console.error("Error calling calculate-job-matches function:", error);
          throw error;
        }
        
        console.log("Successfully calculated matches using Edge Function");
        return true;
      } catch (edgeFunctionError) {
        console.error("Error with Edge Function, falling back to RPC:", edgeFunctionError);
        
        // Second attempt: Try the RPC function
        try {
          const { data, error } = await supabase.rpc('calculate_all_candidates_job_matches', {
            p_job_offer_id: jobOfferId
          });
          
          if (error) {
            console.error("Error calling RPC function:", error);
            throw error;
          }
          
          console.log("Successfully calculated matches using RPC function");
          return true;
        } catch (rpcError) {
          console.error("Error with RPC function, falling back to direct calculation:", rpcError);
          
          // Third attempt: Calculate matches directly in the database
          try {
            // Get the job offer
            const { data: jobOffer, error: jobOfferError } = await supabase
              .from('job_offers')
              .select('*')
              .eq('id', jobOfferId)
              .single();
            
            if (jobOfferError) throw jobOfferError;
            
            // Get all candidates for the current user
            const { data: candidates, error: candidatesError } = await supabase
              .from('candidates')
              .select('*');
              
            if (candidatesError) throw candidatesError;
            
            if (candidates && candidates.length > 0) {
              console.log(`Found ${candidates.length} candidates to match against job offer`);
              
              // For each candidate, calculate a match score and insert/update in the database
              for (const candidate of candidates) {
                const matchResult = calculateOverallMatch(candidate, jobOffer);
                
                // Convert MatchDetails to a proper Json object before inserting
                const matchDetailsJson = JSON.parse(JSON.stringify(matchResult.details)) as Json;
                
                // Insert or update the match in the database
                const { error: insertError } = await supabase
                  .from('candidate_job_matches')
                  .upsert({
                    candidate_id: candidate.id,
                    job_offer_id: jobOfferId,
                    match_score: matchResult.score,
                    skills_match_score: Math.round(matchResult.details.skillsMatch),
                    experience_match_score: Math.round(matchResult.details.experienceMatch),
                    education_match_score: 50, // Default value
                    location_match_score: 50, // Default value
                    match_details: matchDetailsJson
                  });
                  
                if (insertError) {
                  console.error(`Error inserting match for candidate ${candidate.id}:`, insertError);
                }
              }
              
              console.log("Successfully calculated matches directly");
              return true;
            } else {
              console.log("No candidates found to match against job offer");
              toast({
                title: "Aucun candidat trouvé",
                description: "Vous devez d'abord ajouter des candidats avant de pouvoir calculer des correspondances.",
                variant: "default",
              });
              return false;
            }
          } catch (directError) {
            console.error("Error with direct calculation:", directError);
            toast({
              title: "Problème de calcul des correspondances",
              description: "Le système n'a pas pu calculer les correspondances. Veuillez réessayer plus tard.",
              variant: "destructive",
            });
            return false;
          }
        }
      }
    } catch (error: any) {
      console.error("Error calculating matches:", error);
      return false;
    }
  },
  
  async getCandidateJobMatch(candidateId: string, jobOfferId: string): Promise<CandidateJobMatch | null> {
    try {
      console.log(`Getting match for candidate ${candidateId} and job offer ${jobOfferId}`);
      
      const { data, error } = await supabase
        .from('candidate_job_matches')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('job_offer_id', jobOfferId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const matchDetails = convertJsonToMatchDetails(data.match_details);
        
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
  
  async getMatchesForJobOffer(jobOfferId: string): Promise<CandidateMatch[]> {
    try {
      console.log(`Getting matches for job offer ID: ${jobOfferId}`);
      
      // Try to use the RPC function first to avoid recursion issues
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_matches_for_job_offer', {
          p_job_offer_id: jobOfferId
        });
        
        if (rpcError) {
          console.error("Error with RPC get_matches_for_job_offer:", rpcError);
          throw rpcError;
        }
        
        if (rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          console.log(`Found ${rpcData.length} matches using RPC function`);
          
          const typedMatches: CandidateMatch[] = rpcData.map((item: any) => {
            const match = item.match;
            const candidate = item.candidate;
            
            const matchDetails = convertJsonToMatchDetails(match.match_details);
            
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
          });
          
          return typedMatches;
        }
      } catch (rpcFunctionError) {
        console.error("Error with RPC function, trying direct query:", rpcFunctionError);
      }
      
      // Fall back to direct query if RPC function fails
      const { data: matchesData, error: matchesError } = await supabase
        .from('candidate_job_matches')
        .select(`
          *,
          candidate:candidates(*)
        `)
        .eq('job_offer_id', jobOfferId);
      
      if (matchesError) {
        console.error("Error with matches query:", matchesError);
        throw matchesError;
      }
      
      if (matchesData && Array.isArray(matchesData) && matchesData.length > 0) {
        console.log(`Found ${matchesData.length} matches using direct query`);
        
        const typedMatches: CandidateMatch[] = matchesData.map((item: any) => {
          const match = item;
          const candidate = item.candidate;
          
          // Convert match_details from Json to MatchDetails
          const matchDetails = convertJsonToMatchDetails(match.match_details);
          
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
        });
        
        return typedMatches;
      }
      
      // If no matches are found, try to calculate them
      console.log("No matches found, attempting to calculate them now");
      const calculationSuccess = await this.calculateMatchesForJobOffer(jobOfferId);
      console.log(`Match calculation ${calculationSuccess ? 'succeeded' : 'failed'}`);
      
      // Try fetching matches again after calculation
      const { data: recalculatedData, error: recalculatedError } = await supabase
        .from('candidate_job_matches')
        .select(`
          *,
          candidate:candidates(*)
        `)
        .eq('job_offer_id', jobOfferId);
      
      if (recalculatedError) {
        console.error("Error with recalculated matches query:", recalculatedError);
        throw recalculatedError;
      }
      
      if (recalculatedData && Array.isArray(recalculatedData) && recalculatedData.length > 0) {
        console.log(`Found ${recalculatedData.length} matches after recalculation`);
        
        const typedMatches: CandidateMatch[] = recalculatedData.map((item: any) => {
          const match = item;
          const candidate = item.candidate;
          
          // Convert match_details from Json to MatchDetails
          const matchDetails = convertJsonToMatchDetails(match.match_details);
          
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
        });
        
        return typedMatches;
      }
      
      // Still no matches? Let the user know
      console.log("No matches found for this job offer after calculation");
      toast({
        title: "Aucune correspondance trouvée",
        description: "Aucun candidat ne correspond à cette offre d'emploi. Essayez d'ajouter des candidats ou de modifier les critères de l'offre.",
        variant: "default",
      });
      
      return [];
    } catch (error: any) {
      console.error("Error fetching matches for job offer:", error);
      toast({
        title: "Erreur de récupération des correspondances",
        description: "Une erreur s'est produite lors de la récupération des correspondances. Veuillez réessayer.",
        variant: "destructive",
      });
      
      return [];
    }
  },
  
  async getTopCandidatesForJobOffer(jobOfferId: string, limit: number = 5): Promise<CandidateMatch[]> {
    try {
      const matches = await this.getMatchesForJobOffer(jobOfferId);
      
      return matches
        .sort((a, b) => b.match.match_score - a.match.match_score)
        .slice(0, limit);
    } catch (error: any) {
      console.error("Error fetching top candidates:", error);
      return [];
    }
  },
  
  usingMockData: false
};
