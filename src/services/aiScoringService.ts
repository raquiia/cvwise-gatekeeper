
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
   * Sauvegarder un score IA avec toutes ses données directement dans la table candidates
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

      // Sauvegarder directement dans la table candidates
      const { data, error } = await supabase
        .from('candidates')
        .update({
          ai_score: score,
          ai_explanation: explanation,
          ai_breakdown: breakdown,
          ai_strengths: strengths,
          ai_weaknesses: weaknesses,
          ai_recommendations: recommendations,
          ai_analyzed_at: new Date().toISOString()
        })
        .eq('id', candidateId)
        .select()
        .single();

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
   * Récupérer un score IA existant depuis la table candidates
   */
  async getAIScore(candidateId: string, jobOfferId?: string): Promise<AIScoreResult> {
    try {
      console.log('🔍 [AIScoringService] Getting AI score for candidate:', candidateId);

      const { data: candidateData, error } = await supabase
        .from('candidates')
        .select('ai_score, ai_explanation, ai_breakdown, ai_strengths, ai_weaknesses, ai_recommendations, ai_analyzed_at')
        .eq('id', candidateId)
        .single();

      if (error) {
        console.error('❌ [AIScoringService] Error getting AI score:', error);
        throw error;
      }

      if (!candidateData || candidateData.ai_score === null) {
        console.log('📭 [AIScoringService] No AI score found for candidate:', candidateId);
        return {
          success: false,
          error: 'No AI score found'
        };
      }

      console.log('✅ [AIScoringService] AI score retrieved:', candidateData);

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
        score: candidateData.ai_score,
        explanation: candidateData.ai_explanation || '',
        breakdown: parseJsonField(candidateData.ai_breakdown),
        strengths: parseJsonArray(candidateData.ai_strengths),
        weaknesses: parseJsonArray(candidateData.ai_weaknesses),
        recommendations: parseJsonArray(candidateData.ai_recommendations)
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
   * Supprimer un score IA en remettant les champs à null
   */
  async deleteAIScore(candidateId: string, jobOfferId?: string): Promise<boolean> {
    try {
      console.log('🗑️ [AIScoringService] Deleting AI score for candidate:', candidateId);

      const { error } = await supabase
        .from('candidates')
        .update({
          ai_score: null,
          ai_explanation: null,
          ai_breakdown: {},
          ai_strengths: [],
          ai_weaknesses: [],
          ai_recommendations: [],
          ai_analyzed_at: null
        })
        .eq('id', candidateId);

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
