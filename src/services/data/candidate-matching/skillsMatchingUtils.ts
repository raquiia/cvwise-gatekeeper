import type { MatchedSkill, MissingSkill, SkillsMatchResult } from './types';

interface SkillsScoreData {
  overall: number;
  required: number;
  preferred: number;
}

/**
 * Dictionnaire d'équivalences de compétences FR/EN pour PMO
 */
const PMO_SKILLS_EQUIVALENTS: Record<string, string[]> = {
  'project management': ['gestion de projet', 'gestion projet', 'management de projet', 'chef de projet'],
  'gestion de projet': ['project management', 'project manager', 'chef de projet'],
  'pmo': ['project management office', 'bureau de projet', 'bureau des projets'],
  'planification': ['planning', 'project planning', 'planification projet'],
  'planning': ['planification', 'project planning', 'planification projet'],
  'agile': ['méthode agile', 'agilité', 'scrum', 'kanban'],
  'scrum': ['agile', 'méthode agile', 'scrum master'],
  'prince2': ['prince 2', 'prince ii', 'methodology prince2'],
  'pmp': ['project management professional', 'certification pmp'],
  'ms project': ['microsoft project', 'project', 'ms-project'],
  'microsoft project': ['ms project', 'project', 'ms-project'],
  'planisware': ['planisware enterprise', 'planisware orchestra'],
  'risk management': ['gestion des risques', 'gestion risques', 'management des risques'],
  'gestion des risques': ['risk management', 'gestion risques'],
  'budget management': ['gestion budgétaire', 'gestion budget', 'contrôle budgétaire'],
  'gestion budgétaire': ['budget management', 'gestion budget'],
  'stakeholder management': ['gestion des parties prenantes', 'management parties prenantes'],
  'reporting': ['rapport', 'rapports', 'tableau de bord', 'dashboard'],
  'dashboard': ['tableau de bord', 'reporting', 'suivi projet'],
  'gantt': ['diagramme de gantt', 'planning gantt', 'chart gantt']
};

/**
 * Normalise une compétence en supprimant les accents et caractères spéciaux
 */
const normalizeSkill = (skill: string): string => {
  return skill
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, ' '); // Normalise les espaces
};

/**
 * Trouve toutes les équivalences possibles d'une compétence
 */
const getSkillEquivalents = (skill: string): string[] => {
  const normalizedSkill = normalizeSkill(skill);
  const equivalents = new Set<string>();
  
  // Ajouter la compétence originale
  equivalents.add(normalizedSkill);
  
  // Chercher dans le dictionnaire d'équivalences
  for (const [key, values] of Object.entries(PMO_SKILLS_EQUIVALENTS)) {
    const normalizedKey = normalizeSkill(key);
    const normalizedValues = values.map(normalizeSkill);
    
    if (normalizedSkill === normalizedKey) {
      normalizedValues.forEach(v => equivalents.add(v));
    } else if (normalizedValues.includes(normalizedSkill)) {
      equivalents.add(normalizedKey);
      normalizedValues.forEach(v => equivalents.add(v));
    }
  }
  
  return Array.from(equivalents);
};

/**
 * Vérifie si deux compétences correspondent (avec équivalences)
 */
const skillsMatch = (candidateSkill: string, jobSkill: string): boolean => {
  const debugMode = typeof window !== 'undefined' && (window as any).DEBUG_MATCHING;
  
  const candidateEquivalents = getSkillEquivalents(candidateSkill);
  const jobEquivalents = getSkillEquivalents(jobSkill);
  
  // Vérifier les correspondances exactes ou partielles
  for (const candEquiv of candidateEquivalents) {
    for (const jobEquiv of jobEquivalents) {
      if (candEquiv === jobEquiv || 
          candEquiv.includes(jobEquiv) || 
          jobEquiv.includes(candEquiv)) {
        
        if (debugMode) {
          console.log(`[PMO Debug] ✅ SKILL MATCH: "${candidateSkill}" ↔ "${jobSkill}" (via "${candEquiv}" ↔ "${jobEquiv}")`);
        }
        return true;
      }
    }
  }
  
  return false;
};

export const findSkillMatches = (
  candidateSkills: string[],
  jobRequiredSkills: string[],
  jobPreferredSkills: string[] = []
): SkillsMatchResult => {
  const debugMode = typeof window !== 'undefined' && (window as any).DEBUG_MATCHING;
  
  if (debugMode) {
    console.log(`[PMO Debug] 🔍 ENHANCED SKILLS MATCHING START`);
  }
  
  const matched: MatchedSkill[] = [];
  const missing: MissingSkill[] = [];
  const additional: string[] = [];
  
  // Traiter les compétences requises
  for (const jobSkill of jobRequiredSkills) {
    let found = false;
    
    for (const candidateSkill of candidateSkills) {
      if (skillsMatch(candidateSkill, jobSkill)) {
        matched.push({
          skill: candidateSkill,
          candidate: candidateSkill,
          job: jobSkill,
          type: 'required',
          matchStrength: candidateSkill.toLowerCase() === jobSkill.toLowerCase() ? 1.0 : 0.8
        });
        found = true;
        break;
      }
    }
    
    if (!found) {
      missing.push({
        skill: jobSkill,
        type: 'required',
        importance: 1.0
      });
      
      if (debugMode) {
        console.log(`[PMO Debug] ❌ MISSING REQUIRED: "${jobSkill}"`);
      }
    }
  }
  
  // Traiter les compétences préférées
  for (const jobSkill of jobPreferredSkills) {
    let found = false;
    
    for (const candidateSkill of candidateSkills) {
      if (skillsMatch(candidateSkill, jobSkill)) {
        // Éviter les doublons
        if (!matched.some(m => m.candidate === candidateSkill && m.job === jobSkill)) {
          matched.push({
            skill: candidateSkill,
            candidate: candidateSkill,
            job: jobSkill,
            type: 'preferred',
            matchStrength: candidateSkill.toLowerCase() === jobSkill.toLowerCase() ? 1.0 : 0.8
          });
        }
        found = true;
        break;
      }
    }
    
    if (!found) {
      missing.push({
        skill: jobSkill,
        type: 'preferred',
        importance: 0.7
      });
    }
  }
  
  // Identifier les compétences additionnelles du candidat
  const allJobSkills = [...jobRequiredSkills, ...jobPreferredSkills];
  for (const candidateSkill of candidateSkills) {
    let isMatched = false;
    
    for (const jobSkill of allJobSkills) {
      if (skillsMatch(candidateSkill, jobSkill)) {
        isMatched = true;
        break;
      }
    }
    
    if (!isMatched) {
      additional.push(candidateSkill);
    }
  }
  
  if (debugMode) {
    console.log(`[PMO Debug] 📊 ENHANCED SKILLS MATCHING RESULTS:`);
    console.log(`[PMO Debug] Matched: ${matched.length} | Missing: ${missing.length} | Additional: ${additional.length}`);
  }
  
  return { matched, missing, additional };
};

export const calculateSkillsMatchScore = (
  matchedSkills: MatchedSkill[],
  requiredSkillsCount: number,
  preferredSkillsCount: number
): SkillsScoreData => {
  const debugMode = typeof window !== 'undefined' && (window as any).DEBUG_MATCHING;
  
  let requiredScore = 0;
  let preferredScore = 0;
  
  // Calcul du score pour les compétences requises
  if (requiredSkillsCount > 0) {
    const matchedRequiredSkills = matchedSkills.filter(skill => skill.type === 'required');
    requiredScore = (matchedRequiredSkills.reduce((acc, skill) => acc + (skill.matchStrength || 1), 0) / requiredSkillsCount) * 100;
  } else {
    requiredScore = 70; // Si pas de compétences requises, score par défaut élevé
  }
  
  // Calcul du score pour les compétences préférées
  if (preferredSkillsCount > 0) {
    const matchedPreferredSkills = matchedSkills.filter(skill => skill.type === 'preferred');
    preferredScore = (matchedPreferredSkills.reduce((acc, skill) => acc + (skill.matchStrength || 1), 0) / preferredSkillsCount) * 100;
  } else {
    preferredScore = 30; // Si pas de compétences préférées, score par défaut moyen
  }
  
  // Combinaison des scores (70% requis, 30% préféré)
  const overall = (requiredScore * 0.7) + (preferredScore * 0.3);
  
  if (debugMode) {
    console.log(`[PMO Debug] 📊 SKILLS SCORE CALCULATION:`);
    console.log(`[PMO Debug] Required: ${requiredScore}% | Preferred: ${preferredScore}% | Overall: ${overall}%`);
  }
  
  return {
    overall: Math.round(overall),
    required: Math.round(requiredScore),
    preferred: Math.round(preferredScore)
  };
};

// Export missing functions and constants
export const SKILLS_MAPPING = PMO_SKILLS_EQUIVALENTS;
export const SKILL_DOMAINS = PMO_SKILLS_EQUIVALENTS;
export { normalizeSkill };

export const getSkillsSuggestions = (candidateSkills: string[], jobSkills: string[]): string[] => {
  const suggestions: string[] = [];
  const normalizedCandidateSkills = candidateSkills.map(normalizeSkill);
  
  jobSkills.forEach(jobSkill => {
    const normalized = normalizeSkill(jobSkill);
    if (!normalizedCandidateSkills.includes(normalized)) {
      // Find similar skills or suggest exact match
      const equivalents = Object.entries(PMO_SKILLS_EQUIVALENTS).find(([key, values]) => 
        values.includes(normalized) || key === normalized
      );
      
      if (equivalents) {
        suggestions.push(equivalents[0]);
      } else {
        suggestions.push(jobSkill);
      }
    }
  });
  
  return [...new Set(suggestions)];
};
