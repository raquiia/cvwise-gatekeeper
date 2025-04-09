
import { JobOfferSuggestion } from './types';

/**
 * Service for generating and handling job offer suggestions
 */
export const jobSuggestionService = {
  /**
   * Generate job offer suggestions for a candidate
   */
  generateJobOfferSuggestions: async (
    jobTitle: string, 
    location?: string, 
    freeformText?: string
  ): Promise<JobOfferSuggestion> => {
    try {
      console.log('Generating job suggestions with:', { 
        jobTitle, 
        location, 
        freeformText: freeformText?.substring(0, 100) + "..." 
      });
      
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
