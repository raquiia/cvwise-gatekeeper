// Create a new implementation that uses the Edge Function for job offer suggestions
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

// Simplified service that calls the Edge Function
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

  // Other methods can be added here as needed
};
