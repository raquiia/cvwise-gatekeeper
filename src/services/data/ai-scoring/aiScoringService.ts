
import { supabase } from '@/integrations/supabase/client';
import { AICandidateScore, AIScoringResult, AIScoringError, AIScoreFetchOptions, AIScoringBreakdown } from './types';

/**
 * Service pour gérer les scores AI des candidats - Version simplifiée et corrigée
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
   * Récupère le score AI d'un candidat
   */
  async getScore(
    candidateId: string, 
    jobOfferId?: string | null,
    options: AIScoreFetchOptions = {}
  ): Promise<AIScoringResult | null> {
    try {
      console.log(`[AI Scoring Service] Getting score for candidate ${candidateId}${jobOfferId ? ` and job ${jobOfferId}` : ''}`);
      
      if (options.bypassCache) {
        console.log(`[AI Scoring Service] Bypassing cache, calculating fresh score`);
        return await this.calculateScore(candidateId, jobOfferId);
      }
      
      const { data, error } = await supabase.rpc(
        'get_ai_candidate_score',
        { 
          p_candidate_id: candidateId,
          p_job_offer_id: jobOfferId || null
        }
      );
      
      if (error) {
        console.error('[AI Scoring Service] RPC error:', error);
        return null;
      }
      
      // Fix: Handle array response from RPC function
      const scoreData = Array.isArray(data) ? data[0] : data;
      
      if (!scoreData) {
        console.log('[AI Scoring Service] No cached score found, calculating new score');
        return await this.calculateScore(candidateId, jobOfferId);
      }
      
      console.log('[AI Scoring Service] Found cached score:', scoreData.score);
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
   * Calcule un nouveau score AI pour un candidat
   */
  async calculateScore(candidateId: string, jobOfferId?: string | null): Promise<AIScoringResult | null> {
    try {
      console.log(`[AI Scoring Service] Calculating new score for candidate ${candidateId}${jobOfferId ? ` and job ${jobOfferId}` : ''}`);
      
      const scoringType = jobOfferId ? 'job_matching' : 'completeness';
      const requestBody = {
        candidateId,
        jobOfferId,
        scoringType
      };
      
      console.log(`[AI Scoring Service] Calling Edge Function with:`, requestBody);
      
      // Utiliser correctement la fonction Edge via Supabase
      const { data, error } = await supabase.functions.invoke('ai-scoring', {
        body: requestBody
      });
      
      console.log(`[AI Scoring Service] Edge Function response:`, { data, error });
      
      if (error) {
        console.error('[AI Scoring Service] Edge Function error:', error);
        throw new Error(`Erreur Edge Function: ${error.message || 'Erreur inconnue'}`);
      }
      
      if (!data) {
        console.error('[AI Scoring Service] No data returned');
        throw new Error('Aucune donnée retournée par la fonction de scoring');
      }
      
      if (!data.success) {
        console.error('[AI Scoring Service] Function returned failure:', data);
        throw new Error(data.error || 'Erreur inconnue lors du calcul du score AI');
      }
      
      console.log(`[AI Scoring Service] Score calculated successfully: ${data.score}`);
      
      return {
        score: data.score,
        explanation: data.explanation || '',
        breakdown: data.breakdown || {
          skills: 0,
          experience: 0,
          education: 0,
          cvStructure: 0,
          profileSummary: 0
        },
        source: 'fresh_calculation',
        isJobSpecific: !!jobOfferId
      };
    } catch (error: any) {
      console.error(`[AI Scoring Service] Error calculating score:`, error);
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
