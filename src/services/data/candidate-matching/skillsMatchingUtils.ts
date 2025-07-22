/**
 * Utilitaires pour améliorer la correspondance des compétences
 */

// Mapping de compétences similaires pour améliorer les correspondances - AMÉLIORÉ POUR PMO
export const SKILLS_MAPPING: Record<string, string[]> = {
  // PMO & Project Management - SECTION PRIORITAIRE
  'project management': ['gestion de projet', 'management de projet', 'chef de projet', 'pmo', 'project manager', 'scrum master', 'agile project management'],
  'gestion de projet': ['project management', 'management de projet', 'chef de projet', 'pmo', 'project manager', 'pilotage de projet'],
  'pmo': ['project management office', 'project management', 'gestion de projet', 'chef de projet', 'project manager'],
  'chef de projet': ['project manager', 'project management', 'gestion de projet', 'pmo', 'responsable projet'],
  'project manager': ['chef de projet', 'project management', 'gestion de projet', 'pmo', 'responsable projet'],
  'scrum master': ['agile', 'scrum', 'project management', 'gestion de projet', 'agile coach'],
  'planification': ['planning', 'project planning', 'scheduling', 'gestion planning'],
  'planning': ['planification', 'project planning', 'scheduling', 'gestion planning'],
  'risk management': ['gestion des risques', 'management des risques', 'analyse des risques'],
  'gestion des risques': ['risk management', 'management des risques', 'analyse des risques'],
  'budget management': ['gestion budgétaire', 'suivi budgétaire', 'contrôle budgétaire'],
  'gestion budgétaire': ['budget management', 'suivi budgétaire', 'contrôle budgétaire'],
  'stakeholder management': ['gestion des parties prenantes', 'management stakeholders'],
  'gestion des parties prenantes': ['stakeholder management', 'management stakeholders'],
  
  // Outils PMO
  'ms project': ['microsoft project', 'project', 'msp'],
  'microsoft project': ['ms project', 'project', 'msp'],
  'jira': ['atlassian jira', 'jira software', 'issue tracking'],
  'confluence': ['atlassian confluence', 'documentation', 'wiki'],
  'trello': ['kanban', 'task management', 'project tracking'],
  'asana': ['task management', 'project management tool'],
  'monday': ['monday.com', 'project management tool'],
  'smartsheet': ['project management tool', 'collaborative work'],
  
  // Méthodologies PMO
  'prince2': ['project management methodology', 'prince 2'],
  'pmp': ['project management professional', 'pmi'],
  'agile': ['scrum', 'kanban', 'project management', 'user stories'],
  'scrum': ['agile', 'sprint planning', 'scrum master'],
  'kanban': ['lean', 'continuous flow', 'agile'],
  'waterfall': ['cascade', 'traditional project management'],
  'lean': ['lean management', 'continuous improvement'],
  
  // Frontend Frameworks
  'react': ['react.js', 'reactjs', 'react js', 'react native', 'nextjs', 'next.js'],
  'vue': ['vue.js', 'vuejs', 'vue js', 'nuxt', 'nuxt.js', 'nuxtjs'],
  'angular': ['angular.js', 'angularjs', 'angular js', 'angular2', 'angular4+'],
  'svelte': ['svelte.js', 'sveltejs', 'sveltekit'],
  
  // Backend & Languages
  'node': ['node.js', 'nodejs', 'node js', 'express', 'expressjs', 'nest', 'nestjs'],
  'javascript': ['js', 'ecmascript', 'es6', 'es2015', 'es2020', 'typescript', 'ts'],
  'typescript': ['ts', 'javascript', 'js'],
  'python': ['py', 'django', 'flask', 'fastapi', 'python3'],
  'java': ['java8', 'java11', 'java17', 'spring', 'spring boot', 'hibernate'],
  'c#': ['csharp', 'c sharp', '.net', 'dotnet', 'asp.net'],
  'c++': ['cpp', 'cplusplus', 'c plus plus'],
  'php': ['laravel', 'symfony', 'codeigniter', 'wordpress'],
  'ruby': ['ruby on rails', 'rails', 'ror'],
  'go': ['golang', 'go lang'],
  'rust': ['rust lang'],
  'kotlin': ['kotlin/jvm', 'kotlin native'],
  'swift': ['swift ui', 'swiftui', 'ios'],
  
  // Databases
  'postgresql': ['postgres', 'psql', 'pg'],
  'mongodb': ['mongo', 'mongo db', 'mongoose'],
  'mysql': ['my sql', 'mariadb'],
  'redis': ['redis cache', 'redis db'],
  'elasticsearch': ['elastic search', 'elastic', 'elk'],
  'sqlite': ['sqlite3'],
  'cassandra': ['apache cassandra'],
  'neo4j': ['neo4j graph'],
  
  // Cloud & DevOps
  'docker': ['containerization', 'containers', 'dockerfile'],
  'kubernetes': ['k8s', 'kubectl', 'helm'],
  'amazon web services': ['aws', 'ec2', 's3', 'lambda', 'cloudformation'],
  'google cloud platform': ['gcp', 'google cloud', 'firebase', 'app engine'],
  'microsoft azure': ['azure', 'azure devops', 'azure functions'],
  'terraform': ['infrastructure as code', 'iac'],
  'jenkins': ['ci/cd', 'continuous integration', 'continuous deployment'],
  'gitlab': ['gitlab ci', 'gitlab ci/cd'],
  'github': ['github actions', 'github ci'],
  
  // Frontend Technologies
  'html': ['html5', 'markup'],
  'css': ['css3', 'sass', 'scss', 'less', 'stylus'],
  'tailwind': ['tailwind css', 'tailwindcss'],
  'bootstrap': ['bootstrap css', 'bootstrap4', 'bootstrap5'],
  'webpack': ['module bundler', 'bundling'],
  'vite': ['build tool', 'bundler'],
  'babel': ['transpiler', 'js compiler'],
  
  // Testing
  'jest': ['unit testing', 'test framework'],
  'cypress': ['e2e testing', 'end to end'],
  'selenium': ['automated testing', 'web testing'],
  'junit': ['java testing', 'unit test'],
  'pytest': ['python testing'],
  
  // APIs & Protocols
  'rest': ['rest api', 'restful', 'restful api'],
  'graphql': ['graph ql', 'apollo', 'relay'],
  'soap': ['soap api', 'web services'],
  'grpc': ['grpc api', 'protocol buffers'],
  
  // Version Control
  'git': ['version control', 'github', 'gitlab', 'bitbucket'],
  'svn': ['subversion', 'version control'],
  
  // Secteurs spécifiques
  'finance': ['fintech', 'banking', 'insurance', 'trading'],
  'santé': ['healthcare', 'medical', 'pharma', 'biotech'],
  'ecommerce': ['e-commerce', 'retail', 'marketplace'],
  'transport': ['logistics', 'supply chain', 'mobility'],
  'energie': ['energy', 'renewable', 'utilities'],
  'education': ['edtech', 'e-learning', 'training'],
  
  // Data & AI
  'machine learning': ['ml', 'artificial intelligence', 'ai', 'deep learning'],
  'data science': ['data analytics', 'big data', 'data mining'],
  'tensorflow': ['tf', 'keras', 'neural networks'],
  'pytorch': ['torch', 'deep learning'],
  'pandas': ['data analysis', 'data manipulation'],
  'numpy': ['numerical computing', 'scientific computing'],
  
  // Mobile
  'react native': ['mobile development', 'cross platform'],
  'flutter': ['dart', 'mobile development'],
  'ionic': ['hybrid mobile', 'cordova'],
  'xamarin': ['cross platform mobile'],
  
  // Communication & Collaboration
  'slack': ['team communication', 'collaboration'],
  'teams': ['microsoft teams', 'collaboration'],
  'zoom': ['video conferencing', 'remote meetings'],
  'notion': ['workspace', 'documentation']
};

// Domaines de compétences pour le matching sémantique - AMÉLIORÉ POUR PMO
export const SKILL_DOMAINS: Record<string, string[]> = {
  'pmo': ['project management', 'gestion de projet', 'pmo', 'chef de projet', 'scrum master', 'planification', 'risk management', 'budget management'],
  'frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'tailwind', 'bootstrap'],
  'backend': ['node', 'python', 'java', 'c#', 'php', 'ruby', 'go', 'rust'],
  'database': ['postgresql', 'mongodb', 'mysql', 'redis', 'elasticsearch'],
  'cloud': ['aws', 'gcp', 'azure', 'docker', 'kubernetes'],
  'mobile': ['react native', 'flutter', 'ionic', 'swift', 'kotlin'],
  'data': ['machine learning', 'data science', 'tensorflow', 'pytorch', 'pandas'],
  'devops': ['docker', 'kubernetes', 'jenkins', 'terraform', 'ci/cd'],
  'testing': ['jest', 'cypress', 'selenium', 'junit'],
  'management': ['project management', 'agile', 'scrum', 'jira', 'pmo']
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
    .replace(/\bjs\b/g, 'javascript') // Remplace js isolé par javascript
    .replace(/\bts\b/g, 'typescript') // Remplace ts isolé par typescript
    .replace(/\bdb\b/g, 'database') // Remplace db isolé par database
    .replace(/\bapi\b/g, 'api') // Garde api
    .replace(/\bui\b/g, 'user interface') // Remplace ui par user interface
    .replace(/\bux\b/g, 'user experience') // Remplace ux par user experience
    .replace(/s$/, '') // Retire le s final (pluriels)
    .normalize('NFD')         // Normalise les accents
    .replace(/[\u0300-\u036f]/g, ''); // Supprime les accents
}

/**
 * Trouve les correspondances entre compétences avec variations et scoring pondéré
 */
export function findSkillMatches(
  candidateSkills: string[], 
  requiredSkills: string[] = [], 
  preferredSkills: string[] = []
): {
  matched: Array<{ candidate: string, job: string, exact: boolean, required: boolean, score: number }>;
  missing: Array<{ skill: string, required: boolean }>;
  additional: string[];
  overallScore: number;
} {
  const allJobSkills = [...requiredSkills, ...preferredSkills];
  
  const normalizedCandidateSkills = candidateSkills.map(skill => ({
    original: skill,
    normalized: normalizeSkill(skill)
  }));
  
  const normalizedJobSkills = allJobSkills.map(skill => ({
    original: skill,
    normalized: normalizeSkill(skill),
    required: requiredSkills.includes(skill)
  }));
  
  const matched: Array<{ candidate: string, job: string, exact: boolean, required: boolean, score: number }> = [];
  const matchedJobSkills = new Set<string>();
  const matchedCandidateSkills = new Set<string>();
  
  // Correspondances exactes (score: 100)
  for (const candidateSkill of normalizedCandidateSkills) {
    for (const jobSkill of normalizedJobSkills) {
      if (candidateSkill.normalized === jobSkill.normalized) {
        matched.push({
          candidate: candidateSkill.original,
          job: jobSkill.original,
          exact: true,
          required: jobSkill.required,
          score: 100
        });
        matchedJobSkills.add(jobSkill.original);
        matchedCandidateSkills.add(candidateSkill.original);
        break;
      }
    }
  }
  
  // Correspondances avec variations/synonymes (score: 90 pour PMO, 85 pour autres)
  for (const candidateSkill of normalizedCandidateSkills) {
    if (matchedCandidateSkills.has(candidateSkill.original)) continue;
    
    for (const jobSkill of normalizedJobSkills) {
      if (matchedJobSkills.has(jobSkill.original)) continue;
      
      const isRelated = isSkillsRelated(candidateSkill.normalized, jobSkill.normalized);
      
      if (isRelated) {
        // Bonus pour les correspondances PMO
        const isPMOMatch = isPMOSkill(candidateSkill.normalized) && isPMOSkill(jobSkill.normalized);
        const score = isPMOMatch ? 90 : 85;
        
        matched.push({
          candidate: candidateSkill.original,
          job: jobSkill.original,
          exact: false,
          required: jobSkill.required,
          score: score
        });
        matchedJobSkills.add(jobSkill.original);
        matchedCandidateSkills.add(candidateSkill.original);
        break;
      }
    }
  }
  
  // Correspondances de domaine (score: 60 pour PMO, 45 pour autres - RÉDUIT)
  for (const candidateSkill of normalizedCandidateSkills) {
    if (matchedCandidateSkills.has(candidateSkill.original)) continue;
    
    for (const jobSkill of normalizedJobSkills) {
      if (matchedJobSkills.has(jobSkill.original)) continue;
      
      const sameDomain = areSkillsInSameDomain(candidateSkill.normalized, jobSkill.normalized);
      
      if (sameDomain) {
        // Bonus pour le domaine PMO
        const isPMODomain = isPMOSkill(candidateSkill.normalized) && isPMOSkill(jobSkill.normalized);
        const score = isPMODomain ? 60 : 45;
        
        matched.push({
          candidate: candidateSkill.original,
          job: jobSkill.original,
          exact: false,
          required: jobSkill.required,
          score: score
        });
        matchedJobSkills.add(jobSkill.original);
        matchedCandidateSkills.add(candidateSkill.original);
        break;
      }
    }
  }
  
  // Compétences manquantes
  const missing = allJobSkills
    .filter(skill => !matchedJobSkills.has(skill))
    .map(skill => ({
      skill,
      required: requiredSkills.includes(skill)
    }));
  
  // Compétences supplémentaires
  const additional = candidateSkills.filter(skill => !matchedCandidateSkills.has(skill));
  
  // Calcul du score global pondéré
  const requiredMatches = matched.filter(m => m.required);
  const preferredMatches = matched.filter(m => !m.required);
  const requiredMissing = missing.filter(m => m.required);
  
  let overallScore = 0;
  
  if (requiredSkills.length > 0) {
    // Score pour compétences requises (70% du score)
    const requiredScore = requiredMatches.reduce((sum, match) => sum + match.score, 0) / (requiredSkills.length * 100);
    overallScore += requiredScore * 0.7 * 100;
    
    // Pénalité pour compétences requises manquantes
    overallScore -= (requiredMissing.length / requiredSkills.length) * 30;
  }
  
  if (preferredSkills.length > 0) {
    // Score pour compétences préférées (30% du score)
    const preferredScore = preferredMatches.reduce((sum, match) => sum + match.score, 0) / (preferredSkills.length * 100);
    overallScore += preferredScore * 0.3 * 100;
  }
  
  // Si pas de compétences spécifiées, utiliser toutes les correspondances
  if (requiredSkills.length === 0 && preferredSkills.length === 0) {
    overallScore = matched.length > 0 ? matched.reduce((sum, match) => sum + match.score, 0) / matched.length : 0;
  }
  
  overallScore = Math.max(0, Math.min(100, Math.round(overallScore)));
  
  return { matched, missing, additional, overallScore };
}

/**
 * Vérifie si une compétence est liée au PMO
 */
function isPMOSkill(skill: string): boolean {
  const pmoSkills = ['project management', 'gestion de projet', 'pmo', 'chef de projet', 'project manager', 
                    'scrum master', 'planification', 'planning', 'risk management', 'gestion des risques',
                    'budget management', 'gestion budgétaire', 'stakeholder management', 'prince2', 'pmp'];
  
  return pmoSkills.some(pmoSkill => skill.includes(pmoSkill) || pmoSkill.includes(skill));
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
  
  // Vérifier les correspondances partielles avec tolérance
  if (skill1.length >= 4 && skill2.length >= 4) {
    if (skill1.includes(skill2) || skill2.includes(skill1)) {
      return Math.abs(skill1.length - skill2.length) <= 3;
    }
  }
  
  return false;
}

/**
 * Vérifie si deux compétences appartiennent au même domaine
 */
function areSkillsInSameDomain(skill1: string, skill2: string): boolean {
  for (const domain of Object.values(SKILL_DOMAINS)) {
    const skill1InDomain = domain.some(domainSkill => 
      skill1.includes(domainSkill) || domainSkill.includes(skill1)
    );
    const skill2InDomain = domain.some(domainSkill => 
      skill2.includes(domainSkill) || domainSkill.includes(skill2)
    );
    
    if (skill1InDomain && skill2InDomain) {
      return true;
    }
  }
  return false;
}

/**
 * Calcule le score de correspondance des compétences avec pondération
 */
export function calculateSkillsMatchScore(
  matched: Array<{ candidate: string, job: string, exact: boolean, required: boolean, score: number }>, 
  totalRequiredSkills: number,
  totalPreferredSkills: number
): { overall: number, required: number, preferred: number } {
  const requiredMatches = matched.filter(m => m.required);
  const preferredMatches = matched.filter(m => !m.required);
  
  const requiredScore = totalRequiredSkills > 0 
    ? Math.round((requiredMatches.reduce((sum, match) => sum + match.score, 0) / (totalRequiredSkills * 100)) * 100)
    : 100;
    
  const preferredScore = totalPreferredSkills > 0 
    ? Math.round((preferredMatches.reduce((sum, match) => sum + match.score, 0) / (totalPreferredSkills * 100)) * 100)
    : 100;
  
  // Score global pondéré (70% requis, 30% préféré)
  const overall = Math.round(requiredScore * 0.7 + preferredScore * 0.3);
  
  return { overall, required: requiredScore, preferred: preferredScore };
}

/**
 * Obtient des suggestions d'amélioration pour un candidat
 */
export function getSkillsSuggestions(
  candidateSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[]
): {
  missingRequired: string[];
  missingPreferred: string[];
  suggestions: string[];
} {
  const { missing } = findSkillMatches(candidateSkills, requiredSkills, preferredSkills);
  
  const missingRequired = missing.filter(m => m.required).map(m => m.skill);
  const missingPreferred = missing.filter(m => !m.required).map(m => m.skill);
  
  const suggestions: string[] = [];
  
  if (missingRequired.length > 0) {
    suggestions.push(`Compétences requises manquantes : ${missingRequired.slice(0, 3).join(', ')}`);
  }
  
  if (missingPreferred.length > 0) {
    suggestions.push(`Compétences préférées à acquérir : ${missingPreferred.slice(0, 3).join(', ')}`);
  }
  
  // Suggestions de domaines à explorer
  const candidateNormalized = candidateSkills.map(normalizeSkill);
  for (const [domain, domainSkills] of Object.entries(SKILL_DOMAINS)) {
    const hasSkillsInDomain = domainSkills.some(skill => 
      candidateNormalized.some(candidateSkill => 
        candidateSkill.includes(skill) || skill.includes(candidateSkill)
      )
    );
    
    if (hasSkillsInDomain) {
      const missingInDomain = domainSkills.filter(skill => 
        !candidateNormalized.some(candidateSkill => 
          candidateSkill.includes(skill) || skill.includes(candidateSkill)
        )
      );
      
      if (missingInDomain.length > 0) {
        suggestions.push(`Complétez vos compétences ${domain} avec : ${missingInDomain.slice(0, 2).join(', ')}`);
      }
    }
  }
  
  return { missingRequired, missingPreferred, suggestions: suggestions.slice(0, 3) };
}
