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
  skillsDetails: {
    matched: string[];
    missing: string[];
    additional: string[];
  };
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
   * Dictionnaire d'équivalences de compétences FR/EN pour PMO
   */
  private static readonly SKILLS_EQUIVALENCES = {
    'project management': ['gestion de projet', 'management de projet', 'chef de projet'],
    'gestion de projet': ['project management', 'project manager'],
    'planning': ['planification', 'planification stratégique', 'planification projet'],
    'planification': ['planning', 'project planning'],
    'agile': ['méthode agile', 'agilité', 'scrum'],
    'scrum': ['agile', 'méthode agile'],
    'prince2': ['prince 2', 'methodology prince2'],
    'pmp': ['project management professional', 'certification pmp'],
    'ms project': ['microsoft project', 'project'],
    'microsoft project': ['ms project', 'project'],
    'risk management': ['gestion des risques', 'gestion risques'],
    'gestion des risques': ['risk management'],
    'budget management': ['gestion budgétaire', 'contrôle budgétaire'],
    'gestion budgétaire': ['budget management'],
    'stakeholder management': ['gestion des parties prenantes'],
    'reporting': ['rapport', 'rapports', 'tableau de bord'],
    'dashboard': ['tableau de bord', 'reporting']
  };

  /**
   * Normalise une compétence
   */
  private normalizeSkill(skill: string): string {
    return skill.toLowerCase().trim();
  }

  /**
   * Vérifie si deux compétences correspondent (avec équivalences)
   */
  private skillsMatch(candidateSkill: string, jobSkill: string): boolean {
    const normalizedCandidate = this.normalizeSkill(candidateSkill);
    const normalizedJob = this.normalizeSkill(jobSkill);
    
    // Correspondance exacte
    if (normalizedCandidate === normalizedJob) return true;
    
    // Correspondance partielle
    if (normalizedCandidate.includes(normalizedJob) || normalizedJob.includes(normalizedCandidate)) {
      return true;
    }
    
    // Vérifier les équivalences
    const candidateEquivalents = LocalAlgorithmicScoringService.SKILLS_EQUIVALENCES[normalizedCandidate] || [];
    const jobEquivalents = LocalAlgorithmicScoringService.SKILLS_EQUIVALENCES[normalizedJob] || [];
    
    // Candidat correspond aux équivalents du job
    if (candidateEquivalents.includes(normalizedJob)) return true;
    
    // Job correspond aux équivalents du candidat  
    if (jobEquivalents.includes(normalizedCandidate)) return true;
    
    // Équivalents croisés
    for (const candEquiv of candidateEquivalents) {
      if (jobEquivalents.includes(candEquiv)) return true;
    }
    
    return false;
  }

  /**
   * Calcule les détails de correspondance des compétences
   */
  private calculateDetailedSkillsMatch(candidateSkills: string[], jobSkills: string[]): {
    matched: string[];
    missing: string[];
    additional: string[];
    score: number;
  } {
    const matched: string[] = [];
    const missing: string[] = [];
    const additional: string[] = [];
    
    if (!candidateSkills.length) {
      return { matched, missing: jobSkills, additional, score: 0 };
    }
    
    if (!jobSkills.length) {
      return { matched, missing, additional: candidateSkills, score: 70 };
    }
    
    // Trouver les compétences correspondantes et manquantes
    for (const jobSkill of jobSkills) {
      let found = false;
      
      for (const candidateSkill of candidateSkills) {
        if (this.skillsMatch(candidateSkill, jobSkill)) {
          if (!matched.includes(candidateSkill)) {
            matched.push(candidateSkill);
          }
          found = true;
          break;
        }
      }
      
      if (!found) {
        missing.push(jobSkill);
      }
    }
    
    // Trouver les compétences supplémentaires du candidat
    for (const candidateSkill of candidateSkills) {
      let isMatched = false;
      
      for (const jobSkill of jobSkills) {
        if (this.skillsMatch(candidateSkill, jobSkill)) {
          isMatched = true;
          break;
        }
      }
      
      if (!isMatched && !additional.includes(candidateSkill)) {
        additional.push(candidateSkill);
      }
    }
    
    // Calculer le score
    const matchPercentage = jobSkills.length > 0 ? (matched.length / jobSkills.length) * 100 : 0;
    
    return { matched, missing, additional, score: Math.round(matchPercentage) };
  }

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
    const details = this.calculateDetailedSkillsMatch(candidateSkills, jobSkills);
    return details.score;
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
    
    const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills.map(s => String(s)) : [];
    const jobSkills = [...(job.required_skills || []), ...(job.preferred_skills || [])];
    
    // Calcul détaillé des compétences
    const skillsDetails = this.calculateDetailedSkillsMatch(candidateSkills, jobSkills);
    
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
      skillsDetails.score * 0.4 +
      experienceScore * 0.25 +
      locationScore * 0.15 +
      roleMatchScore * 0.2
    );
    
    const finalScore = Math.max(0, Math.min(100, baseScore + pmoBonus));
    
    const breakdown = {
      skills: skillsDetails.score,
      experience: experienceScore,
      location: locationScore,
      roleMatch: roleMatchScore,
      pmoBonus
    };
    
    const explanation = this.generateExplanation(candidate, job, breakdown, isPMOCand, isPMOJob);
    
    console.log(`[Local Scoring] ✅ ${candidate.first_name} ${candidate.last_name}: ${Math.round(finalScore)}% (PMO: ${isPMOCand})`);
    console.log(`[Local Scoring] 📊 Skills: ${skillsDetails.matched.length} matched, ${skillsDetails.missing.length} missing`);
    
    return {
      score: Math.round(finalScore),
      breakdown,
      explanation,
      isPMOCandidate: isPMOCand,
      isPMOJob,
      skillsDetails
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
