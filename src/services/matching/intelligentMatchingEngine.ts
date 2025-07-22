/**
 * Moteur de matching intelligent unifié - COMPLETELY REVISED
 * Focus sur la pertinence des compétences et l'expérience qualifiante
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
  
  // NEW: Critical analysis
  criticalIssues: string[];
  disqualifiers: string[];
  matchQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unqualified';
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
   * REVISED matching intelligent d'un candidat avec une offre
   */
  async matchCandidate(
    candidate: CandidateData,
    jobOffer: JobOffer,
    options: { useCache?: boolean; forceRecalculation?: boolean } = {}
  ): Promise<IntelligentMatchResult> {
    const { useCache = true, forceRecalculation = false } = options;
    const startTime = Date.now();

    try {
      console.log(`🔍 REVISED MATCHING: ${candidate.first_name} ${candidate.last_name} vs "${jobOffer.title}"`);
      
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
      
      // NOUVEAU: Calcul du matching avec algorithme révisé
      const matchResult = await this.calculateRevisedMatch(candidate, jobOffer, context);
      
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
   * NOUVEAU: Calcul du matching avec focus sur la pertinence
   */
  private async calculateRevisedMatch(
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: IntelligentMatchResult['contextualFactors']
  ): Promise<IntelligentMatchResult> {
    
    console.log(`🎯 Analyzing match for ${context.jobType} ${context.seniorityLevel} position`);
    
    // PHASE 1: ANALYSE CRITIQUE DES COMPÉTENCES (75% du score)
    const skillsAnalysis = this.analyzeSkillsMatch(candidate, jobOffer, context);
    
    // PHASE 2: ANALYSE DE L'EXPÉRIENCE PERTINENTE (15% du score)
    const experienceAnalysis = this.analyzeExperienceRelevance(candidate, jobOffer, context);
    
    // PHASE 3: AUTRES FACTEURS (10% du score)
    const otherFactorsAnalysis = this.analyzeOtherFactors(candidate, jobOffer, context);
    
    // Calcul du score global avec nouveaux poids
    const breakdown = {
      skillsMatch: skillsAnalysis.score,
      experienceMatch: experienceAnalysis.score,
      educationMatch: otherFactorsAnalysis.education,
      locationMatch: otherFactorsAnalysis.location,
      culturalFit: otherFactorsAnalysis.cultural,
      adaptabilityScore: otherFactorsAnalysis.adaptability
    };
    
    // NOUVEAU: Poids révisés avec focus sur les compétences
    const overallScore = Math.round(
      breakdown.skillsMatch * 0.75 +          // 75% skills (UP from 35%)
      breakdown.experienceMatch * 0.15 +      // 15% experience (DOWN from 25%)
      breakdown.educationMatch * 0.04 +       // 4% education (DOWN from 15%)
      breakdown.locationMatch * 0.03 +        // 3% location (DOWN from 10%)
      breakdown.culturalFit * 0.02 +          // 2% cultural (DOWN from 10%)
      breakdown.adaptabilityScore * 0.01      // 1% adaptability (DOWN from 5%)
    );
    
    // NOUVEAU: Analyse critique et disqualifications
    const criticalAnalysis = this.performCriticalAnalysis(
      skillsAnalysis, experienceAnalysis, otherFactorsAnalysis, context
    );
    
    // NOUVEAU: Détermination de la qualité du match
    const matchQuality = this.determineMatchQuality(
      overallScore, skillsAnalysis, criticalAnalysis
    );
    
    // Génération des recommandations révisées
    const recommendations = this.generateRevisedRecommendations(
      skillsAnalysis, experienceAnalysis, otherFactorsAnalysis, context, criticalAnalysis
    );
    
    const strengths = this.identifyStrengths(breakdown, skillsAnalysis, experienceAnalysis);
    const improvements = this.identifyImprovements(breakdown, skillsAnalysis, criticalAnalysis);
    
    // Calcul de la confiance avec nouveaux critères
    const confidence = this.calculateRevisedConfidence(
      skillsAnalysis, experienceAnalysis, context, criticalAnalysis
    );

    console.log(`🏆 REVISED MATCH RESULT for ${candidate.first_name}:`);
    console.log(`   Overall Score: ${overallScore}% (Quality: ${matchQuality})`);
    console.log(`   Skills: ${breakdown.skillsMatch}% (${skillsAnalysis.exactMatches}/${skillsAnalysis.totalRequired} exact)`);
    console.log(`   Experience: ${breakdown.experienceMatch}% (${experienceAnalysis.relevantYears}y relevant)`);
    console.log(`   Critical Issues: ${criticalAnalysis.criticalIssues.length}`);
    console.log(`   Disqualifiers: ${criticalAnalysis.disqualifiers.length}`);

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
      cacheHit: false,
      
      // NOUVEAU: Analyse critique
      criticalIssues: criticalAnalysis.criticalIssues,
      disqualifiers: criticalAnalysis.disqualifiers,
      matchQuality
    };
  }

  /**
   * NOUVEAU: Analyse poussée des compétences avec seuils critiques
   */
  private analyzeSkillsMatch(candidate: CandidateData, jobOffer: JobOffer, context: any) {
    const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
    const requiredSkills = Array.isArray(jobOffer.required_skills) ? jobOffer.required_skills : [];
    const preferredSkills = Array.isArray(jobOffer.preferred_skills) ? jobOffer.preferred_skills : [];
    
    // Normalisation des compétences
    const normalizedCandidateSkills = candidateSkills.map(skill => 
      String(skill).toLowerCase().trim()
    );
    const normalizedRequiredSkills = requiredSkills.map(skill => 
      String(skill).toLowerCase().trim()
    );
    const normalizedPreferredSkills = preferredSkills.map(skill => 
      String(skill).toLowerCase().trim()
    );
    
    let exactMatches = 0;
    let partialMatches = 0;
    let semanticMatches = 0;
    const matchedSkills: string[] = [];
    const missingCriticalSkills: string[] = [];
    
    // Analyse des compétences requises
    for (const reqSkill of normalizedRequiredSkills) {
      let hasMatch = false;
      
      // Vérification match exact
      if (normalizedCandidateSkills.includes(reqSkill)) {
        exactMatches++;
        matchedSkills.push(reqSkill);
        hasMatch = true;
      } 
      // Vérification match sémantique
      else {
        const semanticMatch = normalizedCandidateSkills.find(candSkill => 
          this.isSkillSemanticallyRelated(candSkill, reqSkill)
        );
        
        if (semanticMatch) {
          semanticMatches++;
          matchedSkills.push(reqSkill);
          hasMatch = true;
        } else {
          // Vérification match partiel
          const partialMatch = normalizedCandidateSkills.find(candSkill => 
            candSkill.includes(reqSkill) || reqSkill.includes(candSkill)
          );
          
          if (partialMatch) {
            partialMatches++;
            matchedSkills.push(reqSkill);
            hasMatch = true;
          }
        }
      }
      
      if (!hasMatch) {
        missingCriticalSkills.push(reqSkill);
      }
    }
    
    // Compétences préférées
    let preferredMatches = 0;
    for (const prefSkill of normalizedPreferredSkills) {
      if (normalizedCandidateSkills.some(candSkill => 
        candSkill === prefSkill || this.isSkillSemanticallyRelated(candSkill, prefSkill)
      )) {
        preferredMatches++;
      }
    }
    
    // Calcul du score avec pondération
    let skillsScore = 0;
    
    if (normalizedRequiredSkills.length > 0) {
      const requiredMatchScore = (exactMatches * 1.0 + semanticMatches * 0.8 + partialMatches * 0.4) / normalizedRequiredSkills.length;
      skillsScore = Math.round(requiredMatchScore * 70); // 70 points max pour les compétences requises
      
      // SEUIL CRITIQUE: Moins de 30% des compétences requises = score plafonné
      if (requiredMatchScore < 0.3) {
        skillsScore = Math.min(20, skillsScore);
      }
    } else {
      skillsScore = 35; // Score par défaut si pas de compétences requises
    }
    
    // Bonus pour compétences préférées (max 30 points)
    if (normalizedPreferredSkills.length > 0) {
      const preferredBonus = Math.round((preferredMatches / normalizedPreferredSkills.length) * 30);
      skillsScore += preferredBonus;
    }
    
    skillsScore = Math.min(100, skillsScore);
    
    return {
      score: skillsScore,
      exactMatches,
      semanticMatches,
      partialMatches,
      preferredMatches,
      totalRequired: normalizedRequiredSkills.length,
      totalPreferred: normalizedPreferredSkills.length,
      matchedSkills,
      missingCriticalSkills,
      matchPercentage: normalizedRequiredSkills.length > 0 ? 
        (exactMatches + semanticMatches + partialMatches) / normalizedRequiredSkills.length : 0
    };
  }

  /**
   * NOUVEAU: Analyse de la pertinence de l'expérience
   */
  private analyzeExperienceRelevance(candidate: CandidateData, jobOffer: JobOffer, context: any) {
    const candidateYears = candidate.years_experience || 0;
    const requiredMinYears = jobOffer.experience_years_min || 0;
    const requiredMaxYears = jobOffer.experience_years_max || requiredMinYears + 5;
    const experiences = candidate.experiences || [];
    
    let relevantExperienceYears = 0;
    let relevantExperienceCount = 0;
    const relevantExperiences: any[] = [];
    
    // Analyse de la pertinence des expériences
    if (Array.isArray(experiences)) {
      for (const exp of experiences) {
        const expData = exp as any;
        const expTitle = String(expData?.title || expData?.position || '').toLowerCase();
        const expDescription = String(expData?.description || '').toLowerCase();
        const jobTitle = String(jobOffer.title || '').toLowerCase();
        const jobDescription = String(jobOffer.description || '').toLowerCase();
        
        const isRelevant = this.isExperienceRelevant(
          expTitle, expDescription, jobTitle, jobDescription, 
          jobOffer.required_skills || []
        );
        
        if (isRelevant) {
          const expDuration = this.calculateExperienceDuration(exp);
          relevantExperienceYears += expDuration;
          relevantExperienceCount++;
          relevantExperiences.push(exp);
        }
      }
    }
    
    // Calcul du score d'expérience
    let experienceScore = 0;
    
    if (requiredMinYears === 0) {
      experienceScore = 100; // Pas d'expérience requise
    } else if (relevantExperienceYears >= requiredMinYears) {
      if (relevantExperienceYears <= requiredMaxYears) {
        experienceScore = 100; // Expérience pertinente parfaite
      } else if (relevantExperienceYears <= requiredMaxYears + 3) {
        experienceScore = 90; // Légèrement surqualifié mais pertinent
      } else {
        experienceScore = 75; // Très surqualifié
      }
    } else if (relevantExperienceYears >= requiredMinYears * 0.7) {
      experienceScore = 70; // Presque suffisant et pertinent
    } else if (candidateYears >= requiredMinYears) {
      experienceScore = 40; // Années suffisantes mais pas pertinentes
    } else if (relevantExperienceYears > 0) {
      experienceScore = 50; // Peu d'expérience mais pertinente
    } else if (candidateYears > 0) {
      experienceScore = 25; // Expérience générale mais pas pertinente
    } else {
      experienceScore = 5; // Aucune expérience
    }
    
    return {
      score: experienceScore,
      relevantYears: relevantExperienceYears,
      totalYears: candidateYears,
      relevantCount: relevantExperienceCount,
      totalCount: Array.isArray(experiences) ? experiences.length : 0,
      relevantExperiences,
      meetsMinimum: relevantExperienceYears >= requiredMinYears,
      isOverqualified: relevantExperienceYears > requiredMaxYears + 3
    };
  }

  /**
   * NOUVEAU: Analyse critique pour détecter les disqualifications
   */
  private performCriticalAnalysis(skillsAnalysis: any, experienceAnalysis: any, otherFactors: any, context: any) {
    const criticalIssues: string[] = [];
    const disqualifiers: string[] = [];
    
    // Analyse critique des compétences
    if (skillsAnalysis.matchPercentage < 0.2) {
      disqualifiers.push(`Seulement ${Math.round(skillsAnalysis.matchPercentage * 100)}% des compétences requises`);
    } else if (skillsAnalysis.matchPercentage < 0.4) {
      criticalIssues.push(`Compétences insuffisantes: ${Math.round(skillsAnalysis.matchPercentage * 100)}% couvertes`);
    }
    
    if (skillsAnalysis.missingCriticalSkills.length > skillsAnalysis.totalRequired * 0.6) {
      criticalIssues.push(`Nombreuses compétences manquantes: ${skillsAnalysis.missingCriticalSkills.length}`);
    }
    
    // Analyse critique de l'expérience
    if (experienceAnalysis.relevantYears === 0 && experienceAnalysis.totalYears < 1) {
      if (context.seniorityLevel !== 'junior') {
        disqualifiers.push('Aucune expérience pertinente');
      }
    } else if (experienceAnalysis.relevantYears < experienceAnalysis.totalYears * 0.3) {
      criticalIssues.push('Expérience peu pertinente pour le poste');
    }
    
    // Analyse des sur-qualifications problématiques
    if (experienceAnalysis.isOverqualified && skillsAnalysis.score < 60) {
      criticalIssues.push('Surqualifié en expérience mais compétences inadéquates');
    }
    
    return {
      criticalIssues,
      disqualifiers,
      hasCriticalIssues: criticalIssues.length > 0,
      isDisqualified: disqualifiers.length > 0
    };
  }

  /**
   * NOUVEAU: Détermination de la qualité du match
   */
  private determineMatchQuality(
    overallScore: number, 
    skillsAnalysis: any, 
    criticalAnalysis: any
  ): IntelligentMatchResult['matchQuality'] {
    
    if (criticalAnalysis.isDisqualified || overallScore < 25) {
      return 'unqualified';
    }
    
    if (criticalAnalysis.hasCriticalIssues || overallScore < 50) {
      return 'poor';
    }
    
    if (skillsAnalysis.matchPercentage < 0.6 || overallScore < 70) {
      return 'fair';
    }
    
    if (skillsAnalysis.matchPercentage >= 0.8 && overallScore >= 85) {
      return 'excellent';
    }
    
    return 'good';
  }

  private generateCacheKey(candidate: CandidateData, jobOffer: JobOffer): string {
    return `match_${candidate.id}_${jobOffer.id}_v2`; // v2 for revised algorithm
  }
  
  private isCacheValid(cached: IntelligentMatchResult, candidate: CandidateData, jobOffer: JobOffer): boolean {
    const cacheAge = Date.now() - new Date(cached.calculatedAt).getTime();
    const maxAge = 1000 * 60 * 60 * 2; // 2 hours
    return cacheAge < maxAge;
  }
  
  private calculateAdaptiveTTL(result: IntelligentMatchResult): number {
    // Shorter TTL for poor matches (they might need frequent recalculation)
    if (result.matchQuality === 'poor' || result.matchQuality === 'unqualified') {
      return 1000 * 60 * 30; // 30 minutes
    }
    return 1000 * 60 * 60 * 4; // 4 hours for good matches
  }
  
  private updateMetrics(processingTime: number): void {
    this.metrics.processedCandidates++;
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTime = this.metrics.totalProcessingTime / this.metrics.processedCandidates;
  }

  /**
   * Obtenir les métriques de performance
   */
  getMetrics() {
    return {
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      avgProcessingTime: this.metrics.averageProcessingTime,
      totalMatches: this.metrics.processedCandidates
    };
  }

  /**
   * Optimiser le cache
   */
  async optimizeCache() {
    try {
      return Promise.resolve(); // Simplified cache optimization
    } catch (error) {
      console.error('Error optimizing cache:', error);
      return Promise.resolve();
    }
  }

  /**
   * Vérification de similarité sémantique améliorée
   */
  private isSkillSemanticallyRelated(skill1: string, skill2: string): boolean {
    const s1 = skill1.toLowerCase();
    const s2 = skill2.toLowerCase();
    
    // Mapping sémantique étendu
    const semanticMap: Record<string, string[]> = {
      'javascript': ['js', 'node.js', 'nodejs', 'react', 'vue', 'angular', 'typescript', 'es6'],
      'typescript': ['ts', 'javascript', 'js', 'angular', 'react'],
      'react': ['reactjs', 'react.js', 'jsx', 'javascript', 'frontend'],
      'vue': ['vuejs', 'vue.js', 'vue3', 'javascript', 'frontend'],
      'angular': ['angularjs', 'ng', 'typescript', 'javascript', 'frontend'],
      'python': ['py', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'data science'],
      'java': ['spring', 'springboot', 'hibernate', 'jvm', 'maven', 'gradle'],
      'csharp': ['c#', '.net', 'dotnet', 'asp.net', 'visual studio'],
      'sql': ['mysql', 'postgresql', 'postgres', 'oracle', 'mssql', 'database', 'rdbms'],
      'nosql': ['mongodb', 'mongo', 'cassandra', 'redis', 'dynamodb', 'elasticsearch'],
      'aws': ['amazon web services', 'ec2', 's3', 'lambda', 'cloudformation', 'iam'],
      'azure': ['microsoft azure', 'azure devops', 'azure functions'],
      'docker': ['containerization', 'containers', 'dockerfile'],
      'kubernetes': ['k8s', 'kubectl', 'helm', 'orchestration'],
      'devops': ['ci/cd', 'jenkins', 'gitlab ci', 'github actions', 'automation'],
      'machine learning': ['ml', 'ai', 'artificial intelligence', 'tensorflow', 'pytorch', 'scikit-learn'],
      'data science': ['data analysis', 'analytics', 'statistics', 'pandas', 'numpy'],
      'project management': ['gestion de projet', 'pmp', 'prince2', 'scrum master'],
      'agile': ['scrum', 'kanban', 'lean', 'sprint'],
      'frontend': ['front-end', 'ui', 'ux', 'html', 'css', 'javascript'],
      'backend': ['back-end', 'server-side', 'api', 'microservices'],
      'fullstack': ['full-stack', 'frontend', 'backend', 'mean', 'mern']
    };
    
    // Vérification bidirectionnelle
    for (const [key, variants] of Object.entries(semanticMap)) {
      if ((s1.includes(key) && variants.some(v => s2.includes(v))) ||
          (s2.includes(key) && variants.some(v => s1.includes(v))) ||
          (variants.some(v => s1.includes(v)) && s2.includes(key)) ||
          (variants.some(v => s2.includes(v)) && s1.includes(key))) {
        return true;
      }
    }
    
    return false;
  }
  
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

    // Détection de l'urgence
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
  
  private analyzeOtherFactors(candidate: CandidateData, jobOffer: JobOffer, context: any) {
    // Education analysis
    const education = candidate.education || [];
    let educationScore = 50; // Default
    
    if (Array.isArray(education) && education.length > 0) {
      const hasRelevantEducation = education.some((edu: any) => {
        const degree = (edu.degree || '').toLowerCase();
        const field = (edu.field || edu.field_of_study || '').toLowerCase();
        return this.isEducationRelevant(degree, field, jobOffer.title || '', context);
      });
      
      educationScore = hasRelevantEducation ? 85 : 60;
    } else {
      educationScore = 30; // Penalty for missing education
    }
    
    // Location analysis
    let locationScore = 50;
    const candidateLocation = candidate.location?.toLowerCase() || '';
    const jobLocation = jobOffer.location?.toLowerCase() || '';
    
    if (candidateLocation && jobLocation) {
      if (candidateLocation === jobLocation || 
          candidateLocation.includes(jobLocation) || 
          jobLocation.includes(candidateLocation)) {
        locationScore = 90;
      } else if (candidate.mobility?.toLowerCase().includes('oui')) {
        locationScore = 70;
      } else {
        locationScore = 30;
      }
    }
    
    return {
      education: educationScore,
      location: locationScore,
      cultural: 50, // Default
      adaptability: 50 // Default
    };
  }
  
  private isEducationRelevant(degree: string, field: string, jobTitle: string, context: any): boolean {
    const techFields = ['informatique', 'computer science', 'ingénieur', 'engineering'];
    const managementFields = ['management', 'gestion', 'business', 'administration'];
    
    const isTechJob = context.jobType === 'technical';
    const isManagementJob = context.jobType === 'management';
    
    if (isTechJob && techFields.some(tf => field.includes(tf) || degree.includes(tf))) {
      return true;
    }
    
    if (isManagementJob && managementFields.some(mf => field.includes(mf) || degree.includes(mf))) {
      return true;
    }
    
    return false;
  }
  
  private isExperienceRelevant(expTitle: string, expDescription: string, jobTitle: string, jobDescription: string, jobSkills: any[]): boolean {
    // Check title similarity
    const titleWords = jobTitle.split(/\s+/).filter(word => word.length > 2);
    const expTitleWords = expTitle.split(/\s+/).filter(word => word.length > 2);
    
    const titleSimilarity = titleWords.some(word => 
      expTitleWords.some(expWord => expWord.includes(word) || word.includes(expWord))
    );
    
    // Check skills in experience
    const skillsInExp = jobSkills.some(skill => 
      expDescription.includes(String(skill).toLowerCase()) || 
      expTitle.includes(String(skill).toLowerCase())
    );
    
    return titleSimilarity || skillsInExp;
  }
  
  private calculateExperienceDuration(exp: any): number {
    if (exp.duration_years) return exp.duration_years;
    if (exp.start_date && exp.end_date) {
      const start = new Date(exp.start_date);
      const end = new Date(exp.end_date);
      return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
    }
    return 1; // Default duration
  }
  
  private generateRevisedRecommendations(skillsAnalysis: any, experienceAnalysis: any, otherFactors: any, context: any, criticalAnalysis: any): string[] {
    const recommendations: string[] = [];
    
    if (criticalAnalysis.isDisqualified) {
      recommendations.push('❌ Candidat non qualifié - compétences ou expérience insuffisantes');
      return recommendations;
    }
    
    if (skillsAnalysis.missingCriticalSkills.length > 0) {
      recommendations.push(`🎯 Vérifier les compétences manquantes: ${skillsAnalysis.missingCriticalSkills.slice(0, 3).join(', ')}`);
    }
    
    if (experienceAnalysis.relevantYears < experienceAnalysis.totalYears * 0.5) {
      recommendations.push('💼 Approfondir la pertinence de l\'expérience lors de l\'entretien');
    }
    
    if (skillsAnalysis.score >= 70 && experienceAnalysis.score >= 70) {
      recommendations.push('✅ Candidat prometteur - entretien technique recommandé');
    }
    
    return recommendations;
  }
  
  private identifyStrengths(breakdown: any, skillsAnalysis: any, experienceAnalysis: any): string[] {
    const strengths: string[] = [];
    
    if (skillsAnalysis.exactMatches >= skillsAnalysis.totalRequired * 0.7) {
      strengths.push('Excellent match des compétences requises');
    }
    
    if (experienceAnalysis.relevantYears > 0) {
      strengths.push(`${experienceAnalysis.relevantYears} années d'expérience pertinente`);
    }
    
    return strengths;
  }
  
  private identifyImprovements(breakdown: any, skillsAnalysis: any, criticalAnalysis: any): string[] {
    const improvements: string[] = [];
    
    if (skillsAnalysis.missingCriticalSkills.length > 0) {
      improvements.push(`Acquérir: ${skillsAnalysis.missingCriticalSkills.slice(0, 2).join(', ')}`);
    }
    
    if (criticalAnalysis.hasCriticalIssues) {
      improvements.push('Formation recommandée pour combler les lacunes');
    }
    
    return improvements;
  }
  
  private calculateRevisedConfidence(skillsAnalysis: any, experienceAnalysis: any, context: any, criticalAnalysis: any): number {
    let confidence = 70;
    
    // Higher confidence for clear matches or clear mismatches
    if (skillsAnalysis.matchPercentage >= 0.8) {
      confidence += 20;
    } else if (skillsAnalysis.matchPercentage <= 0.2) {
      confidence += 15; // High confidence in rejection
    }
    
    // Lower confidence for edge cases
    if (criticalAnalysis.hasCriticalIssues && !criticalAnalysis.isDisqualified) {
      confidence -= 10;
    }
    
    return Math.min(95, Math.max(50, confidence));
  }

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

    console.log(`🚀 REVISED Batch matching: ${candidates.length} candidats`);
    
    const results = new Map<string, IntelligentMatchResult>();
    const startTime = Date.now();

    // Use revised matching for each candidate
    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (candidate) => {
          try {
            const result = await this.matchCandidate(candidate, jobOffer, { useCache, forceRecalculation });
            return { candidateId: candidate.id!, result };
          } catch (error) {
            console.error(`Error matching candidate ${candidate.id}:`, error);
            return null;
          }
        })
      );

      batchResults.forEach(item => {
        if (item) {
          results.set(item.candidateId, item.result);
        }
      });

      const progress = ((i + batch.length) / candidates.length) * 100;
      progressCallback?.(progress, `Batch ${Math.ceil((i + batch.length) / batchSize)} terminé`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ REVISED Batch matching terminé: ${results.size} scores en ${totalTime}ms`);
    
    return results;
  }
  
  private async postProcessOptimizations(results: Map<string, IntelligentMatchResult>, jobOffer: JobOffer): Promise<void> {
    // Sort results by quality and score for optimization
    const sortedResults = Array.from(results.values()).sort((a, b) => {
      // First by match quality
      const qualityOrder = { 'excellent': 5, 'good': 4, 'fair': 3, 'poor': 2, 'unqualified': 1 };
      const qualityDiff = qualityOrder[b.matchQuality] - qualityOrder[a.matchQuality];
      if (qualityDiff !== 0) return qualityDiff;
      
      // Then by score
      return b.overallScore - a.overallScore;
    });
    
    console.log(`📈 Post-processing: ${sortedResults.length} results optimized`);
  }

  private async batchCacheRetrieval(candidates: CandidateData[], jobOffer: JobOffer): Promise<Map<string, IntelligentMatchResult>> {
    const cacheResults = new Map<string, IntelligentMatchResult>();
    
    for (const candidate of candidates) {
      const cacheKey = this.generateCacheKey(candidate, jobOffer);
      const cached = intelligentCache.get<IntelligentMatchResult>([cacheKey]);
      
      if (cached && this.isCacheValid(cached, candidate, jobOffer)) {
        cacheResults.set(candidate.id!, { ...cached, cacheHit: true });
      }
    }
    
    return cacheResults;
  }

  private createOptimizedBatches(candidates: CandidateData[], batchSize: number): CandidateData[][] {
    const batches: CandidateData[][] = [];
    
    for (let i = 0; i < candidates.length; i += batchSize) {
      batches.push(candidates.slice(i, i + batchSize));
    }
    
    return batches;
  }

  private calculateCostReduction(): number {
    if (this.metrics.processedCandidates === 0) return 0;
    
    const cacheHitRatio = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses);
    return Math.round(cacheHitRatio * 100);
  }
}

export const intelligentMatchingEngine = new IntelligentMatchingEngine();
