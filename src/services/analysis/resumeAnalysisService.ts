
import { supabase } from '@/integrations/supabase/client';
import { calculateOverallMatch, MatchResult } from './matchingUtils';

/**
 * Service responsable de l'analyse des CV
 * Cette couche d'abstraction facilitera une migration future vers une API REST
 */
export const resumeAnalysisService = {
  /**
   * Déclenche l'analyse d'un CV
   */
  analyzeResume: async (resumeId: string): Promise<{ success: boolean; message?: string; candidateId?: string }> => {
    try {
      console.log(`Triggering analysis for resume ID: ${resumeId}`);
      
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { 
          resumeId,
          extractDetails: true,  // Make sure to extract all details
          fullExtraction: true   // Additional flag to enforce complete extraction
        }
      });
      
      if (error) {
        console.error('Error calling analyze-resume function:', error);
        throw error;
      }
      
      console.log('Analysis response:', data);
      
      if (data.success) {
        return { 
          success: true, 
          candidateId: data.candidate?.id 
        };
      } else {
        return { 
          success: false, 
          message: data.message || "Une erreur inconnue s'est produite" 
        };
      }
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      return { 
        success: false, 
        message: error.message || "Une erreur s'est produite lors de l'analyse du CV" 
      };
    }
  },
  
  /**
   * Compare un candidat à une offre d'emploi
   */
  compareToJobPosition: async (candidateId: string, jobPositionId: string): Promise<MatchResult> => {
    try {
      console.log(`Comparing candidate ${candidateId} to job position ${jobPositionId}`);
      
      // Get candidate data
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
        
      if (candidateError || !candidateData) {
        console.error('Error fetching candidate:', candidateError);
        throw new Error('Impossible de récupérer les données du candidat');
      }
      
      // Get job position data
      const { data: jobPosition, error: jobError } = await supabase
        .from('job_positions')
        .select('*')
        .eq('id', jobPositionId)
        .single();
        
      if (jobError || !jobPosition) {
        console.error('Error fetching job position:', jobError);
        throw new Error("Impossible de récupérer les données de l'offre d'emploi");
      }
      
      // Calculate match score
      const matchResult = calculateOverallMatch(candidateData, jobPosition);
      console.log('Match result:', matchResult);
      
      return matchResult;
    } catch (error: any) {
      console.error('Error comparing candidate to job position:', error);
      // Return a default match result with a zero score in case of error
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
  
  /**
   * Trouve des profils similaires à un candidat
   */
  findSimilarProfiles: async (candidateId: string, limit: number = 5): Promise<any[]> => {
    try {
      console.log(`Finding ${limit} profiles similar to candidate ${candidateId}`);
      
      // Get the candidate data
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
        
      if (candidateError || !candidateData) {
        console.error('Error fetching candidate:', candidateError);
        throw new Error('Impossible de récupérer les données du candidat');
      }
      
      // Get all other candidates
      const { data: allCandidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .neq('id', candidateId); // Exclude the current candidate
        
      if (candidatesError || !allCandidates) {
        console.error('Error fetching candidates:', candidatesError);
        throw new Error('Impossible de récupérer les autres candidats');
      }
      
      // Calculate similarity scores
      const similarCandidates = allCandidates.map(candidate => {
        // For simplicity, we'll reuse our matching algorithm
        // We treat the original candidate as a "job position" with skills requirements
        const similarity = calculateOverallMatch(
          candidate, 
          { skills: candidateData.skills, required_years_experience: candidateData.years_experience }
        );
        
        return {
          ...candidate,
          similarityScore: similarity.score,
          matchDetails: similarity.details
        };
      });
      
      // Sort by similarity score and limit the results
      return similarCandidates
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
    } catch (error: any) {
      console.error('Error finding similar profiles:', error);
      return [];
    }
  }
};
