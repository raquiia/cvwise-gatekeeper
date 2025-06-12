
/**
 * Moteur de matching intelligent unifié
 * Combine cache multi-niveaux, scoring adaptatif et algorithmes contextuels
 */

import { CandidateData } from '@/services/data/candidateService';
import { JobOffer } from '@/services/data/job-offers/types';
import { intelligentCache } from '@/services/cache/intelligentCacheService';
import { supabase } from '@/integrations/supabase/client';

export interface IntelligentMatchResult {
  candidateId: string;
  jobOfferId: string;
  overallScore: number;
  confidence: number;
  breakdown: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    locationMatch: number;
    culturalFit: number;
    adaptabilityScore: number;
  };
  contextualFactors: {
    jobType: 'technical' | 'management' | 'commercial' | 'creative' | 'operational';
    seniorityLevel: 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    industry: string;
  };
  recommendations: string[];
  strengths: string[];
  improvements: string[];
  calculatedAt: string;
  cacheHit: boolean;
}

export interface BatchMatchingOptions {
  batchSize?: number;
  maxConcurrency?: number;
  useCache?: boolean;
  forceRecalculation?: boolean;
  progressCallback?: (progress: number, message: string) => void;
}

export interface MatchingMetrics {
  totalCandidates: number;
  processedCandidates: number;
  cacheHits: number;
  cacheMisses: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  accuracyScore: number;
  costReduction: number;
}

class IntelligentMatchingEngine {
  private metrics: MatchingMetrics = {
    totalCandidates: 0,
    processedCandidates: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0,
    accuracyScore: 0,
    costReduction: 0
  };

  /**
   * Matching intelligent d'un candidat avec une offre
   */
  async matchCandidate(
    candidate: CandidateData,
    jobOffer: JobOffer,
    options: { useCache?: boolean; forceRecalculation?: boolean } = {}
  ): Promise<IntelligentMatchResult> {
    const { useCache = true, forceRecalculation = false } = options;
    const startTime = Date.now();

    try {
      // Vérification du cache intelligent
      const cacheKey = this.generateCacheKey(candidate, jobOffer);
      
      if (useCache && !forceRecalculation) {
        const cached = intelligentCache.get<IntelligentMatchResult>([cacheKey]);
        if (cached && this.isCacheValid(cached, candidate, jobOffer)) {
          this.metrics.cacheHits++;
          return { ...cached, cacheHit: true };
        }
      }

      this.metrics.cacheMisses++;

      // Analyse contextuelle de l'offre
      const context = this.analyzeJobContext(jobOffer);
      
      // Calcul du matching adaptatif
      const matchResult = await this.calculateAdaptiveMatch(candidate, jobOffer, context);
      
      // Mise en cache avec TTL adaptatif
      const ttl = this.calculateAdaptiveTTL(matchResult);
      if (useCache) {
        intelligentCache.set([cacheKey], matchResult, ttl);
      }

      // Mise à jour des métriques
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime);

      return { ...matchResult, cacheHit: false };

    } catch (error) {
      console.error('Erreur lors du matching intelligent:', error);
      throw error;
    }
  }

  /**
   * Matching en batch avec optimisations avancées
   */
  async batchMatch(
    candidates: CandidateData[],
    jobOffer: JobOffer,
    options: BatchMatchingOptions = {}
  ): Promise<Map<string, IntelligentMatchResult>> {
    const {
      batchSize = 20,
      maxConcurrency = 5,
      useCache = true,
      forceRecalculation = false,
      progressCallback
    } = options;

    console.log(`🚀 Batch matching intelligent: ${candidates.length} candidats`);
    
    const results = new Map<string, IntelligentMatchResult>();
    const startTime = Date.now();

    // Phase 1: Récupération massive du cache
    if (useCache && !forceRecalculation) {
      const cacheResults = await this.batchCacheRetrieval(candidates, jobOffer);
      cacheResults.forEach((result, candidateId) => {
        results.set(candidateId, result);
      });

      progressCallback?.(
        (cacheResults.size / candidates.length) * 30,
        `${cacheResults.size} scores récupérés du cache`
      );
    }

    // Phase 2: Traitement optimisé des candidats restants
    const remainingCandidates = candidates.filter(c => !results.has(c.id!));
    
    if (remainingCandidates.length > 0) {
      const context = this.analyzeJobContext(jobOffer);
      
      // Traitement par batches parallèles
      const batches = this.createOptimizedBatches(remainingCandidates, batchSize);
      
      for (let i = 0; i < batches.length; i += maxConcurrency) {
        const concurrentBatches = batches.slice(i, i + maxConcurrency);
        
        await Promise.all(
          concurrentBatches.map(async (batch, batchIndex) => {
            const batchResults = await Promise.all(
              batch.map(async (candidate) => {
                try {
                  const result = await this.calculateAdaptiveMatch(candidate, jobOffer, context);
                  
                  // Cache immédiat
                  if (useCache && candidate.id) {
                    const cacheKey = this.generateCacheKey(candidate, jobOffer);
                    const ttl = this.calculateAdaptiveTTL(result);
                    intelligentCache.set([cacheKey], result, ttl);
                  }
                  
                  return { candidateId: candidate.id!, result };
                } catch (error) {
                  console.error(`Erreur pour le candidat ${candidate.id}:`, error);
                  return null;
                }
              })
            );

            batchResults.forEach(item => {
              if (item) {
                results.set(item.candidateId, item.result);
                this.metrics.processedCandidates++;
              }
            });

            const progress = 30 + ((i + batchIndex + 1) / batches.length) * 70;
            progressCallback?.(progress, `Batch ${i + batchIndex + 1}/${batches.length} terminé`);
          })
        );
      }
    }

    // Phase 3: Optimisations post-traitement
    await this.postProcessOptimizations(results, jobOffer);

    const totalTime = Date.now() - startTime;
    this.metrics.totalProcessingTime = totalTime;
    this.metrics.costReduction = this.calculateCostReduction();

    console.log(`✅ Batch matching terminé: ${results.size} scores en ${totalTime}ms`);
    
    return results;
  }

  /**
   * Analyse contextuelle de l'offre d'emploi
   */
  private analyzeJobContext(jobOffer: JobOffer): IntelligentMatchResult['contextualFactors'] {
    const title = jobOffer.title?.toLowerCase() || '';
    const description = jobOffer.description?.toLowerCase() || '';
    const requiredSkills = Array.isArray(jobOffer.required_skills) ? jobOffer.required_skills : [];

    // Détection du type de poste
    let jobType: IntelligentMatchResult['contextualFactors']['jobType'] = 'operational';
    
    if (title.includes('développeur') || title.includes('tech') || title.includes('ingénieur')) {
      jobType = 'technical';
    } else if (title.includes('manager') || title.includes('directeur') || title.includes('chef')) {
      jobType = 'management';
    } else if (title.includes('commercial') || title.includes('vente') || title.includes('business')) {
      jobType = 'commercial';
    } else if (title.includes('design') || title.includes('créatif') || title.includes('marketing')) {
      jobType = 'creative';
    }

    // Détection du niveau de séniorité
    let seniorityLevel: IntelligentMatchResult['contextualFactors']['seniorityLevel'] = 'mid';
    
    if (title.includes('junior') || (jobOffer.experience_years_min || 0) <= 2) {
      seniorityLevel = 'junior';
    } else if (title.includes('senior') || (jobOffer.experience_years_min || 0) >= 5) {
      seniorityLevel = 'senior';
    } else if (title.includes('lead') || title.includes('principal')) {
      seniorityLevel = 'lead';
    } else if (title.includes('directeur') || title.includes('cto') || title.includes('ceo')) {
      seniorityLevel = 'executive';
    }

    // Détection de l'urgence (basé sur les mots-clés)
    let urgency: IntelligentMatchResult['contextualFactors']['urgency'] = 'medium';
    
    if (description.includes('urgent') || description.includes('immédiat')) {
      urgency = 'critical';
    } else if (description.includes('rapidement') || description.includes('asap')) {
      urgency = 'high';
    }

    // Détection de l'industrie
    let industry = 'général';
    if (description.includes('fintech') || description.includes('banque')) {
      industry = 'finance';
    } else if (description.includes('e-commerce') || description.includes('retail')) {
      industry = 'commerce';
    } else if (description.includes('santé') || description.includes('médical')) {
      industry = 'santé';
    }

    return { jobType, seniorityLevel, urgency, industry };
  }

  /**
   * Calcul du matching adaptatif selon le contexte
   */
  private async calculateAdaptiveMatch(
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: IntelligentMatchResult['contextualFactors']
  ): Promise<IntelligentMatchResult> {
    
    // Pondération adaptative selon le contexte
    const weights = this.getContextualWeights(context);
    
    // Calculs spécialisés selon le type de poste
    const breakdown = {
      skillsMatch: this.calculateSkillsMatch(candidate, jobOffer, context),
      experienceMatch: this.calculateExperienceMatch(candidate, jobOffer, context),
      educationMatch: this.calculateEducationMatch(candidate, jobOffer, context),
      locationMatch: this.calculateLocationMatch(candidate, jobOffer),
      culturalFit: this.calculateCulturalFit(candidate, jobOffer, context),
      adaptabilityScore: this.calculateAdaptabilityScore(candidate, context)
    };

    // Score global pondéré
    const overallScore = Math.round(
      breakdown.skillsMatch * weights.skills +
      breakdown.experienceMatch * weights.experience +
      breakdown.educationMatch * weights.education +
      breakdown.locationMatch * weights.location +
      breakdown.culturalFit * weights.cultural +
      breakdown.adaptabilityScore * weights.adaptability
    );

    // Calcul de la confiance
    const confidence = this.calculateConfidence(breakdown, context);

    // Génération des recommandations
    const recommendations = this.generateRecommendations(breakdown, context);
    const strengths = this.identifyStrengths(breakdown);
    const improvements = this.identifyImprovements(breakdown);

    return {
      candidateId: candidate.id!,
      jobOfferId: jobOffer.id!,
      overallScore,
      confidence,
      breakdown,
      contextualFactors: context,
      recommendations,
      strengths,
      improvements,
      calculatedAt: new Date().toISOString(),
      cacheHit: false
    };
  }

  /**
   * Pondération contextuelle selon le type de poste
   */
  private getContextualWeights(context: IntelligentMatchResult['contextualFactors']) {
    const baseWeights = {
      skills: 0.35,
      experience: 0.25,
      education: 0.15,
      location: 0.10,
      cultural: 0.10,
      adaptability: 0.05
    };

    // Ajustements selon le type de poste
    switch (context.jobType) {
      case 'technical':
        return {
          ...baseWeights,
          skills: 0.45, // Plus d'importance aux compétences techniques
          experience: 0.30,
          education: 0.10
        };
      
      case 'management':
        return {
          ...baseWeights,
          experience: 0.35, // Plus d'importance à l'expérience
          cultural: 0.20, // Plus d'importance au fit culturel
          skills: 0.25
        };
      
      case 'commercial':
        return {
          ...baseWeights,
          adaptability: 0.15, // Plus d'importance à l'adaptabilité
          cultural: 0.20,
          experience: 0.30,
          skills: 0.20
        };
      
      default:
        return baseWeights;
    }
  }

  /**
   * Calcul optimisé du matching des compétences
   */
  private calculateSkillsMatch(
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: IntelligentMatchResult['contextualFactors']
  ): number {
    const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
    const requiredSkills = Array.isArray(jobOffer.required_skills) ? jobOffer.required_skills : [];
    const preferredSkills = Array.isArray(jobOffer.preferred_skills) ? jobOffer.preferred_skills : [];

    if (requiredSkills.length === 0) return 50; // Score neutre si pas de compétences requises

    // Matching exact
    const exactMatches = requiredSkills.filter(skill => 
      candidateSkills.some(cSkill => 
        typeof cSkill === 'string' && typeof skill === 'string' && 
        cSkill.toLowerCase() === skill.toLowerCase()
      )
    ).length;

    // Matching partiel (compétences similaires)
    const partialMatches = requiredSkills.filter(skill => 
      candidateSkills.some(cSkill => 
        typeof cSkill === 'string' && typeof skill === 'string' && 
        this.isSkillSimilar(cSkill, skill)
      )
    ).length;

    // Bonus pour les compétences préférées
    const preferredMatches = preferredSkills.filter(skill => 
      candidateSkills.some(cSkill => 
        typeof cSkill === 'string' && typeof skill === 'string' && 
        cSkill.toLowerCase() === skill.toLowerCase()
      )
    ).length;

    // Calcul du score avec bonus contextuels
    let score = (exactMatches / requiredSkills.length) * 80 + 
                (partialMatches / requiredSkills.length) * 40 + 
                (preferredMatches / Math.max(preferredSkills.length, 1)) * 20;

    // Bonus pour surqualification dans certains contextes
    if (context.jobType === 'technical' && candidateSkills.length > requiredSkills.length * 1.5) {
      score += 10;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Vérifie si deux compétences sont similaires
   */
  private isSkillSimilar(skill1: string, skill2: string): boolean {
    const s1 = skill1.toLowerCase();
    const s2 = skill2.toLowerCase();
    
    // Mapping des compétences similaires
    const similarityMap: Record<string, string[]> = {
      'javascript': ['js', 'node.js', 'nodejs'],
      'typescript': ['ts'],
      'react': ['reactjs', 'react.js'],
      'vue': ['vuejs', 'vue.js'],
      'angular': ['angularjs'],
      'python': ['py'],
      'postgresql': ['postgres', 'psql'],
      'mongodb': ['mongo'],
    };

    // Vérification directe
    if (s1.includes(s2) || s2.includes(s1)) return true;

    // Vérification via la map de similarité
    for (const [key, variants] of Object.entries(similarityMap)) {
      if ((s1 === key && variants.includes(s2)) || 
          (s2 === key && variants.includes(s1))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calcul du matching d'expérience adaptatif
   */
  private calculateExperienceMatch(
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: IntelligentMatchResult['contextualFactors']
  ): number {
    const candidateExp = candidate.years_experience || 0;
    const minExp = jobOffer.experience_years_min || 0;
    const maxExp = jobOffer.experience_years_max || 10;

    // Score de base selon la plage d'expérience
    let score = 0;
    
    if (candidateExp >= minExp && candidateExp <= maxExp) {
      score = 100; // Match parfait
    } else if (candidateExp > maxExp) {
      // Surqualification - peut être positive selon le contexte
      const overqualification = candidateExp - maxExp;
      if (context.jobType === 'management' || context.seniorityLevel === 'senior') {
        score = Math.max(80, 100 - overqualification * 5); // Bonus pour management
      } else {
        score = Math.max(60, 100 - overqualification * 10); // Pénalité modérée
      }
    } else {
      // Sous-qualification
      const underqualification = minExp - candidateExp;
      if (context.seniorityLevel === 'junior' && underqualification <= 1) {
        score = 70; // Tolérance pour les postes junior
      } else {
        score = Math.max(20, 80 - underqualification * 15);
      }
    }

    return Math.round(score);
  }

  /**
   * Calcul du matching d'éducation
   */
  private calculateEducationMatch(
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: IntelligentMatchResult['contextualFactors']
  ): number {
    // Logique simplifiée - peut être étendue
    const hasEducation = Array.isArray(candidate.education) && candidate.education.length > 0;
    
    if (context.jobType === 'technical') {
      return hasEducation ? 70 : 50; // L'éducation est moins critique pour le technique
    } else if (context.jobType === 'management') {
      return hasEducation ? 90 : 40; // Plus important pour le management
    }
    
    return hasEducation ? 80 : 60;
  }

  /**
   * Calcul du matching géographique
   */
  private calculateLocationMatch(candidate: CandidateData, jobOffer: JobOffer): number {
    if (!candidate.location || !jobOffer.location) return 50;
    
    const candidateLoc = candidate.location.toLowerCase();
    const jobLoc = jobOffer.location.toLowerCase();
    
    if (candidateLoc === jobLoc) return 100;
    if (candidateLoc.includes(jobLoc) || jobLoc.includes(candidateLoc)) return 80;
    
    // Vérification du télétravail
    if (jobOffer.remote_preference === 'full_remote' || 
        candidate.remote_preference === 'full_remote') return 90;
    
    return 30;
  }

  /**
   * Calcul du fit culturel
   */
  private calculateCulturalFit(
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: IntelligentMatchResult['contextualFactors']
  ): number {
    // Logique basique - peut être enrichie avec plus de données
    let score = 50;
    
    // Alignment sur le type de contrat
    if (candidate.contract_type === jobOffer.contract_type) score += 20;
    
    // Alignment sur le télétravail
    if (candidate.remote_preference === jobOffer.remote_preference) score += 15;
    
    // Bonus selon le contexte
    if (context.urgency === 'critical' && candidate.availability === 'immediate') score += 15;
    
    return Math.min(score, 100);
  }

  /**
   * Calcul du score d'adaptabilité
   */
  private calculateAdaptabilityScore(
    candidate: CandidateData,
    context: IntelligentMatchResult['contextualFactors']
  ): number {
    let score = 50;
    
    // Bonus pour mobilité géographique
    if (candidate.mobility === 'national' || candidate.mobility === 'international') score += 15;
    
    // Bonus pour flexibilité contractuelle
    if (candidate.contract_type === 'all' || !candidate.contract_type) score += 10;
    
    // Bonus pour expérience diversifiée
    const experiences = Array.isArray(candidate.experiences) ? candidate.experiences : [];
    if (experiences.length >= 3) score += 15;
    
    // Bonus pour compétences transversales
    const skills = Array.isArray(candidate.skills) ? candidate.skills : [];
    if (skills.length >= 8) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Calcul de la confiance du résultat
   */
  private calculateConfidence(
    breakdown: IntelligentMatchResult['breakdown'],
    context: IntelligentMatchResult['contextualFactors']
  ): number {
    const scores = Object.values(breakdown);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    
    // Confiance plus élevée si les scores sont cohérents
    let confidence = Math.max(60, 100 - variance);
    
    // Bonus de confiance selon le contexte
    if (context.jobType === 'technical' && breakdown.skillsMatch > 80) confidence += 10;
    if (context.jobType === 'management' && breakdown.experienceMatch > 80) confidence += 10;
    
    return Math.min(Math.round(confidence), 100);
  }

  /**
   * Génération de recommandations contextuelles
   */
  private generateRecommendations(
    breakdown: IntelligentMatchResult['breakdown'],
    context: IntelligentMatchResult['contextualFactors']
  ): string[] {
    const recommendations: string[] = [];
    
    if (breakdown.skillsMatch < 60) {
      recommendations.push("Évaluer les compétences transférables lors de l'entretien");
    }
    
    if (breakdown.experienceMatch > 90 && context.urgency === 'critical') {
      recommendations.push("Candidat prioritaire - expérience excellente et besoin urgent");
    }
    
    if (breakdown.adaptabilityScore > 80) {
      recommendations.push("Profil adaptable, bon potentiel d'évolution");
    }
    
    if (breakdown.culturalFit < 50) {
      recommendations.push("Vérifier l'alignement culturel lors de l'entretien");
    }
    
    return recommendations;
  }

  /**
   * Identification des points forts
   */
  private identifyStrengths(breakdown: IntelligentMatchResult['breakdown']): string[] {
    const strengths: string[] = [];
    
    if (breakdown.skillsMatch >= 80) strengths.push("Excellente correspondance technique");
    if (breakdown.experienceMatch >= 80) strengths.push("Expérience très adaptée");
    if (breakdown.educationMatch >= 80) strengths.push("Formation solide");
    if (breakdown.adaptabilityScore >= 80) strengths.push("Grande adaptabilité");
    if (breakdown.culturalFit >= 80) strengths.push("Excellent fit culturel");
    
    return strengths;
  }

  /**
   * Identification des axes d'amélioration
   */
  private identifyImprovements(breakdown: IntelligentMatchResult['breakdown']): string[] {
    const improvements: string[] = [];
    
    if (breakdown.skillsMatch < 60) improvements.push("Compétences techniques à développer");
    if (breakdown.experienceMatch < 60) improvements.push("Expérience à acquérir");
    if (breakdown.locationMatch < 60) improvements.push("Contraintes géographiques");
    if (breakdown.culturalFit < 60) improvements.push("Alignment culturel à vérifier");
    
    return improvements;
  }

  // Méthodes utilitaires pour le cache et les métriques

  private generateCacheKey(candidate: CandidateData, jobOffer: JobOffer): string {
    const candidateHash = `${candidate.id}_${candidate.updated_at || candidate.created_at}`;
    const jobOfferHash = `${jobOffer.id}_${jobOffer.updated_at || jobOffer.created_at}`;
    return `intelligent_match_${candidateHash}_${jobOfferHash}_v2`;
  }

  private isCacheValid(
    cached: IntelligentMatchResult,
    candidate: CandidateData,
    jobOffer: JobOffer
  ): boolean {
    const cacheAge = Date.now() - new Date(cached.calculatedAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures
    
    return cacheAge < maxAge;
  }

  private calculateAdaptiveTTL(result: IntelligentMatchResult): number {
    const baseTTL = 1000 * 60 * 60 * 2; // 2 heures
    
    // TTL plus long pour les scores stables
    const stabilityFactor = result.confidence / 100;
    const scoreFactor = Math.abs(result.overallScore - 50) / 50;
    
    return Math.round(baseTTL * (1 + stabilityFactor + scoreFactor));
  }

  private async batchCacheRetrieval(
    candidates: CandidateData[],
    jobOffer: JobOffer
  ): Promise<Map<string, IntelligentMatchResult>> {
    const results = new Map<string, IntelligentMatchResult>();
    
    await Promise.all(
      candidates.map(async (candidate) => {
        if (!candidate.id) return;
        
        const cacheKey = this.generateCacheKey(candidate, jobOffer);
        const cached = intelligentCache.get<IntelligentMatchResult>([cacheKey]);
        
        if (cached && this.isCacheValid(cached, candidate, jobOffer)) {
          results.set(candidate.id, { ...cached, cacheHit: true });
          this.metrics.cacheHits++;
        }
      })
    );
    
    return results;
  }

  private createOptimizedBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async postProcessOptimizations(
    results: Map<string, IntelligentMatchResult>,
    jobOffer: JobOffer
  ): Promise<void> {
    // Calcul des statistiques pour optimisations futures
    const scores = Array.from(results.values()).map(r => r.overallScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Cache des statistiques de matching pour cette offre
    const statsKey = `job_matching_stats_${jobOffer.id}`;
    intelligentCache.set([statsKey], {
      averageScore: avgScore,
      candidateCount: results.size,
      calculatedAt: new Date().toISOString()
    }, 1000 * 60 * 60 * 4); // 4 heures
  }

  private updateMetrics(processingTime: number): void {
    this.metrics.processedCandidates++;
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTime = 
      this.metrics.totalProcessingTime / this.metrics.processedCandidates;
  }

  private calculateCostReduction(): number {
    const cacheHitRate = this.metrics.cacheHits / 
      (this.metrics.cacheHits + this.metrics.cacheMisses);
    return Math.round(cacheHitRate * 80); // Estimation 80% de réduction par cache hit
  }

  /**
   * Métriques de performance
   */
  getMetrics(): MatchingMetrics & { cacheStats: any } {
    return {
      ...this.metrics,
      cacheStats: intelligentCache.getStats()
    };
  }

  /**
   * Nettoyage et optimisation
   */
  async optimizeCache(): Promise<void> {
    intelligentCache.clear();
    this.metrics = {
      totalCandidates: 0,
      processedCandidates: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      accuracyScore: 0,
      costReduction: 0
    };
    console.log('✅ Cache et métriques optimisés');
  }
}

// Instance globale du moteur intelligent
export const intelligentMatchingEngine = new IntelligentMatchingEngine();
