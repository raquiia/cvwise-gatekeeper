
import { supabase } from '@/integrations/supabase/client';
import { AICandidateScore, AIScoringResult, AIScoringError, AIScoreFetchOptions, AIScoringBreakdown } from './types';

/**
 * Service pour récupérer les scores AI des candidats depuis la table candidates
 * Les scores sont maintenant stockés directement dans la table candidates
 */
export class AIScoringService {
  
  /**
   * Convertit un objet Json en AIScoringBreakdown
   */
  private parseBreakdown(breakdown: any): AIScoringBreakdown {
    if (!breakdown || typeof breakdown !== 'object') {
      return {
        skills: 0,
        experience: 0,
        education: 0,
        cvStructure: 0,
        profileSummary: 0
      };
    }
    
    return {
      skills: breakdown.skills || 0,
      experience: breakdown.experience || 0,
      education: breakdown.education || 0,
      cvStructure: breakdown.cvStructure || 0,
      profileSummary: breakdown.profileSummary || 0,
      location: breakdown.location,
      cultural: breakdown.cultural,
      languages: breakdown.languages,
      ...breakdown
    };
  }
  
  /**
   * Récupère le score AI d'un candidat depuis la table candidates
   */
  async getScore(
    candidateId: string, 
    jobOfferId?: string | null,
    options: AIScoreFetchOptions = {}
  ): Promise<AIScoringResult | null> {
    try {
      console.log(`[AI Scoring Service] Getting score for candidate ${candidateId} from candidates table`);
      
      const { data, error } = await supabase
        .from('candidates')
        .select('ai_score, ai_explanation, ai_breakdown, ai_strengths, ai_weaknesses, ai_recommendations, ai_analyzed_at')
        .eq('id', candidateId)
        .single();
      
      if (error) {
        console.error('[AI Scoring Service] Database error:', error);
        return null;
      }
      
      if (!data || data.ai_score === null) {
        console.log('[AI Scoring Service] No AI score found in candidates table');
        return null;
      }
      
      console.log('[AI Scoring Service] Found AI score in candidates table:', data.ai_score);
      return {
        score: data.ai_score,
        explanation: data.ai_explanation || 'Score calculé par IA',
        breakdown: this.parseBreakdown(data.ai_breakdown),
        source: 'database',
        isJobSpecific: false // Les données dans candidates sont générales
      };
    } catch (error: any) {
      console.error('[AI Scoring Service] Error in getScore:', error);
      return null;
    }
  }
  
  /**
   * Supprime un score AI (reset les colonnes dans candidates)
   */
  async deleteScore(candidateId: string, jobOfferId?: string | null): Promise<boolean> {
    try {
      console.log(`[AI Scoring Service] Deleting AI score for candidate ${candidateId}`);
      
      const { error } = await supabase
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
      
      if (error) {
        console.error('[AI Scoring Service] Error deleting AI score:', error);
        return false;
      }
      
      console.log('[AI Scoring Service] AI score deleted successfully');
      return true;
    } catch (error: any) {
      console.error('[AI Scoring Service] Error in deleteScore:', error);
      return false;
    }
  }
}

export const aiScoringService = new AIScoringService();
