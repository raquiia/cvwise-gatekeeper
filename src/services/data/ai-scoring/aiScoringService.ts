
import { supabase } from '@/integrations/supabase/client';
import { AICandidateScore, AIScoringResult, AIScoringError, AIScoreFetchOptions, AIScoringBreakdown } from './types';

/**
 * Service pour récupérer les scores AI des candidats depuis la base de données
 * Les scores sont calculés lors de l'analyse du CV, pas ici
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
   * Récupère le score AI d'un candidat depuis la base de données
   */
  async getScore(
    candidateId: string, 
    jobOfferId?: string | null,
    options: AIScoreFetchOptions = {}
  ): Promise<AIScoringResult | null> {
    try {
      console.log(`[AI Scoring Service] Getting score for candidate ${candidateId}${jobOfferId ? ` and job ${jobOfferId}` : ''} from database`);
      
      const { data, error } = await supabase.rpc(
        'get_ai_candidate_score',
        { 
          p_candidate_id: candidateId,
          p_job_offer_id: jobOfferId || null
        }
      );
      
      if (error) {
        console.error('[AI Scoring Service] Database error:', error);
        return null;
      }
      
      // Handle array response from RPC function
      const scoreData = Array.isArray(data) ? data[0] : data;
      
      if (!scoreData) {
        console.log('[AI Scoring Service] No score found in database - will be calculated during CV analysis');
        return null;
      }
      
      console.log('[AI Scoring Service] Found score in database:', scoreData.score);
      return {
        score: scoreData.score,
        explanation: scoreData.explanation,
        breakdown: this.parseBreakdown(scoreData.breakdown),
        source: 'database',
        isJobSpecific: !!scoreData.job_offer_id
      };
    } catch (error: any) {
      console.error('[AI Scoring Service] Error in getScore:', error);
      return null;
    }
  }
  
  /**
   * Supprime un score AI
   */
  async deleteScore(candidateId: string, jobOfferId?: string | null): Promise<boolean> {
    try {
      console.log(`[AI Scoring Service] Deleting score for candidate ${candidateId}${jobOfferId ? ` and job ${jobOfferId}` : ''}`);
      
      const { data, error } = await supabase.rpc(
        'delete_ai_candidate_score',
        {
          p_candidate_id: candidateId,
          p_job_offer_id: jobOfferId || null
        }
      );
      
      if (error) {
        console.error('[AI Scoring Service] Error deleting score:', error);
        return false;
      }
      
      console.log('[AI Scoring Service] Score deleted successfully');
      return !!data;
    } catch (error: any) {
      console.error('[AI Scoring Service] Error in deleteScore:', error);
      return false;
    }
  }
}

export const aiScoringService = new AIScoringService();
