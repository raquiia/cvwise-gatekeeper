
import { supabase } from '@/integrations/supabase/client';

export interface AIScoringResult {
  score: number;
  explanation: string;
  breakdown: {
    skills: number;
    experience: number;
    education: number;
    languages: number;
    location: number;
    profileSummary: number;
    cvStructure: number;
    culturalFit?: number;
    availability?: number;
    interviewBonus?: number;
  };
  isJobSpecific: boolean;
  source: 'database' | 'fresh_calculation' | 'cache';
}

class AIScoringService {
  private scoreCache: Map<string, { score: AIScoringResult; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Obtenir le score avec explication, en utilisant le cache optimisé
   */
  async getScoreWithExplanation(candidateId: string, jobOfferId?: string | null): Promise<AIScoringResult | null> {
    console.log('Getting AI score with explanation for candidate:', candidateId, 'job:', jobOfferId);
    
    const cacheKey = `${candidateId}_${jobOfferId || 'general'}`;
    
    // Vérifier le cache en mémoire d'abord
    const cached = this.scoreCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log('Using in-memory cached AI score for candidate:', candidateId);
      return cached.score;
    }
    
    try {
      // Vérifier dans la base de données en utilisant la fonction edge
      console.log('Checking for cached AI score in database...', { candidateId, jobOfferId });
      
      const { data: cachedScore, error: cacheError } = await supabase.functions.invoke('ai-score-helpers', {
        body: {
          action: 'get',
          candidateId,
          jobOfferId: jobOfferId || null
        }
      });
      
      if (cacheError) {
        console.warn('Error checking cached score:', cacheError);
      }
      
      if (cachedScore && cachedScore.success && this.isScoreValid(cachedScore.data)) {
        console.log('Found valid cached score from database');
        const result = this.formatDatabaseScore(cachedScore.data, Boolean(jobOfferId));
        
        // Mettre en cache en mémoire
        this.scoreCache.set(cacheKey, { score: result, timestamp: Date.now() });
        
        return result;
      }
      
      // Pas de score valide en cache, calculer un nouveau score
      console.log('No valid cached score found, calculating new AI score');
      return await this.calculateNewScore(candidateId, jobOfferId);
      
    } catch (error: any) {
      console.error('Error in getScoreWithExplanation:', error);
      throw error;
    }
  }

  /**
   * Forcer le recalcul du score (ignorer complètement le cache)
   */
  async forceRecalculate(candidateId: string, jobOfferId?: string | null): Promise<AIScoringResult | null> {
    console.log('Force recalculating AI score for candidate:', candidateId, 'job:', jobOfferId);
    
    const cacheKey = `${candidateId}_${jobOfferId || 'general'}`;
    
    // Supprimer du cache en mémoire
    this.scoreCache.delete(cacheKey);
    
    try {
      // Supprimer l'ancien score de la base de données
      await supabase.functions.invoke('ai-score-helpers', {
        body: {
          action: 'delete',
          candidateId,
          jobOfferId: jobOfferId || null
        }
      });
      
      // Calculer un nouveau score sans vérifier le cache
      const result = await this.calculateNewScore(candidateId, jobOfferId);
      
      if (result) {
        // Mettre à jour le cache en mémoire avec le nouveau score
        this.scoreCache.set(cacheKey, { score: result, timestamp: Date.now() });
      }
      
      return result;
    } catch (error: any) {
      console.error('Error in forceRecalculate:', error);
      throw error;
    }
  }

  /**
   * Calculer un nouveau score avec l'IA
   */
  private async calculateNewScore(candidateId: string, jobOfferId?: string | null): Promise<AIScoringResult | null> {
    try {
      console.log('Calling ai-scoring edge function for candidate:', candidateId);
      
      const { data, error } = await supabase.functions.invoke('ai-scoring', {
        body: { 
          candidateId,
          jobOfferId: jobOfferId || null,
          forceRecalculate: true // Toujours forcer le recalcul quand on appelle cette méthode
        }
      });
      
      if (error) {
        console.error('Error calling ai-scoring function:', error);
        throw new Error(`Erreur lors du calcul du score IA: ${error.message}`);
      }
      
      if (!data || !data.success) {
        console.error('AI scoring failed:', data?.error || 'Raison inconnue');
        throw new Error(data?.error || 'Calcul du score IA échoué');
      }
      
      console.log('AI scoring completed successfully, score:', data.result.score);
      
      return {
        score: data.result.score,
        explanation: data.result.explanation,
        breakdown: data.result.breakdown,
        isJobSpecific: Boolean(jobOfferId),
        source: 'fresh_calculation'
      };
      
    } catch (error: any) {
      console.error('Error calculating new AI score:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un score en base de données est encore valide
   */
  private isScoreValid(scoreData: any): boolean {
    if (!scoreData || !scoreData.score || !scoreData.explanation) {
      return false;
    }
    
    // Vérifier que le score n'est pas trop ancien (par exemple, plus de 24h)
    const scoreAge = Date.now() - new Date(scoreData.calculated_at).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures
    
    return scoreAge < maxAge;
  }

  /**
   * Formater un score depuis la base de données
   */
  private formatDatabaseScore(scoreData: any, isJobSpecific: boolean): AIScoringResult {
    console.log('Using database score for candidate:', scoreData.candidate_id);
    
    return {
      score: scoreData.score,
      explanation: scoreData.explanation,
      breakdown: scoreData.breakdown || {},
      isJobSpecific,
      source: 'database'
    };
  }

  /**
   * Invalider le cache pour un candidat
   */
  invalidateCache(candidateId: string, jobOfferId?: string | null): void {
    const cacheKey = `${candidateId}_${jobOfferId || 'general'}`;
    this.scoreCache.delete(cacheKey);
    console.log('Invalidated AI score cache for candidate:', candidateId);
  }

  /**
   * Nettoyer le cache expiré
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.scoreCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.scoreCache.delete(key);
      }
    }
  }
}

export const aiScoringService = new AIScoringService();
