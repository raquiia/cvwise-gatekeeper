import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { calculateCandidateQualityScore } from '../analysis/matchingUtils';

export interface CandidateData {
  id: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  user_id: string;
  score?: number;
  skills?: string[];
  location?: string;
  company?: string;
  years_experience?: number;
  status?: string;
  updated_at?: string;
  resume_id?: string;
  experiences?: Json;
  education?: Json;
  languages?: Json;
  matchDetails?: any; // Add this property to support match details
}

export interface CandidateMinimal {
  id: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  user_id?: string;
  score?: number;
}

export interface CreateCandidateOptions {
  user_id: string;
  resume_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  location?: string;
  company?: string;
  years_experience?: number;
  skills?: string[];
  experiences?: Json;
  education?: Json;
  languages?: Json;
  score?: number;
}

export interface UpdateCandidateOptions {
  id: string;
  [key: string]: any;
}

/**
 * Service for candidate management operations
 */
export const candidateService = {
  /**
   * Get all candidates for the current user
   */
  async getUserCandidates(): Promise<CandidateData[]> {
    try {
      console.log("Fetching user candidates");
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Use the RPC function that avoids recursion
      const { data, error } = await supabase.rpc('get_user_candidates', {
        user_id_param: user.id
      });
      
      if (error) {
        console.error("Error fetching candidates:", error);
        throw error;
      }
      
      // Update candidate scores based on quality algorithm and ensure skills are properly formatted
      const candidatesWithUpdatedScores = (data || []).map((candidate: any) => {
        // Convert skills from JSON to array of strings if needed
        let skills = candidate.skills;
        if (skills) {
          if (typeof skills === 'string') {
            try {
              skills = JSON.parse(skills);
            } catch (e) {
              skills = [skills];
            }
          } else if (!Array.isArray(skills)) {
            // If it's an object but not an array, try to extract values
            skills = Object.values(skills).filter(Boolean).map(String);
          }
        } else {
          skills = [];
        }

        // Only recalculate if score is missing or null
        let score = candidate.score;
        if (score === null || score === undefined) {
          score = calculateCandidateQualityScore({
            ...candidate,
            skills
          });
        }
        
        return {
          ...candidate,
          skills,
          score,
          user_id: candidate.user_id || user.id // Ensure user_id is present
        } as CandidateData;
      });
      
      return candidatesWithUpdatedScores;
    } catch (error: any) {
      console.error("Error in getUserCandidates:", error.message);
      throw error;
    }
  },
  
  /**
   * Get a candidate by ID
   */
  async getCandidateById(candidateId: string): Promise<CandidateData> {
    try {
      console.log(`Fetching candidate with ID: ${candidateId}`);
      
      // Use the RPC function that avoids recursion
      const { data, error } = await supabase.rpc('get_candidate_by_id_bypassing_rls', {
        candidate_id_param: candidateId
      });
      
      if (error) {
        console.error("Error fetching candidate:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("Candidate not found");
      }
      
      // Process the data to ensure proper types
      let candidateData = data as any;
      
      // Normalize skills to be an array
      let skills = candidateData.skills;
      if (skills) {
        if (typeof skills === 'string') {
          try {
            skills = JSON.parse(skills);
          } catch (e) {
            skills = [skills];
          }
        } else if (!Array.isArray(skills)) {
          skills = Object.values(skills).filter(Boolean).map(String);
        }
      } else {
        skills = [];
      }

      return {
        ...candidateData,
        skills
      } as CandidateData;
    } catch (error: any) {
      console.error("Error in getCandidateById:", error.message);
      throw error;
    }
  },
  
  /**
   * Create a new candidate
   */
  async createCandidate(options: CreateCandidateOptions): Promise<string> {
    try {
      console.log("Creating new candidate:", options.first_name, options.last_name);
      
      const { data, error } = await supabase
        .from('candidates')
        .insert([options])
        .select()
        .single();
      
      if (error) {
        console.error("Error creating candidate:", error);
        throw error;
      }
      
      return data.id;
    } catch (error: any) {
      console.error("Error in createCandidate:", error.message);
      throw error;
    }
  },
  
  /**
   * Update an existing candidate
   */
  async updateCandidate(options: UpdateCandidateOptions): Promise<CandidateData> {
    try {
      console.log(`Updating candidate with ID: ${options.id}`);
      
      const { id, ...updates } = options;
      
      // Add last_updated_at timestamp
      updates.last_updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating candidate:", error);
        throw error;
      }
      
      return data as CandidateData;
    } catch (error: any) {
      console.error("Error in updateCandidate:", error.message);
      throw error;
    }
  },
  
  /**
   * Delete a candidate and optionally its associated resume
   */
  async deleteCandidate(candidateId: string, deleteResume: boolean = false): Promise<boolean> {
    try {
      console.log(`Deleting candidate with ID: ${candidateId}`);
      
      // First get the candidate to check if it has a resume
      let resumeId = null;
      
      if (deleteResume) {
        const { data, error } = await supabase
          .from('candidates')
          .select('resume_id')
          .eq('id', candidateId)
          .single();
        
        if (error) {
          console.error("Error fetching candidate resume ID:", error);
        } else if (data && data.resume_id) {
          resumeId = data.resume_id;
        }
      }
      
      // Delete the candidate
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);
      
      if (error) {
        console.error("Error deleting candidate:", error);
        throw error;
      }
      
      // If requested and resume exists, delete it too
      if (deleteResume && resumeId) {
        console.log(`Also deleting associated resume with ID: ${resumeId}`);
        
        const { error: resumeError } = await supabase
          .rpc('delete_resume_by_id', { resume_id_param: resumeId });
        
        if (resumeError) {
          console.error("Error deleting associated resume:", resumeError);
          // We don't throw here as the candidate was successfully deleted
        }
      }
      
      return true;
    } catch (error: any) {
      console.error("Error in deleteCandidate:", error.message);
      throw error;
    }
  },
  
  /**
   * Update the score for a candidate
   */
  async updateCandidateScore(candidateId: string): Promise<number> {
    try {
      console.log(`Updating score for candidate with ID: ${candidateId}`);
      
      // First get the candidate data
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
      
      if (error) {
        console.error("Error fetching candidate for score update:", error);
        throw error;
      }
      
      // Calculate new quality score
      const newScore = calculateCandidateQualityScore(data);
      
      // Update the candidate with the new score
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ score: newScore })
        .eq('id', candidateId);
      
      if (updateError) {
        console.error("Error updating candidate score:", updateError);
        throw updateError;
      }
      
      return newScore;
    } catch (error: any) {
      console.error("Error in updateCandidateScore:", error.message);
      throw error;
    }
  },
  
  /**
   * Filter candidates function
   */
  filterCandidates: async () => {
    console.log("Filter candidates function called, but not implemented yet");
    return [];
  }
};
