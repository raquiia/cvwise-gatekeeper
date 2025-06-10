
/**
 * Service de matching sémantique amélioré pour l'ATS
 */

import { SKILLS_MAPPING, SKILL_DOMAINS, normalizeSkill } from '../data/candidate-matching/skillsMatchingUtils';

type SemanticMatchContext = {
  query: string;
  candidateText: string;
  threshold?: number;
  useAdvanced?: boolean;
};

type SectorKeywords = {
  [sector: string]: string[];
};

// Mots-clés sectoriels étendus
const SECTOR_KEYWORDS: SectorKeywords = {
  'ferroviaire': [
    'sncf', 'train', 'rail', 'chemin de fer', 'tgv', 'ter', 'fret', 'locomotive',
    'signalisation', 'infrastructure ferroviaire', 'maintenance ferroviaire',
    'sécurité ferroviaire', 'exploitation ferroviaire', 'matériel roulant'
  ],
  'transport': [
    'sncf', 'ratp', 'transilien', 'aéroport', 'avion', 'métro', 'bus', 'tramway',
    'logistique', 'supply chain', 'transport routier', 'maritime', 'aérien',
    'multimodal', 'mobilité', 'fleet management'
  ],
  'énergie': [
    'edf', 'engie', 'total', 'renewable', 'éolien', 'solaire', 'nucléaire',
    'pétrole', 'gaz', 'électricité', 'smart grid', 'energy management',
    'utilities', 'power plant', 'distribution électrique'
  ],
  'santé': [
    'hôpital', 'clinique', 'médical', 'pharmaceutique', 'médecin', 'soins',
    'biotech', 'device médical', 'regulatory affairs', 'clinical trial',
    'pharmacovigilance', 'health tech', 'telemedicine'
  ],
  'finance': [
    'banque', 'assurance', 'crédit', 'comptabilité', 'audit', 'fintech',
    'trading', 'risk management', 'compliance', 'asset management',
    'private equity', 'venture capital', 'blockchain', 'crypto'
  ],
  'automobile': [
    'automotive', 'peugeot', 'renault', 'michelin', 'valeo', 'bosch',
    'electric vehicle', 'autonomous driving', 'adas', 'embedded systems',
    'telematics', 'connected car'
  ],
  'aéronautique': [
    'airbus', 'boeing', 'thales', 'safran', 'aviation', 'aerospace',
    'defense', 'satellite', 'avionics', 'flight systems', 'maintenance aéronautique'
  ],
  'télécoms': [
    'orange', 'bouygues', 'free', 'sfr', '5g', '4g', 'fiber optic',
    'network', 'telecommunications', 'iot', 'connectivity', 'radio frequency'
  ],
  'retail': [
    'e-commerce', 'retail', 'distribution', 'carrefour', 'auchan', 'fnac',
    'omnichannel', 'customer experience', 'merchandising', 'supply chain retail'
  ],
  'industrie': [
    'manufacturing', 'production', 'usine', 'lean', 'six sigma', 'quality',
    'automation', 'robotics', 'industry 4.0', 'plc', 'scada', 'mes'
  ]
};

// Patterns de postes avec équivalences
const JOB_TITLE_PATTERNS = {
  'chef de projet': [
    'project manager', 'gestionnaire de projet', 'responsable projet',
    'directeur de projet', 'chef de projet pmo', 'pmo', 'program manager',
    'project lead', 'project coordinator'
  ],
  'développeur': [
    'developer', 'ingénieur logiciel', 'software engineer', 'programmeur',
    'fullstack', 'développeur web', 'coder', 'software developer',
    'application developer', 'frontend developer', 'backend developer'
  ],
  'data scientist': [
    'data analyst', 'data engineer', 'machine learning engineer',
    'ai engineer', 'business analyst', 'quantitative analyst',
    'research scientist', 'data specialist'
  ],
  'consultant': [
    'conseiller', 'expert', 'specialist', 'advisor', 'senior consultant',
    'principal consultant', 'solution architect', 'business consultant'
  ],
  'architecte': [
    'solution architect', 'technical architect', 'system architect',
    'enterprise architect', 'cloud architect', 'software architect',
    'infrastructure architect'
  ],
  'ingénieur': [
    'engineer', 'technical engineer', 'system engineer', 'design engineer',
    'process engineer', 'quality engineer', 'validation engineer'
  ]
};

// Niveaux d'expérience avec synonymes
const EXPERIENCE_LEVELS = {
  'junior': ['débutant', '0-2 ans', '1-3 ans', 'peu expérimenté', 'entry level', 'graduate'],
  'intermédiaire': ['3-5 ans', '4-6 ans', 'mid-level', 'confirmed', 'expérimenté'],
  'senior': ['6+ ans', '7+ ans', '8+ ans', 'expérimenté', 'expert', 'lead', 'principal'],
  'manager': ['management', 'team lead', 'chef d\'équipe', 'responsable', 'directeur', 'head of']
};

// Diplômes avec équivalences
const EDUCATION_MAPPING = {
  'bac+5': [
    'master', 'diplôme d\'ingénieur', 'école d\'ingénieur', 'ingénieur',
    'msc', 'master of science', 'mba', 'grande école'
  ],
  'bac+3': [
    'licence', 'bachelor', 'bachelor degree', 'bts', 'dut', 'but'
  ],
  'bac+8': [
    'doctorat', 'phd', 'doctorate', 'thèse'
  ]
};

export const enhancedSemanticMatchingService = {
  /**
   * Matching sémantique amélioré avec analyse contextuelle
   */
  isSemanticMatch: ({ query, candidateText, threshold = 0.6, useAdvanced = true }: SemanticMatchContext): boolean => {
    if (!query || !candidateText) return false;
    
    const normalizedQuery = normalizeSkill(query);
    const normalizedCandidateText = normalizeSkill(candidateText);
    
    console.log(`🔍 Enhanced semantic matching: "${query}" in candidate text`);
    
    // 1. Correspondance directe (score: 1.0)
    if (normalizedCandidateText.includes(normalizedQuery)) {
      console.log(`✅ Direct match found for "${query}"`);
      return true;
    }
    
    // 2. Correspondance par compétences techniques (score: 0.9)
    const skillMatch = enhancedSemanticMatchingService.checkSkillsMatch(normalizedQuery, normalizedCandidateText);
    if (skillMatch >= threshold) {
      console.log(`✅ Skills match found for "${query}" (score: ${skillMatch})`);
      return true;
    }
    
    // 3. Correspondance sectorielle (score: 0.8)
    const sectorMatch = enhancedSemanticMatchingService.checkSectorMatch(normalizedQuery, normalizedCandidateText);
    if (sectorMatch >= threshold) {
      console.log(`✅ Sector match found for "${query}" (score: ${sectorMatch})`);
      return true;
    }
    
    // 4. Correspondance de poste (score: 0.85)
    const jobTitleMatch = enhancedSemanticMatchingService.checkJobTitleMatch(normalizedQuery, normalizedCandidateText);
    if (jobTitleMatch >= threshold) {
      console.log(`✅ Job title match found for "${query}" (score: ${jobTitleMatch})`);
      return true;
    }
    
    // 5. Correspondance d'expérience (score: 0.7)
    const experienceMatch = enhancedSemanticMatchingService.checkExperienceMatch(normalizedQuery, normalizedCandidateText);
    if (experienceMatch >= threshold) {
      console.log(`✅ Experience match found for "${query}" (score: ${experienceMatch})`);
      return true;
    }
    
    // 6. Correspondance de formation (score: 0.75)
    const educationMatch = enhancedSemanticMatchingService.checkEducationMatch(normalizedQuery, normalizedCandidateText);
    if (educationMatch >= threshold) {
      console.log(`✅ Education match found for "${query}" (score: ${educationMatch})`);
      return true;
    }
    
    if (useAdvanced) {
      // 7. Matching contextuel avancé (score: 0.65)
      const contextualMatch = enhancedSemanticMatchingService.checkContextualMatch(normalizedQuery, normalizedCandidateText);
      if (contextualMatch >= threshold) {
        console.log(`✅ Contextual match found for "${query}" (score: ${contextualMatch})`);
        return true;
      }
    }
    
    console.log(`❌ No semantic match found for "${query}"`);
    return false;
  },
  
  /**
   * Vérification de correspondance des compétences techniques
   */
  checkSkillsMatch: (query: string, candidateText: string): number => {
    const queryWords = query.split(/\s+/).filter(w => w.length > 2);
    let maxScore = 0;
    
    // Vérifier les mappings de compétences
    for (const [mainSkill, aliases] of Object.entries(SKILLS_MAPPING)) {
      const allSkillVariants = [mainSkill, ...aliases];
      
      const queryMatchScore = queryWords.reduce((score, word) => {
        return Math.max(score, allSkillVariants.reduce((variantScore, variant) => {
          if (word.includes(variant) || variant.includes(word)) {
            return Math.max(variantScore, word.length === variant.length ? 1.0 : 0.85);
          }
          return variantScore;
        }, 0));
      }, 0);
      
      if (queryMatchScore > 0) {
        const candidateMatchScore = allSkillVariants.reduce((score, variant) => {
          if (candidateText.includes(variant)) {
            return Math.max(score, 0.9);
          }
          return score;
        }, 0);
        
        maxScore = Math.max(maxScore, Math.min(queryMatchScore, candidateMatchScore));
      }
    }
    
    // Vérifier les domaines de compétences
    for (const [domain, domainSkills] of Object.entries(SKILL_DOMAINS)) {
      const queryInDomain = queryWords.some(word => 
        domainSkills.some(skill => word.includes(skill) || skill.includes(word))
      );
      
      if (queryInDomain) {
        const candidateSkillsInDomain = domainSkills.filter(skill => 
          candidateText.includes(skill)
        );
        
        if (candidateSkillsInDomain.length > 0) {
          maxScore = Math.max(maxScore, 0.85);
        }
      }
    }
    
    return maxScore;
  },
  
  /**
   * Vérification de correspondance sectorielle
   */
  checkSectorMatch: (query: string, candidateText: string): number => {
    let maxScore = 0;
    
    for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
      const queryMatchesSector = query.includes(sector) || 
        keywords.some(keyword => query.includes(keyword));
      
      if (queryMatchesSector) {
        const candidateKeywordMatches = keywords.filter(keyword => 
          candidateText.includes(keyword)
        );
        
        if (candidateKeywordMatches.length > 0) {
          const score = Math.min(0.8, 0.5 + (candidateKeywordMatches.length / keywords.length) * 0.3);
          maxScore = Math.max(maxScore, score);
        }
      }
    }
    
    return maxScore;
  },
  
  /**
   * Vérification de correspondance de titre de poste
   */
  checkJobTitleMatch: (query: string, candidateText: string): number => {
    let maxScore = 0;
    
    for (const [mainTitle, variations] of Object.entries(JOB_TITLE_PATTERNS)) {
      const allTitles = [mainTitle, ...variations];
      
      const queryMatchesTitle = allTitles.some(title => 
        query.includes(title) || title.includes(query)
      );
      
      if (queryMatchesTitle) {
        const candidateTitleMatches = allTitles.filter(title => 
          candidateText.includes(title)
        );
        
        if (candidateTitleMatches.length > 0) {
          maxScore = Math.max(maxScore, 0.85);
        }
      }
    }
    
    return maxScore;
  },
  
  /**
   * Vérification de correspondance d'expérience
   */
  checkExperienceMatch: (query: string, candidateText: string): number => {
    let maxScore = 0;
    
    for (const [level, variations] of Object.entries(EXPERIENCE_LEVELS)) {
      const queryMatchesLevel = [level, ...variations].some(variant => 
        query.includes(variant)
      );
      
      if (queryMatchesLevel) {
        const candidateLevelMatches = variations.filter(variant => 
          candidateText.includes(variant)
        );
        
        if (candidateLevelMatches.length > 0) {
          maxScore = Math.max(maxScore, 0.7);
        }
      }
    }
    
    // Vérifier les années d'expérience spécifiques
    const yearPattern = /(\d+)[\s-]*(?:ans?|years?)/gi;
    const queryYears = [...query.matchAll(yearPattern)].map(match => parseInt(match[1]));
    const candidateYears = [...candidateText.matchAll(yearPattern)].map(match => parseInt(match[1]));
    
    if (queryYears.length > 0 && candidateYears.length > 0) {
      const queryYear = Math.max(...queryYears);
      const candidateYear = Math.max(...candidateYears);
      
      if (Math.abs(queryYear - candidateYear) <= 2) {
        maxScore = Math.max(maxScore, 0.75);
      } else if (candidateYear >= queryYear) {
        maxScore = Math.max(maxScore, 0.65);
      }
    }
    
    return maxScore;
  },
  
  /**
   * Vérification de correspondance de formation
   */
  checkEducationMatch: (query: string, candidateText: string): number => {
    let maxScore = 0;
    
    for (const [level, variations] of Object.entries(EDUCATION_MAPPING)) {
      const queryMatchesEducation = [level, ...variations].some(variant => 
        query.includes(variant)
      );
      
      if (queryMatchesEducation) {
        const candidateEducationMatches = variations.filter(variant => 
          candidateText.includes(variant)
        );
        
        if (candidateEducationMatches.length > 0) {
          maxScore = Math.max(maxScore, 0.75);
        }
      }
    }
    
    return maxScore;
  },
  
  /**
   * Matching contextuel avancé basé sur la proximité et la co-occurrence
   */
  checkContextualMatch: (query: string, candidateText: string): number => {
    const queryWords = query.split(/\s+/).filter(w => w.length > 2);
    const candidateWords = candidateText.split(/\s+/);
    
    let maxScore = 0;
    
    // Recherche de proximité des mots-clés
    for (const queryWord of queryWords) {
      const wordPositions = candidateWords
        .map((word, index) => word.includes(queryWord) ? index : -1)
        .filter(pos => pos !== -1);
      
      if (wordPositions.length > 0) {
        // Chercher des mots-clés connexes dans un rayon de 10 mots
        const proximityScore = wordPositions.reduce((score, pos) => {
          const contextWords = candidateWords.slice(Math.max(0, pos - 10), pos + 10);
          const contextText = contextWords.join(' ');
          
          // Vérifier si des termes connexes sont présents
          const relatedTermsFound = queryWords.filter(w => w !== queryWord).some(w => 
            contextText.includes(w)
          );
          
          return relatedTermsFound ? Math.max(score, 0.65) : score;
        }, 0);
        
        maxScore = Math.max(maxScore, proximityScore);
      }
    }
    
    return maxScore;
  },
  
  /**
   * Obtient un score de matching détaillé
   */
  getDetailedMatchScore: (query: string, candidateText: string): {
    overall: number;
    breakdown: {
      direct: number;
      skills: number;
      sector: number;
      jobTitle: number;
      experience: number;
      education: number;
      contextual: number;
    };
  } => {
    const normalizedQuery = normalizeSkill(query);
    const normalizedCandidateText = normalizeSkill(candidateText);
    
    const breakdown = {
      direct: normalizedCandidateText.includes(normalizedQuery) ? 1.0 : 0,
      skills: enhancedSemanticMatchingService.checkSkillsMatch(normalizedQuery, normalizedCandidateText),
      sector: enhancedSemanticMatchingService.checkSectorMatch(normalizedQuery, normalizedCandidateText),
      jobTitle: enhancedSemanticMatchingService.checkJobTitleMatch(normalizedQuery, normalizedCandidateText),
      experience: enhancedSemanticMatchingService.checkExperienceMatch(normalizedQuery, normalizedCandidateText),
      education: enhancedSemanticMatchingService.checkEducationMatch(normalizedQuery, normalizedCandidateText),
      contextual: enhancedSemanticMatchingService.checkContextualMatch(normalizedQuery, normalizedCandidateText)
    };
    
    // Score global pondéré
    const overall = Math.max(
      breakdown.direct,
      breakdown.skills * 0.9,
      breakdown.sector * 0.8,
      breakdown.jobTitle * 0.85,
      breakdown.experience * 0.7,
      breakdown.education * 0.75,
      breakdown.contextual * 0.65
    );
    
    return { overall, breakdown };
  }
};
