
/**
 * Service de matching adaptatif avec intelligence contextuelle
 * Optimise la précision selon le type de poste et candidat
 */

import { CandidateData } from '../candidateService';
import { JobOffer } from '../job-offers/types';
import { findSkillMatches, calculateSkillsMatchScore, normalizeSkill } from './skillsMatchingUtils';
import { ensureStringArray } from '@/utils/candidateUtils';
import { intelligentCache } from '../../cache/intelligentCacheService';

export interface AdaptiveMatchContext {
  jobType: 'technical' | 'management' | 'commercial' | 'creative' | 'general';
  seniorityLevel: 'junior' | 'mid' | 'senior' | 'lead';
  industry: string;
  urgency: 'low' | 'medium' | 'high';
  remote: boolean;
}

export interface AdaptiveMatchResult {
  score: number;
  confidence: number;
  context: AdaptiveMatchContext;
  adaptations: string[];
  penalties: string[];
  bonuses: string[];
  recommendations: string[];
}

export class AdaptiveMatchingService {
  
  /**
   * Analyse contextuelle du poste pour adapter le scoring
   */
  private analyzeJobContext(jobOffer: JobOffer): AdaptiveMatchContext {
    const title = (jobOffer.title || '').toLowerCase();
    const description = (jobOffer.description || '').toLowerCase();
    const skills = ensureStringArray(jobOffer.required_skills).concat(
      ensureStringArray(jobOffer.preferred_skills)
    ).map(s => s.toLowerCase());
    
    // Détection du type de poste
    let jobType: AdaptiveMatchContext['jobType'] = 'general';
    
    if (skills.some(s => ['react', 'vue', 'angular', 'node', 'python', 'java'].includes(s)) ||
        title.includes('développeur') || title.includes('engineer')) {
      jobType = 'technical';
    } else if (title.includes('manager') || title.includes('chef') || title.includes('directeur')) {
      jobType = 'management';
    } else if (title.includes('commercial') || title.includes('vente') || title.includes('business')) {
      jobType = 'commercial';
    } else if (title.includes('design') || title.includes('créatif') || title.includes('graphique')) {
      jobType = 'creative';
    }
    
    // Détection du niveau de séniorité
    let seniorityLevel: AdaptiveMatchContext['seniorityLevel'] = 'mid';
    const minExp = jobOffer.experience_years_min || 0;
    
    if (minExp <= 2) seniorityLevel = 'junior';
    else if (minExp >= 8) seniorityLevel = 'senior';
    else if (title.includes('lead') || title.includes('principal')) seniorityLevel = 'lead';
    
    // Détection de l'industrie
    const industry = this.detectIndustry(description + ' ' + title);
    
    // Détection de l'urgence
    const urgency: AdaptiveMatchContext['urgency'] = 
      description.includes('urgent') || description.includes('asap') ? 'high' :
      description.includes('flexible') ? 'low' : 'medium';
    
    // Détection du remote
    const remote = title.includes('remote') || description.includes('télétravail') || 
                  description.includes('distance') || description.includes('remote');
    
    return { jobType, seniorityLevel, industry, urgency, remote };
  }

  /**
   * Détection intelligente de l'industrie
   */
  private detectIndustry(text: string): string {
    const industries = {
      'tech': ['startup', 'tech', 'digital', 'software', 'saas'],
      'finance': ['banque', 'finance', 'assurance', 'trading', 'fintech'],
      'healthcare': ['santé', 'médical', 'pharma', 'biotech', 'hôpital'],
      'transport': ['transport', 'logistique', 'sncf', 'aéroport'],
      'retail': ['retail', 'e-commerce', 'distribution', 'vente'],
      'consulting': ['conseil', 'consulting', 'audit']
    };
    
    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }
    
    return 'general';
  }

  /**
   * Calcul adaptatif du score avec pondération intelligente
   */
  async calculateAdaptiveMatch(
    candidate: CandidateData,
    jobOffer: JobOffer
  ): Promise<AdaptiveMatchResult> {
    
    const cacheKey = ['adaptive_match', candidate.id, jobOffer.id];
    
    return intelligentCache.conditionalSet(
      cacheKey,
      async () => this.performAdaptiveCalculation(candidate, jobOffer),
      (cached) => cached !== null,
      1000 * 60 * 30 // Cache 30 minutes
    );
  }

  /**
   * Calcul adaptatif complet
   */
  private async performAdaptiveCalculation(
    candidate: CandidateData,
    jobOffer: JobOffer
  ): Promise<AdaptiveMatchResult> {
    
    const context = this.analyzeJobContext(jobOffer);
    const adaptations: string[] = [];
    const penalties: string[] = [];
    const bonuses: string[] = [];
    const recommendations: string[] = [];
    
    // Analyse des compétences avec scoring adaptatif
    const candidateSkills = ensureStringArray(candidate.skills);
    const requiredSkills = ensureStringArray(jobOffer.required_skills);
    const preferredSkills = ensureStringArray(jobOffer.preferred_skills);
    
    const skillsMatch = findSkillMatches(candidateSkills, requiredSkills, preferredSkills);
    let skillsScoreData = calculateSkillsMatchScore(
      skillsMatch.matched, 
      requiredSkills.length, 
      preferredSkills.length
    );
    
    // Adaptation du scoring selon le contexte
    let baseScore = skillsScoreData.overall;
    
    // Pondération adaptative selon le type de poste
    const weights = this.getAdaptiveWeights(context);
    
    // Score d'expérience adaptatif
    const experienceScore = this.calculateAdaptiveExperienceScore(
      candidate, jobOffer, context, adaptations, penalties, bonuses
    );
    
    // Score de localisation adaptatif
    const locationScore = this.calculateAdaptiveLocationScore(
      candidate, jobOffer, context, adaptations, penalties, bonuses
    );
    
    // Score d'éducation adaptatif
    const educationScore = this.calculateAdaptiveEducationScore(
      candidate, jobOffer, context, adaptations, penalties, bonuses
    );
    
    // Score de compétences transférables
    const transferableScore = this.calculateTransferableSkillsScore(
      candidate, jobOffer, context, adaptations, bonuses
    );
    
    // Calcul du score final pondéré
    let finalScore = Math.round(
      baseScore * weights.skills +
      experienceScore * weights.experience +
      locationScore * weights.location +
      educationScore * weights.education +
      transferableScore * weights.transferable
    );
    
    // Bonus sectoriels
    const sectorBonus = this.calculateSectorBonus(candidate, jobOffer, context);
    if (sectorBonus > 0) {
      finalScore += sectorBonus;
      bonuses.push(`Bonus sectoriel: +${sectorBonus} points`);
    }
    
    // Pénalités et bonus temporels
    const temporalAdjustment = this.calculateTemporalAdjustment(candidate, context);
    finalScore += temporalAdjustment;
    if (temporalAdjustment !== 0) {
      (temporalAdjustment > 0 ? bonuses : penalties)
        .push(`Ajustement temporel: ${temporalAdjustment > 0 ? '+' : ''}${temporalAdjustment}`);
    }
    
    // Génération de recommandations
    this.generateRecommendations(
      candidate, jobOffer, context, skillsMatch, recommendations
    );
    
    // Calcul de la confiance
    const confidence = this.calculateConfidence(
      skillsMatch, candidate, jobOffer, context
    );
    
    finalScore = Math.max(0, Math.min(100, finalScore));
    
    return {
      score: finalScore,
      confidence,
      context,
      adaptations,
      penalties,
      bonuses,
      recommendations
    };
  }

  /**
   * Poids adaptatifs selon le contexte
   */
  private getAdaptiveWeights(context: AdaptiveMatchContext): Record<string, number> {
    const base = { skills: 0.45, experience: 0.25, location: 0.1, education: 0.15, transferable: 0.05 };
    
    switch (context.jobType) {
      case 'technical':
        return { ...base, skills: 0.55, experience: 0.3, education: 0.1, location: 0.05 };
      case 'management':
        return { ...base, experience: 0.4, skills: 0.3, education: 0.2, location: 0.1 };
      case 'commercial':
        return { ...base, experience: 0.35, transferable: 0.15, skills: 0.3, location: 0.15, education: 0.05 };
      case 'creative':
        return { ...base, skills: 0.5, transferable: 0.2, experience: 0.2, education: 0.05, location: 0.05 };
      default:
        return base;
    }
  }

  /**
   * Score d'expérience adaptatif selon le contexte
   */
  private calculateAdaptiveExperienceScore(
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: AdaptiveMatchContext,
    adaptations: string[],
    penalties: string[],
    bonuses: string[]
  ): number {
    const candidateExp = candidate.years_experience || 0;
    const requiredMin = jobOffer.experience_years_min || 0;
    const requiredMax = jobOffer.experience_years_max;
    
    let score = 50; // Base
    
    // Logique adaptative selon le niveau
    if (context.seniorityLevel === 'junior' && candidateExp <= 3) {
      score = candidateExp >= requiredMin ? 90 : Math.max(60, candidateExp * 20);
      adaptations.push('Scoring junior appliqué');
    } else if (context.seniorityLevel === 'senior' && candidateExp >= 8) {
      score = 95;
      bonuses.push('Profil senior confirmé');
    } else if (candidateExp >= requiredMin && (!requiredMax || candidateExp <= requiredMax)) {
      score = 100;
    } else if (candidateExp > (requiredMax || requiredMin + 5)) {
      // Surqualification - moins pénalisante selon l'urgence
      const penalty = context.urgency === 'high' ? 5 : 15;
      score = 100 - penalty;
      if (penalty > 5) penalties.push('Possible surqualification');
    } else if (candidateExp < requiredMin) {
      const gap = requiredMin - candidateExp;
      score = Math.max(20, 70 - (gap * 15));
      if (gap > 2) penalties.push(`Manque ${gap} années d'expérience`);
    }
    
    return score;
  }

  /**
   * Score de localisation adaptatif
   */
  private calculateAdaptiveLocationScore(
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: AdaptiveMatchContext,
    adaptations: string[],
    penalties: string[],
    bonuses: string[]
  ): number {
    if (context.remote) {
      bonuses.push('Poste remote - localisation non critique');
      return 95;
    }
    
    const candidateLocation = normalizeSkill(candidate.location || '');
    const jobLocation = normalizeSkill(jobOffer.location || '');
    
    if (!candidateLocation || !jobLocation) return 50;
    
    if (candidateLocation === jobLocation) {
      bonuses.push('Localisation parfaite');
      return 100;
    }
    
    // Analyse de proximité géographique (simplifiée)
    const proximity = this.calculateLocationProximity(candidateLocation, jobLocation);
    let score = 30 + (proximity * 50);
    
    // Adaptation selon la mobilité déclarée
    const mobility = (candidate.mobility || '').toLowerCase();
    if (mobility.includes('oui') || mobility.includes('flexible')) {
      score += 20;
      bonuses.push('Mobilité déclarée');
    }
    
    return Math.min(100, score);
  }

  /**
   * Calcul de proximité géographique simplifié
   */
  private calculateLocationProximity(loc1: string, loc2: string): number {
    // Régions françaises proches
    const regions = {
      'paris': ['ile-de-france', 'val-de-marne', 'hauts-de-seine', 'seine'],
      'lyon': ['rhone', 'rhone-alpes', 'auvergne'],
      'marseille': ['bouches-du-rhone', 'paca', 'provence'],
      'lille': ['nord', 'hauts-de-france'],
      'toulouse': ['haute-garonne', 'occitanie', 'midi-pyrenees']
    };
    
    for (const [city, areas] of Object.entries(regions)) {
      const loc1InArea = loc1.includes(city) || areas.some(area => loc1.includes(area));
      const loc2InArea = loc2.includes(city) || areas.some(area => loc2.includes(area));
      if (loc1InArea && loc2InArea) return 0.8;
    }
    
    // Pays voisins
    const neighbors = ['suisse', 'belgique', 'luxembourg'];
    const loc1Foreign = neighbors.some(country => loc1.includes(country));
    const loc2Foreign = neighbors.some(country => loc2.includes(country));
    
    if (loc1Foreign && loc2Foreign) return 0.6;
    if ((loc1Foreign || loc2Foreign) && !(loc1Foreign && loc2Foreign)) return 0.3;
    
    return 0.1;
  }

  /**
   * Score d'éducation adaptatif
   */
  private calculateAdaptiveEducationScore(
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: AdaptiveMatchContext,
    adaptations: string[],
    penalties: string[],
    bonuses: string[]
  ): number {
    const hasEducation = candidate.education && 
      Array.isArray(candidate.education) && 
      candidate.education.length > 0;
    
    // Pour les postes techniques juniors, l'éducation est plus importante
    if (context.jobType === 'technical' && context.seniorityLevel === 'junior') {
      if (hasEducation) {
        bonuses.push('Formation technique valorisée');
        return 90;
      } else {
        penalties.push('Formation technique manquante');
        return 30;
      }
    }
    
    // Pour les postes seniors, l'expérience prime sur l'éducation
    if (context.seniorityLevel === 'senior') {
      adaptations.push('Éducation moins critique pour profil senior');
      return hasEducation ? 80 : 60;
    }
    
    return hasEducation ? 75 : 45;
  }

  /**
   * Score des compétences transférables
   */
  private calculateTransferableSkillsScore(
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: AdaptiveMatchContext,
    adaptations: string[],
    bonuses: string[]
  ): number {
    const candidateSkills = ensureStringArray(candidate.skills);
    
    // Compétences transférables par domaine
    const transferableMap = {
      'technical': ['problem solving', 'analytical thinking', 'team work'],
      'management': ['leadership', 'communication', 'strategic thinking'],
      'commercial': ['negotiation', 'customer service', 'presentation'],
      'creative': ['creativity', 'innovation', 'artistic vision']
    };
    
    const relevantTransferable = transferableMap[context.jobType] || [];
    const transferableFound = candidateSkills.filter(skill => 
      relevantTransferable.some(t => normalizeSkill(skill).includes(t))
    );
    
    if (transferableFound.length > 0) {
      bonuses.push(`Compétences transférables: ${transferableFound.length}`);
      adaptations.push('Compétences transférables valorisées');
      return Math.min(90, 40 + (transferableFound.length * 15));
    }
    
    return 30;
  }

  /**
   * Bonus sectoriel selon l'industrie
   */
  private calculateSectorBonus(
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: AdaptiveMatchContext
  ): number {
    const candidateIndustries = ensureStringArray(candidate.industries || []);
    const candidateCompany = (candidate.company || '').toLowerCase();
    
    if (context.industry === 'tech' && 
        (candidateIndustries.includes('tech') || candidateCompany.includes('tech'))) {
      return 5;
    }
    
    if (context.industry === 'finance' && 
        (candidateIndustries.includes('finance') || candidateCompany.includes('banque'))) {
      return 5;
    }
    
    return 0;
  }

  /**
   * Ajustement temporel selon la fraîcheur des données
   */
  private calculateTemporalAdjustment(
    candidate: CandidateData,
    context: AdaptiveMatchContext
  ): number {
    const lastUpdate = candidate.last_updated_at || candidate.updated_at;
    if (!lastUpdate) return 0;
    
    const daysSinceUpdate = (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24);
    
    // Pénalité pour données anciennes selon l'urgence
    if (context.urgency === 'high' && daysSinceUpdate > 30) {
      return -3;
    } else if (daysSinceUpdate > 90) {
      return -2;
    } else if (daysSinceUpdate <= 7) {
      return 2; // Bonus pour données récentes
    }
    
    return 0;
  }

  /**
   * Génération de recommandations contextuelles
   */
  private generateRecommendations(
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: AdaptiveMatchContext,
    skillsMatch: any,
    recommendations: string[]
  ): void {
    
    // Recommandations selon les compétences manquantes
    if (skillsMatch.missing.length > 0) {
      const criticalMissing = skillsMatch.missing.filter((m: any) => m.required).slice(0, 2);
      if (criticalMissing.length > 0) {
        recommendations.push(
          `Compétences critiques à acquérir: ${criticalMissing.map((m: any) => m.skill).join(', ')}`
        );
      }
    }
    
    // Recommandations selon le contexte
    if (context.jobType === 'technical' && context.seniorityLevel === 'junior') {
      recommendations.push('Candidat junior - prévoir accompagnement technique');
    }
    
    if (context.urgency === 'high' && candidate.availability) {
      recommendations.push('Disponibilité à confirmer vu l\'urgence du poste');
    }
    
    // Recommandations de valorisation
    if (skillsMatch.additional.length > 2) {
      recommendations.push(
        `Compétences bonus valorisables: ${skillsMatch.additional.slice(0, 2).join(', ')}`
      );
    }
  }

  /**
   * Calcul de la confiance dans le matching
   */
  private calculateConfidence(
    skillsMatch: any,
    candidate: CandidateData,
    jobOffer: JobOffer,
    context: AdaptiveMatchContext
  ): number {
    let confidence = 70; // Base
    
    // Plus de compétences = plus de confiance
    const totalSkills = ensureStringArray(candidate.skills).length;
    confidence += Math.min(15, totalSkills * 2);
    
    // Données complètes = plus de confiance
    const completeness = [
      candidate.years_experience,
      candidate.location,
      candidate.education
    ].filter(Boolean).length;
    confidence += completeness * 5;
    
    // Type de poste connu = plus de confiance
    if (context.jobType !== 'general') confidence += 5;
    
    return Math.min(95, confidence);
  }
}

export const adaptiveMatchingService = new AdaptiveMatchingService();
