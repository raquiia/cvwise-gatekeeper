
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/candidateService';

export interface AIScoringResult {
  education_score: number;
  skills_score: number;
  experience_score: number;
  location_score: number;
  languages_score: number;
  profile_summary_score?: number;
  cv_structure_score?: number;
  cultural_fit_score?: number;
  availability_score?: number;
  interview_bonus?: number;
  total_score: number;
  explanation: string;
}

export class AIScoringService {
  
  /**
   * Calculer le score de complétude avec l'IA
   */
  async calculateCompletenessScore(candidateId: string): Promise<AIScoringResult | null> {
    try {
      console.log('Calculating AI completeness score for candidate:', candidateId);
      
      const { data, error } = await supabase.functions.invoke('ai-scoring', {
        body: {
          candidateId,
          scoringType: 'completeness'
        }
      });
      
      if (error) {
        console.error('Error calling AI scoring function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'AI scoring failed');
      }
      
      console.log('AI completeness score calculated successfully');
      return data.scoringResult;
      
    } catch (error: any) {
      console.error('Error in calculateCompletenessScore:', error);
      return null;
    }
  }
  
  /**
   * Calculer le score de matching avec l'IA
   */
  async calculateMatchingScore(candidateId: string, jobOfferId: string): Promise<AIScoringResult | null> {
    try {
      console.log('Calculating AI matching score for candidate:', candidateId, 'and job:', jobOfferId);
      
      const { data, error } = await supabase.functions.invoke('ai-scoring', {
        body: {
          candidateId,
          jobOfferId,
          scoringType: 'matching'
        }
      });
      
      if (error) {
        console.error('Error calling AI scoring function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'AI scoring failed');
      }
      
      console.log('AI matching score calculated successfully');
      return data.scoringResult;
      
    } catch (error: any) {
      console.error('Error in calculateMatchingScore:', error);
      return null;
    }
  }
  
  /**
   * Obtenir le score avec explication pour l'interface
   */
  async getScoreWithExplanation(candidateId: string, jobOfferId?: string): Promise<{
    score: number;
    breakdown: any;
    explanation: string;
    isJobSpecific: boolean;
  } | null> {
    try {
      let result: AIScoringResult | null;
      
      if (jobOfferId) {
        result = await this.calculateMatchingScore(candidateId, jobOfferId);
      } else {
        result = await this.calculateCompletenessScore(candidateId);
      }
      
      if (!result) {
        return null;
      }
      
      return {
        score: result.total_score,
        breakdown: {
          education: result.education_score,
          skills: result.skills_score,
          experience: result.experience_score,
          location: result.location_score,
          languages: result.languages_score,
          profileSummary: result.profile_summary_score,
          cvStructure: result.cv_structure_score,
          culturalFit: result.cultural_fit_score,
          availability: result.availability_score,
          interviewBonus: result.interview_bonus
        },
        explanation: result.explanation,
        isJobSpecific: Boolean(jobOfferId)
      };
      
    } catch (error: any) {
      console.error('Error getting score with explanation:', error);
      return null;
    }
  }
}

export const aiScoringService = new AIScoringService();
