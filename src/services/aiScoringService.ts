
import { supabase } from '@/integrations/supabase/client';

export interface AIScoreResult {
  success: boolean;
  score?: number;
  explanation?: string;
  breakdown?: {
    education?: number;
    experience?: number;
    skills?: number;
    languages?: number;
    location?: number;
    profileSummary?: number;
    cvStructure?: number;
  };
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  error?: string;
}

/**
 * Service pour sauvegarder les scores IA dans la base de données
 */
export class AIScoringService {
  
  /**
   * Sauvegarder un score IA avec toutes ses données
   */
  async saveAIScore(
    candidateId: string,
    score: number,
    explanation: string,
    breakdown: any = {},
    strengths: string[] = [],
    weaknesses: string[] = [],
    recommendations: string[] = [],
    jobOfferId?: string
  ): Promise<AIScoreResult> {
    try {
      console.log('🚀 [AIScoringService] Saving AI score for candidate:', candidateId);
      console.log('📊 [AIScoringService] Score data:', {
        score,
        explanationLength: explanation.length,
        strengthsCount: strengths.length,
        weaknessesCount: weaknesses.length,
        recommendationsCount: recommendations.length,
        breakdown
      });

      // Utiliser la fonction SQL corrigée pour sauvegarder
      const { data, error } = await supabase.rpc('save_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_score: score,
        p_explanation: explanation,
        p_job_offer_id: jobOfferId || null,
        p_breakdown: breakdown,
        p_strengths: strengths,
        p_weaknesses: weaknesses,
        p_recommendations: recommendations
      });

      if (error) {
        console.error('❌ [AIScoringService] Error saving AI score:', error);
        throw error;
      }

      console.log('✅ [AIScoringService] AI score saved successfully:', data);

      return {
        success: true,
        score,
        explanation,
        breakdown,
        strengths,
        weaknesses,
        recommendations
      };

    } catch (error: any) {
      console.error('❌ [AIScoringService] Failed to save AI score:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupérer un score IA existant
   */
  async getAIScore(candidateId: string, jobOfferId?: string): Promise<AIScoreResult> {
    try {
      console.log('🔍 [AIScoringService] Getting AI score for candidate:', candidateId);

      const { data, error } = await supabase.rpc('get_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_job_offer_id: jobOfferId || null
      });

      if (error) {
        console.error('❌ [AIScoringService] Error getting AI score:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('📭 [AIScoringService] No AI score found for candidate:', candidateId);
        return {
          success: false,
          error: 'No AI score found'
        };
      }

      const scoreData = data[0];
      console.log('✅ [AIScoringService] AI score retrieved:', scoreData);

      // Gérer les types JSON de Supabase en toute sécurité
      const parseJsonField = (field: any): any => {
        if (field === null || field === undefined) return {};
        if (typeof field === 'object') return field;
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch {
            return {};
          }
        }
        return {};
      };

      const parseJsonArray = (field: any): string[] => {
        if (field === null || field === undefined) return [];
        if (Array.isArray(field)) {
          return field.filter(item => typeof item === 'string');
        }
        if (typeof field === 'string') {
          try {
            const parsed = JSON.parse(field);
            return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      return {
        success: true,
        score: scoreData.score,
        explanation: scoreData.explanation,
        breakdown: parseJsonField(scoreData.breakdown),
        strengths: parseJsonArray(scoreData.strengths),
        weaknesses: parseJsonArray(scoreData.weaknesses),
        recommendations: parseJsonArray(scoreData.recommendations)
      };

    } catch (error: any) {
      console.error('❌ [AIScoringService] Failed to get AI score:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Supprimer un score IA
   */
  async deleteAIScore(candidateId: string, jobOfferId?: string): Promise<boolean> {
    try {
      console.log('🗑️ [AIScoringService] Deleting AI score for candidate:', candidateId);

      const { data, error } = await supabase.rpc('delete_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_job_offer_id: jobOfferId || null
      });

      if (error) {
        console.error('❌ [AIScoringService] Error deleting AI score:', error);
        return false;
      }

      console.log('✅ [AIScoringService] AI score deleted successfully');
      return true;

    } catch (error: any) {
      console.error('❌ [AIScoringService] Failed to delete AI score:', error);
      return false;
    }
  }
}

export const aiScoringService = new AIScoringService();
