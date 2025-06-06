
/**
 * Utilitaires pour améliorer la correspondance des compétences
 */

// Mapping de compétences similaires pour améliorer les correspondances
export const SKILLS_MAPPING: Record<string, string[]> = {
  'react': ['react.js', 'reactjs', 'react js'],
  'vue': ['vue.js', 'vuejs', 'vue js'],
  'angular': ['angular.js', 'angularjs', 'angular js'],
  'node': ['node.js', 'nodejs', 'node js'],
  'javascript': ['js', 'ecmascript', 'es6', 'es2015'],
  'typescript': ['ts'],
  'python': ['py'],
  'postgresql': ['postgres', 'psql'],
  'mongodb': ['mongo', 'mongo db'],
  'elasticsearch': ['elastic search', 'elastic'],
  'docker': ['containerization'],
  'kubernetes': ['k8s'],
  'amazon web services': ['aws'],
  'google cloud platform': ['gcp', 'google cloud'],
  'microsoft azure': ['azure'],
  'c#': ['csharp', 'c sharp'],
  'c++': ['cpp', 'cplusplus'],
  'html': ['html5'],
  'css': ['css3'],
  'sql': ['structured query language'],
  'nosql': ['no sql'],
  'rest': ['rest api', 'restful'],
  'graphql': ['graph ql'],
  'git': ['version control'],
  'jenkins': ['ci/cd'],
  'agile': ['scrum', 'kanban'],
  'machine learning': ['ml', 'artificial intelligence', 'ai'],
  'data science': ['data analytics', 'big data'],
  'devops': ['dev ops']
};

/**
 * Normalise une compétence pour améliorer les correspondances
 */
export function normalizeSkill(skill: string): string {
  if (!skill) return '';
  
  return skill
    .toLowerCase()
    .trim()
    .replace(/[.\-_]/g, ' ')  // Remplace les points, tirets et underscores par des espaces
    .replace(/\s+/g, ' ')     // Normalise les espaces multiples
    .normalize('NFD')         // Normalise les accents
    .replace(/[\u0300-\u036f]/g, ''); // Supprime les accents
}

/**
 * Trouve les correspondances entre compétences avec variations
 */
export function findSkillMatches(candidateSkills: string[], jobSkills: string[]): {
  matched: Array<{ candidate: string, job: string, exact: boolean }>;
  missing: string[];
  additional: string[];
} {
  const normalizedCandidateSkills = candidateSkills.map(skill => ({
    original: skill,
    normalized: normalizeSkill(skill)
  }));
  
  const normalizedJobSkills = jobSkills.map(skill => ({
    original: skill,
    normalized: normalizeSkill(skill)
  }));
  
  const matched: Array<{ candidate: string, job: string, exact: boolean }> = [];
  const matchedJobSkills = new Set<string>();
  const matchedCandidateSkills = new Set<string>();
  
  // Correspondances exactes
  for (const candidateSkill of normalizedCandidateSkills) {
    for (const jobSkill of normalizedJobSkills) {
      if (candidateSkill.normalized === jobSkill.normalized) {
        matched.push({
          candidate: candidateSkill.original,
          job: jobSkill.original,
          exact: true
        });
        matchedJobSkills.add(jobSkill.original);
        matchedCandidateSkills.add(candidateSkill.original);
        break;
      }
    }
  }
  
  // Correspondances avec variations (mapping)
  for (const candidateSkill of normalizedCandidateSkills) {
    if (matchedCandidateSkills.has(candidateSkill.original)) continue;
    
    for (const jobSkill of normalizedJobSkills) {
      if (matchedJobSkills.has(jobSkill.original)) continue;
      
      // Vérifier si les compétences sont liées via le mapping
      const isRelated = isSkillsRelated(candidateSkill.normalized, jobSkill.normalized);
      
      if (isRelated) {
        matched.push({
          candidate: candidateSkill.original,
          job: jobSkill.original,
          exact: false
        });
        matchedJobSkills.add(jobSkill.original);
        matchedCandidateSkills.add(candidateSkill.original);
        break;
      }
    }
  }
  
  // Compétences manquantes
  const missing = jobSkills.filter(skill => !matchedJobSkills.has(skill));
  
  // Compétences supplémentaires
  const additional = candidateSkills.filter(skill => !matchedCandidateSkills.has(skill));
  
  return { matched, missing, additional };
}

/**
 * Vérifie si deux compétences sont liées via le mapping
 */
function isSkillsRelated(skill1: string, skill2: string): boolean {
  // Vérifier si skill1 est un alias de skill2
  for (const [mainSkill, aliases] of Object.entries(SKILLS_MAPPING)) {
    if (skill1 === mainSkill && aliases.includes(skill2)) return true;
    if (skill2 === mainSkill && aliases.includes(skill1)) return true;
    if (aliases.includes(skill1) && aliases.includes(skill2)) return true;
  }
  
  // Vérifier les correspondances partielles (contient)
  if (skill1.includes(skill2) || skill2.includes(skill1)) {
    return Math.abs(skill1.length - skill2.length) <= 3; // Tolérance pour éviter les faux positifs
  }
  
  return false;
}

/**
 * Calcule le score de correspondance des compétences
 */
export function calculateSkillsMatchScore(matched: Array<{ candidate: string, job: string, exact: boolean }>, totalJobSkills: number): number {
  if (totalJobSkills === 0) return 100;
  
  let score = 0;
  for (const match of matched) {
    // Les correspondances exactes valent plus que les correspondances par alias
    score += match.exact ? 1 : 0.8;
  }
  
  return Math.round((score / totalJobSkills) * 100);
}
