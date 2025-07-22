
import type { CandidateData } from '@/services/data/candidateService';
import type { JobOffer } from '@/services/data/job-offers/types';

interface LocalScoringResult {
  score: number;
  breakdown: {
    skills: number;
    experience: number;
    location: number;
    roleMatch: number;
    pmoBonus: number;
  };
  explanation: string;
  isPMOCandidate: boolean;
  isPMOJob: boolean;
}

/**
 * Service de scoring local sans IA - calcul instantané
 */
export class LocalAlgorithmicScoringService {
  
  /**
   * Mots-clés PMO (français et anglais)
   */
  private static readonly PMO_KEYWORDS = {
    titles: [
      'pmo', 'project manager', 'chef de projet', 'project leader', 'directeur de projet',
      'responsable projet', 'consultant pmo', 'ingénieur projet', 'program manager',
      'project coordinator', 'gestionnaire de projet'
    ],
    skills: [
      'project management', 'gestion de projet', 'pmp', 'prince2', 'planisware',
      'microsoft project', 'ms project', 'gantt', 'planning', 'planification',
      'agile', 'scrum', 'risk management', 'gestion des risques', 'budget management',
      'gestion budgétaire', 'stakeholder management', 'reporting', 'dashboard'
    ]
  };

  /**
   * Détecte si un candidat est PMO
   */
  private isPMOCandidate(candidate: CandidateData): boolean {
    const position = (candidate.position || '').toLowerCase();
    const skills = Array.isArray(candidate.skills) ? candidate.skills.map(s => typeof s === 'string' ? s.toLowerCase() : String(s).toLowerCase()) : [];
    const company = (candidate.company || '').toLowerCase();
    
    // Vérifier le poste
    const titleMatch = LocalAlgorithmicScoringService.PMO_KEYWORDS.titles.some(keyword => 
      position.includes(keyword)
    );
    
    // Vérifier les compétences
    const skillsMatch = LocalAlgorithmicScoringService.PMO_KEYWORDS.skills.some(keyword =>
      skills.some(skill => skill.includes(keyword))
    );
    
    return titleMatch || skillsMatch;
  }

  /**
   * Détecte si une offre est PMO
   */
  private isPMOJob(job: JobOffer): boolean {
    const title = (job.title || '').toLowerCase();
    const requiredSkills = (job.required_skills || []).map(s => s.toLowerCase());
    const preferredSkills = (job.preferred_skills || []).map(s => s.toLowerCase());
    const allSkills = [...requiredSkills, ...preferredSkills];
    
    // Vérifier le titre
    const titleMatch = LocalAlgorithmicScoringService.PMO_KEYWORDS.titles.some(keyword => 
      title.includes(keyword)
    );
    
    // Vérifier les compétences
    const skillsMatch = LocalAlgorithmicScoringService.PMO_KEYWORDS.skills.some(keyword =>
      allSkills.some(skill => skill.includes(keyword))
    );
    
    return titleMatch || skillsMatch;
  }

  /**
   * Calcule le score de correspondance des compétences
   */
  private calculateSkillsScore(candidateSkills: string[], jobSkills: string[]): number {
    if (!candidateSkills.length || !jobSkills.length) return 0;
    
    const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase().trim());
    const normalizedJobSkills = jobSkills.map(s => s.toLowerCase().trim());
    
    let matches = 0;
    
    for (const jobSkill of normalizedJobSkills) {
      const hasMatch = normalizedCandidateSkills.some(candidateSkill => {
        // Correspondance exacte
        if (candidateSkill === jobSkill) return true;
        
        // Correspondance partielle
        if (candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)) return true;
        
        // Équivalences PMO spécifiques
        if (this.areEquivalentSkills(candidateSkill, jobSkill)) return true;
        
        return false;
      });
      
      if (hasMatch) matches++;
    }
    
    return Math.round((matches / normalizedJobSkills.length) * 100);
  }

  /**
   * Vérifie les équivalences entre compétences
   */
  private areEquivalentSkills(skill1: string, skill2: string): boolean {
    const equivalences = [
      ['project management', 'gestion de projet', 'chef de projet'],
      ['pmo', 'project management office'],
      ['planning', 'planification', 'gantt'],
      ['agile', 'scrum', 'méthode agile'],
      ['ms project', 'microsoft project', 'project'],
      ['risk management', 'gestion des risques'],
      ['budget management', 'gestion budgétaire']
    ];
    
    for (const group of equivalences) {
      if (group.includes(skill1) && group.includes(skill2)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calcule le score d'expérience
   */
  private calculateExperienceScore(candidateYears: number, minYears: number, maxYears: number): number {
    if (!candidateYears) return 0;
    
    if (candidateYears >= minYears && candidateYears <= maxYears) {
      return 100; // Parfait
    } else if (candidateYears > maxYears) {
      return Math.max(70, 100 - (candidateYears - maxYears) * 5); // Surqualifié
    } else if (candidateYears > 0) {
      return Math.max(30, (candidateYears / minYears) * 70); // Sous-qualifié
    }
    
    return 0;
  }

  /**
   * Calcule le score de localisation
   */
  private calculateLocationScore(candidateLocation: string, jobLocation: string): number {
    if (!candidateLocation || !jobLocation) return 50; // Score neutre si pas d'info
    
    const candLoc = candidateLocation.toLowerCase();
    const jobLoc = jobLocation.toLowerCase();
    
    if (candLoc === jobLoc) return 100;
    if (candLoc.includes(jobLoc) || jobLoc.includes(candLoc)) return 80;
    
    // Vérifier les grandes villes françaises
    const majorCities = ['paris', 'lyon', 'marseille', 'toulouse', 'nice', 'bordeaux'];
    const candInMajor = majorCities.some(city => candLoc.includes(city));
    const jobInMajor = majorCities.some(city => jobLoc.includes(city));
    
    if (candInMajor && jobInMajor) return 60;
    
    return 40;
  }

  /**
   * Calcule le bonus PMO
   */
  private calculatePMOBonus(candidate: CandidateData, job: JobOffer): number {
    const isPMOCand = this.isPMOCandidate(candidate);
    const isPMOJob = this.isPMOJob(job);
    
    if (!isPMOJob) return 0; // Pas de bonus si ce n'est pas un job PMO
    
    if (!isPMOCand) return -20; // Malus si pas PMO pour un job PMO
    
    const position = (candidate.position || '').toLowerCase();
    
    // Bonus spécifiques selon le niveau
    if (position.includes('project leader') || position.includes('chef de projet senior')) {
      return 20; // Simon Prost
    } else if (position.includes('consultant pmo') || position.includes('consultant')) {
      return 15; // Adrien Lacorte
    } else if (position.includes('pmo') || position.includes('project manager')) {
      return 10;
    }
    
    return 5; // Bonus minimal pour profil PMO
  }

  /**
   * Calcule le score final
   */
  calculateScore(candidate: CandidateData, job: JobOffer): LocalScoringResult {
    console.log(`[Local Scoring] 🎯 Calculating for: ${candidate.first_name} ${candidate.last_name}`);
    
    const isPMOCand = this.isPMOCandidate(candidate);
    const isPMOJob = this.isPMOJob(job);
    
    // Scores de base
    const skillsScore = this.calculateSkillsScore(
      Array.isArray(candidate.skills) ? candidate.skills.map(s => String(s)) : [],
      [...(job.required_skills || []), ...(job.preferred_skills || [])]
    );
    
    const experienceScore = this.calculateExperienceScore(
      candidate.years_experience || 0,
      job.experience_years_min || 0,
      job.experience_years_max || 10
    );
    
    const locationScore = this.calculateLocationScore(
      candidate.location || '',
      job.location || ''
    );
    
    // Score de correspondance de rôle
    const roleMatchScore = isPMOCand && isPMOJob ? 90 : (isPMOCand || isPMOJob ? 50 : 70);
    
    // Bonus/Malus PMO
    const pmoBonus = this.calculatePMOBonus(candidate, job);
    
    // Calcul du score final (pondéré)
    const baseScore = (
      skillsScore * 0.4 +
      experienceScore * 0.25 +
      locationScore * 0.15 +
      roleMatchScore * 0.2
    );
    
    const finalScore = Math.max(0, Math.min(100, baseScore + pmoBonus));
    
    const breakdown = {
      skills: skillsScore,
      experience: experienceScore,
      location: locationScore,
      roleMatch: roleMatchScore,
      pmoBonus
    };
    
    const explanation = this.generateExplanation(candidate, job, breakdown, isPMOCand, isPMOJob);
    
    console.log(`[Local Scoring] ✅ ${candidate.first_name} ${candidate.last_name}: ${Math.round(finalScore)}% (PMO: ${isPMOCand})`);
    
    return {
      score: Math.round(finalScore),
      breakdown,
      explanation,
      isPMOCandidate: isPMOCand,
      isPMOJob
    };
  }

  /**
   * Génère l'explication du score
   */
  private generateExplanation(
    candidate: CandidateData, 
    job: JobOffer, 
    breakdown: any, 
    isPMOCand: boolean, 
    isPMOJob: boolean
  ): string {
    const parts = [];
    
    parts.push(`Compétences: ${breakdown.skills}%`);
    parts.push(`Expérience: ${breakdown.experience}%`);
    parts.push(`Localisation: ${breakdown.location}%`);
    
    if (isPMOJob && isPMOCand) {
      parts.push(`✅ Profil PMO parfait pour ce poste (+${breakdown.pmoBonus}%)`);
    } else if (isPMOJob && !isPMOCand) {
      parts.push(`❌ Profil non-PMO pour un poste PMO (${breakdown.pmoBonus}%)`);
    } else if (isPMOCand) {
      parts.push(`🎯 Profil PMO expérimenté`);
    }
    
    return parts.join(' | ');
  }

  /**
   * Filtre les candidats selon le seuil
   */
  filterCandidates(results: Array<{ candidate: CandidateData; score: LocalScoringResult }>): Array<{ candidate: CandidateData; score: LocalScoringResult }> {
    return results
      .filter(result => result.score.score >= 30) // Seuil minimum
      .sort((a, b) => b.score.score - a.score.score); // Tri par score décroissant
  }
}

export const localAlgorithmicScoringService = new LocalAlgorithmicScoringService();
