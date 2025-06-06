import { supabase } from '@/integrations/supabase/client';
import { AICandidateScore, AIScoringResult, AIScoringError, AIScoreFetchOptions } from './types';

/**
 * Service pour gérer les scores AI des candidats
 */
export class AIScoringService {
  
  /**
   * Récupère le score AI d'un candidat
   * @param candidateId ID du candidat
   * @param jobOfferId ID de l'offre d'emploi (optionnel)
   * @param options Options de récupération
   * @returns Le score AI ou null si pas trouvé
   */
  async getScore(
    candidateId: string, 
    jobOfferId?: string | null,
    options: AIScoreFetchOptions = {}
  ): Promise<AIScoringResult | null> {
    try {
      if (options.bypassCache) {
        console.log(`Bypassing cache for candidate ${candidateId}`);
        return await this.calculateScore(candidateId, jobOfferId);
      }
      
      console.log(`Getting AI score for candidate ${candidateId}${jobOfferId ? ` and job ${jobOfferId}` : ''}`);
      
      const { data, error } = await supabase.rpc(
        'get_ai_candidate_score',
        { 
          p_candidate_id: candidateId,
          p_job_offer_id: jobOfferId || null
        }
      );
      
      if (error) {
        console.error('Error fetching AI score:', error);
        return null;
      }
      
      // Fix: Handle array response from RPC function
      const scoreData = Array.isArray(data) ? data[0] : data;
      
      if (!scoreData) {
        console.log('No cached score found, calculating new score');
        return await this.calculateScore(candidateId, jobOfferId);
      }
      
      console.log('Found cached AI score in database:', scoreData);
      return {
        score: scoreData.score,
        explanation: scoreData.explanation,
        breakdown: scoreData.breakdown || {
          skills: 0,
          experience: 0,
          education: 0,
          cvStructure: 0,
          profileSummary: 0
        },
        source: 'database',
        isJobSpecific: !!scoreData.job_offer_id
      };
    } catch (error: any) {
      console.error('Error in getScore:', error);
      return null;
    }
  }
  
  /**
   * Calcule un nouveau score AI pour un candidat
   * @param candidateId ID du candidat
   * @param jobOfferId ID de l'offre d'emploi (optionnel)
   * @returns Le score AI calculé ou null en cas d'erreur
   */
  async calculateScore(candidateId: string, jobOfferId?: string | null): Promise<AIScoringResult | null> {
    try {
      console.log(`Calculating AI score for candidate ${candidateId}${jobOfferId ? ` and job ${jobOfferId}` : ''}`);
      
      const scoringType = jobOfferId ? 'job_matching' : 'completeness';
      
      const res = await fetch('/api/ai-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          jobOfferId,
          scoringType
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to calculate AI score: ${errorText}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error in AI scoring');
      }
      
      console.log(`AI score calculation successful for ${candidateId}:`, data.score);
      
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
      console.error(`Error calculating AI score for candidate ${candidateId}:`, error);
      return null;
    }
  }
  
  /**
   * Supprime un score AI
   * @param candidateId ID du candidat
   * @param jobOfferId ID de l'offre d'emploi (optionnel)
   * @returns true si suppression réussie
   */
  async deleteScore(candidateId: string, jobOfferId?: string | null): Promise<boolean> {
    try {
      console.log(`Deleting AI score for candidate ${candidateId}${jobOfferId ? ` and job ${jobOfferId}` : ''}`);
      
      const { data, error } = await supabase.rpc(
        'delete_ai_candidate_score',
        {
          p_candidate_id: candidateId,
          p_job_offer_id: jobOfferId || null
        }
      );
      
      if (error) {
        console.error('Error deleting AI score:', error);
        return false;
      }
      
      return !!data;
    } catch (error: any) {
      console.error('Error in deleteScore:', error);
      return false;
    }
  }
  
  /**
   * Récupère les scores pour plusieurs candidats
   * @param candidateIds IDs des candidats
   * @param jobOfferId ID de l'offre d'emploi (optionnel)
   * @returns Un objet avec les scores indexés par ID candidat
   */
  async getScoresForCandidates(
    candidateIds: string[], 
    jobOfferId?: string | null
  ): Promise<Record<string, AIScoringResult | null>> {
    try {
      console.log(`Getting AI scores for ${candidateIds.length} candidates${jobOfferId ? ` and job ${jobOfferId}` : ''}`);
      
      const results: Record<string, AIScoringResult | null> = {};
      
      // Récupérer tous les scores en parallèle
      const promises = candidateIds.map(async (candidateId) => {
        results[candidateId] = await this.getScore(candidateId, jobOfferId);
      });
      
      await Promise.all(promises);
      return results;
    } catch (error: any) {
      console.error('Error in getScoresForCandidates:', error);
      return {};
    }
  }
  
  /**
   * Recalcule tous les scores pour plusieurs candidats
   * @param candidateIds IDs des candidats
   * @param jobOfferId ID de l'offre d'emploi (optionnel)
   * @param onlyMissing Ne recalculer que les scores manquants
   * @returns Un objet avec les scores indexés par ID candidat
   */
  async recalculateScores(
    candidateIds: string[], 
    jobOfferId?: string | null,
    onlyMissing: boolean = true
  ): Promise<Record<string, AIScoringResult | null>> {
    try {
      console.log(`Recalculating AI scores for ${candidateIds.length} candidates${jobOfferId ? ` and job ${jobOfferId}` : ''}`);
      
      const results: Record<string, AIScoringResult | null> = {};
      
      if (onlyMissing) {
        // Récupérer d'abord tous les scores existants
        const existingScores = await this.getScoresForCandidates(candidateIds, jobOfferId);
        
        // Traiter par batch pour ne pas surcharger l'API
        const batchSize = 3;
        const candidatesNeedingScores = candidateIds.filter(id => !existingScores[id]);
        
        console.log(`After filtering, ${candidatesNeedingScores.length} candidates need score calculation`);
        
        for (let i = 0; i < candidatesNeedingScores.length; i += batchSize) {
          const batch = candidatesNeedingScores.slice(i, i + batchSize);
          
          console.log(`Processing batch ${i/batchSize + 1} with ${batch.length} candidates`);
          
          const batchPromises = batch.map(async (candidateId) => {
            results[candidateId] = await this.calculateScore(candidateId, jobOfferId);
          });
          
          await Promise.all(batchPromises);
          
          // Pause entre les batchs
          if (i + batchSize < candidatesNeedingScores.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Combiner les résultats
        candidateIds.forEach(id => {
          results[id] = results[id] || existingScores[id];
        });
      } else {
        // Recalculer tous les scores par batch
        const batchSize = 3;
        for (let i = 0; i < candidateIds.length; i += batchSize) {
          const batch = candidateIds.slice(i, i + batchSize);
          
          console.log(`Processing batch ${i/batchSize + 1} with ${batch.length} candidates`);
          
          const batchPromises = batch.map(async (candidateId) => {
            results[candidateId] = await this.calculateScore(candidateId, jobOfferId);
          });
          
          await Promise.all(batchPromises);
          
          // Pause entre les batchs
          if (i + batchSize < candidateIds.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      return results;
    } catch (error: any) {
      console.error('Error in recalculateScores:', error);
      return {};
    }
  }
}

export const aiScoringService = new AIScoringService();
