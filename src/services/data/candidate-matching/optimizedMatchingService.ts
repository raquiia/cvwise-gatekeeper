
/**
 * Service de matching optimisé unifié - Version finale
 * Combine toutes les optimisations pour des performances maximales
 */

import { CandidateData } from '../candidateService';
import { JobOffer } from '../job-offers/types';
import { adaptiveMatchingService, AdaptiveMatchResult } from './adaptiveMatchingService';
import { intelligentCache, skillsMatchCache } from '../../cache/intelligentCacheService';
import { supabase } from '@/integrations/supabase/client';

interface BatchMatchingOptions {
  batchSize?: number;
  maxConcurrency?: number;
  includeCache?: boolean;
  progressCallback?: (progress: number, message: string) => void;
}

interface MatchingMetrics {
  totalCandidates: number;
  processedCandidates: number;
  cacheHits: number;
  cacheMisses: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  optimizationsApplied: string[];
}

export class OptimizedMatchingService {
  private metrics: MatchingMetrics = {
    totalCandidates: 0,
    processedCandidates: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0,
    optimizationsApplied: []
  };

  /**
   * Matching optimisé pour un candidat unique
   */
  async matchCandidate(
    candidate: CandidateData,
    jobOffer: JobOffer,
    forceRecalculation = false
  ): Promise<AdaptiveMatchResult> {
    const startTime = Date.now();
    
    try {
      // Vérification du cache intelligent
      const cacheKey = ['optimized_match', candidate.id, jobOffer.id, this.getMatchingVersion()];
      
      if (!forceRecalculation) {
        const cached = intelligentCache.get<AdaptiveMatchResult>(cacheKey);
        if (cached) {
          this.metrics.cacheHits++;
          this.metrics.optimizationsApplied.push('cache_hit');
          return cached;
        }
      }

      this.metrics.cacheMisses++;

      // Calcul adaptatif avec optimisations
      const result = await adaptiveMatchingService.calculateAdaptiveMatch(candidate, jobOffer);
      
      // Mise en cache avec TTL adaptatif selon la confiance
      const ttl = this.calculateAdaptiveTTL(result);
      intelligentCache.set(cacheKey, result, ttl);
      
      // Mise à jour des métriques
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime);
      
      this.metrics.optimizationsApplied.push('adaptive_scoring', 'intelligent_cache');
      
      return result;
      
    } catch (error) {
      console.error('Erreur lors du matching optimisé:', error);
      throw error;
    }
  }

  /**
   * Matching en batch avec parallélisation intelligente
   */
  async matchCandidatesBatch(
    candidates: CandidateData[],
    jobOffer: JobOffer,
    options: BatchMatchingOptions = {}
  ): Promise<Map<string, AdaptiveMatchResult>> {
    const {
      batchSize = 10,
      maxConcurrency = 3,
      includeCache = true,
      progressCallback
    } = options;

    console.log(`🚀 Démarrage du batch matching: ${candidates.length} candidats`);
    
    this.metrics.totalCandidates = candidates.length;
    this.metrics.processedCandidates = 0;
    
    const results = new Map<string, AdaptiveMatchResult>();
    const startTime = Date.now();

    try {
      // Phase 1: Récupération des scores en cache
      let candidatesToProcess = candidates;
      
      if (includeCache) {
        const { cached, remaining } = await this.batchCacheRetrieval(candidates, jobOffer);
        
        cached.forEach((result, candidateId) => {
          results.set(candidateId, result);
        });
        
        candidatesToProcess = remaining;
        this.metrics.cacheHits += cached.size;
        
        progressCallback?.(
          (cached.size / candidates.length) * 100,
          `${cached.size} scores récupérés du cache`
        );
      }

      // Phase 2: Calcul parallélisé des scores restants
      if (candidatesToProcess.length > 0) {
        const batchResults = await this.processInParallelBatches(
          candidatesToProcess,
          jobOffer,
          batchSize,
          maxConcurrency,
          progressCallback
        );
        
        batchResults.forEach((result, candidateId) => {
          results.set(candidateId, result);
        });
      }

      // Phase 3: Optimisations post-traitement
      await this.postProcessOptimizations(results, jobOffer);

      const totalTime = Date.now() - startTime;
      this.metrics.totalProcessingTime = totalTime;
      this.metrics.averageProcessingTime = totalTime / candidates.length;

      console.log(`✅ Batch matching terminé: ${results.size}/${candidates.length} scores calculés en ${totalTime}ms`);
      
      this.metrics.optimizationsApplied.push(
        'batch_processing',
        'parallel_execution',
        'intelligent_caching',
        'post_processing'
      );

      return results;

    } catch (error) {
      console.error('Erreur lors du batch matching:', error);
      throw error;
    }
  }

  /**
   * Récupération en batch des scores en cache
   */
  private async batchCacheRetrieval(
    candidates: CandidateData[],
    jobOffer: JobOffer
  ): Promise<{
    cached: Map<string, AdaptiveMatchResult>;
    remaining: CandidateData[];
  }> {
    const cached = new Map<string, AdaptiveMatchResult>();
    const remaining: CandidateData[] = [];
    const version = this.getMatchingVersion();

    await Promise.all(
      candidates.map(async (candidate) => {
        if (!candidate.id) {
          remaining.push(candidate);
          return;
        }

        const cacheKey = ['optimized_match', candidate.id, jobOffer.id, version];
        const cachedResult = intelligentCache.get<AdaptiveMatchResult>(cacheKey);
        
        if (cachedResult) {
          cached.set(candidate.id, cachedResult);
        } else {
          remaining.push(candidate);
        }
      })
    );

    return { cached, remaining };
  }

  /**
   * Traitement en batches parallèles
   */
  private async processInParallelBatches(
    candidates: CandidateData[],
    jobOffer: JobOffer,
    batchSize: number,
    maxConcurrency: number,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<Map<string, AdaptiveMatchResult>> {
    const results = new Map<string, AdaptiveMatchResult>();
    const batches = this.createBatches(candidates, batchSize);
    
    // Traitement des batches avec contrôle de concurrence
    for (let i = 0; i < batches.length; i += maxConcurrency) {
      const concurrentBatches = batches.slice(i, i + maxConcurrency);
      
      const batchPromises = concurrentBatches.map(async (batch, batchIndex) => {
        const batchResults = await Promise.all(
          batch.map(async (candidate) => {
            try {
              const result = await adaptiveMatchingService.calculateAdaptiveMatch(candidate, jobOffer);
              
              // Mise en cache immédiate
              if (candidate.id) {
                const cacheKey = ['optimized_match', candidate.id, jobOffer.id, this.getMatchingVersion()];
                const ttl = this.calculateAdaptiveTTL(result);
                intelligentCache.set(cacheKey, result, ttl);
              }
              
              return { candidateId: candidate.id!, result };
            } catch (error) {
              console.error(`Erreur pour le candidat ${candidate.id}:`, error);
              return null;
            }
          })
        );

        // Agrégation des résultats du batch
        batchResults.forEach(item => {
          if (item) {
            results.set(item.candidateId, item.result);
            this.metrics.processedCandidates++;
          }
        });

        // Callback de progression
        if (progressCallback) {
          const globalProgress = ((i + batchIndex + 1) / batches.length) * 100;
          progressCallback(
            globalProgress,
            `Traitement batch ${i + batchIndex + 1}/${batches.length}`
          );
        }
      });

      await Promise.all(batchPromises);
    }

    return results;
  }

  /**
   * Optimisations post-traitement
   */
  private async postProcessOptimizations(
    results: Map<string, AdaptiveMatchResult>,
    jobOffer: JobOffer
  ): Promise<void> {
    // Pré-calcul des statistiques pour optimisations futures
    const scores = Array.from(results.values()).map(r => r.score);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // Mise en cache des statistiques pour cette offre
    const statsKey = ['job_matching_stats', jobOffer.id];
    intelligentCache.set(statsKey, {
      averageScore: avgScore,
      maxScore,
      minScore,
      totalCandidates: results.size,
      calculatedAt: new Date().toISOString()
    }, 1000 * 60 * 60 * 2); // Cache 2h

    // Pré-chargement intelligent des correspondances fréquentes
    await this.preloadFrequentMatches(jobOffer);
  }

  /**
   * Pré-chargement des correspondances fréquentes
   */
  private async preloadFrequentMatches(jobOffer: JobOffer): Promise<void> {
    try {
      // Récupérer les compétences les plus recherchées
      const { data: frequentSkills } = await supabase
        .from('job_offers')
        .select('required_skills, preferred_skills')
        .limit(10);

      if (frequentSkills) {
        const allSkills = frequentSkills.flatMap(job => [
          ...(job.required_skills || []),
          ...(job.preferred_skills || [])
        ]);

        // Pré-calculer les correspondances de compétences populaires
        const skillFrequency = new Map<string, number>();
        allSkills.forEach(skill => {
          skillFrequency.set(skill, (skillFrequency.get(skill) || 0) + 1);
        });

        // Mettre en cache les 10 compétences les plus fréquentes
        const topSkills = Array.from(skillFrequency.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([skill]) => skill);

        skillsMatchCache.set(['frequent_skills'], topSkills, 1000 * 60 * 60 * 24);
      }
    } catch (error) {
      console.warn('Erreur lors du pré-chargement:', error);
    }
  }

  /**
   * Création de batches optimisés
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Calcul de TTL adaptatif selon la confiance du résultat
   */
  private calculateAdaptiveTTL(result: AdaptiveMatchResult): number {
    const baseTTL = 1000 * 60 * 60; // 1 heure
    
    // Plus la confiance est élevée, plus le cache dure longtemps
    const confidenceMultiplier = result.confidence / 100;
    
    // Plus le score est extrême (très haut ou très bas), plus il est stable
    const stabilityFactor = Math.abs(result.score - 50) / 50;
    
    return Math.round(baseTTL * (1 + confidenceMultiplier + stabilityFactor));
  }

  /**
   * Version du système de matching (pour invalidation de cache)
   */
  private getMatchingVersion(): string {
    return 'v2.0'; // Incrémenter lors de changements d'algorithme
  }

  /**
   * Mise à jour des métriques
   */
  private updateMetrics(processingTime: number): void {
    this.metrics.processedCandidates++;
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTime = 
      this.metrics.totalProcessingTime / this.metrics.processedCandidates;
  }

  /**
   * Récupération des métriques de performance
   */
  getPerformanceMetrics(): MatchingMetrics & { cacheStats: any } {
    return {
      ...this.metrics,
      cacheStats: intelligentCache.getStats()
    };
  }

  /**
   * Nettoyage et optimisation du cache
   */
  async optimizeCache(): Promise<void> {
    // Nettoyage des entrées expirées
    intelligentCache.clear();
    skillsMatchCache.clear();
    
    // Réinitialisation des métriques
    this.metrics = {
      totalCandidates: 0,
      processedCandidates: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      optimizationsApplied: []
    };
    
    console.log('✅ Cache optimisé et métriques réinitialisées');
  }
}

// Instance globale du service optimisé
export const optimizedMatchingService = new OptimizedMatchingService();
