
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
      
      // Appel à l'edge function Supabase
      const supabaseUrl = 'https://xgsaazntnhtbrwchvnxl.supabase.co';
      const response = await fetch(`${supabaseUrl}/functions/v1/job-offer-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhnc2Fhem50bmh0YnJ3Y2h2bnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MTU3MDAsImV4cCI6MjA1ODQ5MTcwMH0.GP1QMFgNN2uKM3LVqPbkQk5PSL-phJ0Iqx96AFAQyqg`
        },
        body: JSON.stringify({
          jobTitle,
          location,
          freeformText
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate job suggestions');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to generate job suggestions');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error generating job offer suggestions:', error);
      throw error;
    }
  }
};
