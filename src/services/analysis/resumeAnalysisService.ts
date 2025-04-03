
import { supabase } from '@/integrations/supabase/client';
import { calculateOverallMatch, MatchResult } from './matchingUtils';
import { toast } from '@/hooks/use-toast';

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
      console.log(`Démarrage de l'analyse pour le CV ID: ${resumeId}`);
      toast({
        title: "Analyse en cours",
        description: "L'extraction des informations du CV peut prendre jusqu'à 30 secondes...",
      });
      
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { 
          resumeId,
          extractDetails: true,    // Extraction complète des détails
          fullExtraction: true,    // Force l'extraction complète
          forceCompletion: true    // Génère des données même en cas d'échec partiel
        }
      });
      
      if (error) {
        console.error('Erreur lors de l\'appel de la fonction analyze-resume:', error);
        toast({
          title: "Erreur d'analyse",
          description: error.message || "Une erreur s'est produite lors de l'analyse du CV",
          variant: "destructive",
        });
        throw error;
      }
      
      console.log('Réponse de l\'analyse:', data);
      
      if (data.success) {
        toast({
          title: "Analyse terminée",
          description: "Le CV a été analysé avec succès",
          variant: "default",
        });
        return { 
          success: true, 
          candidateId: data.candidate?.id 
        };
      } else {
        toast({
          title: "Analyse incomplète",
          description: data.message || "L'analyse a rencontré des difficultés. Vérifiez le candidat créé.",
          variant: "default",
        });
        return { 
          success: false, 
          message: data.message || "Une erreur inconnue s'est produite" 
        };
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'analyse du CV:', error);
      toast({
        title: "Échec de l'analyse",
        description: error.message || "Une erreur s'est produite lors de l'analyse du CV",
        variant: "destructive",
      });
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
      console.log(`Comparaison du candidat ${candidateId} avec l'offre d'emploi ${jobPositionId}`);
      
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
