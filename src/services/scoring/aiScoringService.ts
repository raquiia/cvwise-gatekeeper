
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

export interface CachedAIScore {
  score: number;
  explanation: string;
  breakdown: any;
  isJobSpecific: boolean;
  lastCalculated: string;
  dataHash: string;
  source: 'cache' | 'database' | 'fresh_calculation';
}

export class AIScoringService {
  
  /**
   * Les données AI sont maintenant stockées directement dans la table candidates
   * Plus besoin de cache complexe ou de tables séparées
   */
  private async getCachedAIScore(candidateId: string, jobOfferId?: string): Promise<CachedAIScore | null> {
    try {
      console.log('Checking for AI data in candidates table...', { candidateId, jobOfferId });
      
      const { data: candidate, error } = await supabase
        .from('candidates')
        .select('ai_score, ai_explanation, ai_breakdown, ai_strengths, ai_weaknesses, ai_recommendations, ai_analyzed_at')
        .eq('id', candidateId)
        .single();
      
      if (error) {
        console.error('Error fetching candidate AI data:', error);
        return null;
      }
      
      if (candidate && candidate.ai_score !== null) {
        console.log('Found AI data in candidates table');
        return {
          score: candidate.ai_score,
          explanation: candidate.ai_explanation || 'Score AI calculé',
          breakdown: candidate.ai_breakdown || {},
          isJobSpecific: false, // Les données dans candidates sont générales
          lastCalculated: candidate.ai_analyzed_at || new Date().toISOString(),
          dataHash: 'candidates_table',
          source: 'database'
        };
      }
      
      return null;
    } catch (error: any) {
      console.error('Error checking AI data in candidates table:', error);
      return null;
    }
  }
  
  /**
   * Calculer le score de complétude - maintenant stocké dans candidates
   */
  async calculateCompletenessScore(candidateId: string): Promise<AIScoringResult | null> {
    try {
      console.log('Calculating AI completeness score for candidate:', candidateId);
      
      // Vérifier d'abord si on a déjà des données AI dans candidates
      const cachedResult = await this.getCachedAIScore(candidateId);
      if (cachedResult) {
        console.log('Using AI data from candidates table');
        return {
          education_score: cachedResult.breakdown.education || 0,
          skills_score: cachedResult.breakdown.skills || 0,
          experience_score: cachedResult.breakdown.experience || 0,
          location_score: cachedResult.breakdown.location || 0,
          languages_score: cachedResult.breakdown.languages || 0,
          profile_summary_score: cachedResult.breakdown.profileSummary || 0,
          cv_structure_score: cachedResult.breakdown.cvStructure || 0,
          total_score: cachedResult.score,
          explanation: cachedResult.explanation
        };
      }
      
      console.log('No AI data found, calculating new score via OpenAI...');
      
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
   * Calculer le score de matching - pour l'instant utilise les données générales
   */
  async calculateMatchingScore(candidateId: string, jobOfferId: string): Promise<AIScoringResult | null> {
    try {
      console.log('Calculating AI matching score for candidate:', candidateId, 'and job:', jobOfferId);
      
      // Pour l'instant, utiliser les données générales du candidat
      const cachedResult = await this.getCachedAIScore(candidateId);
      if (cachedResult) {
        console.log('Using general AI data for matching score');
        return {
          education_score: cachedResult.breakdown.education || 0,
          skills_score: cachedResult.breakdown.skills || 0,
          experience_score: cachedResult.breakdown.experience || 0,
          location_score: cachedResult.breakdown.location || 0,
          languages_score: cachedResult.breakdown.languages || 0,
          cultural_fit_score: 50, // Valeur par défaut
          availability_score: 50, // Valeur par défaut
          interview_bonus: 0,
          total_score: cachedResult.score,
          explanation: `${cachedResult.explanation} (adapté pour le matching job)`
        };
      }
      
      console.log('No AI data found, calculating new matching score via OpenAI...');
      
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
    source?: string;
  } | null> {
    try {
      // Vérifier les données AI dans candidates
      const cachedResult = await this.getCachedAIScore(candidateId);
      if (cachedResult) {
        console.log(`Using AI data from candidates table for candidate:`, candidateId);
        return {
          score: cachedResult.score,
          breakdown: cachedResult.breakdown,
          explanation: `${cachedResult.explanation} (Source: Table candidates)`,
          isJobSpecific: false,
          source: cachedResult.source
        };
      }
      
      // Sinon calculer un nouveau score
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
        explanation: `${result.explanation} (Source: Nouveau calcul IA)`,
        isJobSpecific: Boolean(jobOfferId),
        source: 'fresh_calculation'
      };
      
    } catch (error: any) {
      console.error('Error getting score with explanation:', error);
      return null;
    }
  }
  
  /**
   * Forcer le recalcul en supprimant les données AI existantes
   */
  async forceRecalculate(candidateId: string, jobOfferId?: string): Promise<{
    score: number;
    breakdown: any;
    explanation: string;
    isJobSpecific: boolean;
    source: string;
  } | null> {
    try {
      console.log('Force recalculating AI score (clearing existing data)...');
      
      // Supprimer les données AI existantes dans candidates
      await supabase
        .from('candidates')
        .update({
          ai_score: null,
          ai_explanation: null,
          ai_breakdown: null,
          ai_strengths: null,
          ai_weaknesses: null,
          ai_recommendations: null,
          ai_analyzed_at: null
        })
        .eq('id', candidateId);
      
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
        explanation: `${result.explanation} (Source: Nouveau calcul forcé)`,
        isJobSpecific: Boolean(jobOfferId),
        source: 'forced_recalculation'
      };
      
    } catch (error: any) {
      console.error('Error in forceRecalculate:', error);
      return null;
    }
  }
}

export const aiScoringService = new AIScoringService();
