/**
 * A simple service to handle semantic matching between search queries and candidate data
 */

type SemanticMatchContext = {
  query: string;
  candidateText: string;
  threshold?: number;
};

export const semanticMatchingService = {
  /**
   * Performs a simple keyword-based semantic match between a query and candidate text
   * In a real implementation, this would use embeddings and vector similarity
   */
  isSemanticMatch: ({ query, candidateText, threshold = 0.5 }: SemanticMatchContext): boolean => {
    if (!query || !candidateText) return false;
    
    // Convert to lowercase for case-insensitive matching
    const normalizedQuery = query.toLowerCase().trim();
    const normalizedCandidateText = candidateText.toLowerCase();
    
    // Log for debugging (only for first few matches to avoid spam)
    if (Math.random() < 0.1) { // Log only 10% to reduce noise
      console.log(`🔍 Checking match for query: "${query}"`);
      console.log(`📄 Candidate text sample: "${candidateText.substring(0, 100)}..."`);
    }
    
    // Domain-specific keyword mapping (this would be much more extensive in a real implementation)
    const domainMappings: Record<string, string[]> = {
      // Railway industry mappings
      'ferroviaire': ['sncf', 'train', 'rail', 'chemin de fer', 'tgv', 'ter', 'transport ferroviaire', 'ferroviaire', 'railway'],
      'sncf': ['ferroviaire', 'train', 'rail', 'chemin de fer', 'tgv', 'ter', 'transport ferroviaire', 'railway', 'alstom'],
      'transport': ['sncf', 'ratp', 'aéroport', 'avion', 'métro', 'bus', 'tramway', 'logistique', 'mobilité'],
      
      // Company mappings
      'alstom': ['ferroviaire', 'train', 'rail', 'transport ferroviaire', 'railway', 'tgv', 'metro', 'tramway', 'signalisation'],
      
      // Job title mappings
      'chef de projet': ['project manager', 'gestionnaire de projet', 'responsable projet', 'directeur de projet', 'chef de projet pmo', 'pmo', 'coordination', 'gestion projet'],
      'développeur': ['ingénieur logiciel', 'software engineer', 'programmeur', 'fullstack', 'développeur web', 'coder', 'dev', 'software developer'],
      'pmo': ['project management office', 'chef de projet', 'project manager', 'gestion de projet', 'coordination projet'],
      'ingénieur': ['engineer', 'ingénierie', 'technique', 'technical', 'développeur', 'architecte', 'bac+5', 'master', 'école d\'ingénieur', 'engineering degree'],
      
      // Industry mappings
      'santé': ['hôpital', 'clinique', 'médical', 'pharmaceutique', 'médecin', 'soins', 'healthcare', 'health'],
      'finance': ['banque', 'assurance', 'crédit', 'comptabilité', 'audit', 'financial', 'banking'],
      'assurance': ['finance', 'banque', 'crédit', 'financial', 'insurance', 'risk'],
      'consulting': ['conseil', 'consultancy', 'advisory', 'expertise', 'consulting'],
      'conseil': ['consulting', 'consultancy', 'advisory', 'expertise', 'consulting'],
      
      // Location mappings
      'sydney': ['australie', 'australia', 'nsw', 'new south wales'],
      'paris': ['france', 'île-de-france', 'idf', 'région parisienne', 'ile de france'],
      'lyon': ['france', 'rhône', 'rhone', 'auvergne'],
      'marseille': ['france', 'paca', 'provence', 'bouches du rhône'],
      'toulouse': ['france', 'occitanie', 'haute garonne'],
      'bordeaux': ['france', 'nouvelle aquitaine', 'gironde'],
      
      // Skills mappings
      'gestion de projet': ['project management', 'chef de projet', 'direction de projet', 'suivi de projet', 'coordination', 'planning'],
      'project management': ['gestion de projet', 'chef de projet', 'direction de projet', 'suivi de projet', 'coordination', 'planning'],
      'ms project': ['microsoft project', 'msproject', 'microsoft ms project', 'outil de gestion de projet microsoft', 'planning'],
      'jira': ['atlassian', 'issue tracking', 'suivi de tickets', 'gestion agile', 'scrum', 'kanban'],
      'scrum': ['agile', 'jira', 'sprint', 'product owner', 'scrum master', 'methodology'],
      'agile': ['scrum', 'kanban', 'sprint', 'methodology', 'jira'],
      
      // Tools mappings
      'outils de gestion de projet': ['ms project', 'jira', 'trello', 'asana', 'monday', 'azure devops', 'planification'],
      
      // Experience mappings
      'junior': ['débutant', '0-2 ans', '1-3 ans', 'peu expérimenté', 'entry level'],
      'intermédiaire': ['3-5 ans', '4-6 ans', 'mid-level', 'experienced'],
      'senior': ['6+ ans', '7+ ans', '8+ ans', 'expérimenté', 'expert', 'lead', 'principal'],
      
      // Education mappings
      'bac+5': ['master', 'diplôme d\'ingénieur', 'école d\'ingénieur', 'ingénieur', 'msc', 'master of science', 'mba'],
      'master': ['bac+5', 'diplôme d\'ingénieur', 'msc', 'master of science', 'mba']
    };
    
    // Split query into keywords for more flexible matching
    const queryKeywords = normalizedQuery.split(/[\s,]+/).filter(kw => kw.length > 2);
    
    // Check for direct matches with individual keywords
    for (const keyword of queryKeywords) {
      if (normalizedCandidateText.includes(keyword)) {
        console.log(`✅ Direct keyword match found for "${keyword}"`);
        return true;
      }
    }
    
    // Check direct match with full query
    if (normalizedCandidateText.includes(normalizedQuery)) {
      console.log(`✅ Direct phrase match found for "${query}"`);
      return true;
    }
    
    // Check for domain-specific matches
    for (const [domain, keywords] of Object.entries(domainMappings)) {
      // If query contains this domain or related terms
      const queryContainsDomain = queryKeywords.some(kw => 
        domain.includes(kw) || 
        kw.includes(domain) ||
        keywords.some(related => kw.includes(related) || related.includes(kw))
      );
      
      if (queryContainsDomain) {
        // Check if candidate text contains any of the related keywords
        const matchedKeywords = keywords.filter(keyword => 
          normalizedCandidateText.includes(keyword)
        );
        
        if (matchedKeywords.length > 0) {
          console.log(`✅ Semantic match found for "${query}" via domain "${domain}" with keywords: ${matchedKeywords.join(', ')}`);
          return true;
        }
      }
      
      // Check the reverse: if candidate contains domain and query contains related keywords
      if (normalizedCandidateText.includes(domain)) {
        const queryMatchedKeywords = keywords.filter(keyword => 
          queryKeywords.some(qk => keyword.includes(qk) || qk.includes(keyword))
        );
        
        if (queryMatchedKeywords.length > 0) {
          console.log(`✅ Reverse semantic match found for "${query}" via keywords: ${queryMatchedKeywords.join(', ')} to domain "${domain}"`);
          return true;
        }
      }
    }
    
    // Known company names that should only match exactly (no fuzzy matching)
    const exactMatchCompanies = [
      'alstom', 'sncf', 'ratp', 'airbus', 'thales', 'safran', 'bouygues', 'edf', 'engie', 'total',
      'orange', 'free', 'sfr', 'carrefour', 'auchan', 'fnac', 'peugeot', 'renault', 'michelin',
      'valeo', 'bosch', 'schneider', 'legrand', 'veolia', 'suez', 'danone', 'nestlé', 'unilever',
      'google', 'microsoft', 'apple', 'amazon', 'facebook', 'meta', 'ibm', 'oracle', 'salesforce'
    ];
    
    // For company queries, skip fuzzy matching
    const isCompanyQuery = queryKeywords.some(keyword => 
      exactMatchCompanies.includes(keyword)
    );
    
    if (isCompanyQuery) {
      // Company names already checked above, no fuzzy matching for companies
      return false;
    }
    
    // For longer text, try fuzzy word matching (but more strict)
    // This helps with partial matches and minor typos
    for (const keyword of queryKeywords) {
      if (keyword.length < 4) continue; // Skip very short words
      
      // Look for words that contain the keyword or vice versa
      const candidateWords = normalizedCandidateText.split(/[\s,.]+/);
      for (const word of candidateWords) {
        if (word.length < 4) continue;
        
        // Partial word matching (more strict)
        if (word.includes(keyword) || keyword.includes(word)) {
          if (Math.abs(word.length - keyword.length) <= 2) { // More strict length difference
            console.log(`✅ Fuzzy word match found: "${keyword}" ~ "${word}"`);
            return true;
          }
        }
        
        // Improved similarity calculation with stricter threshold
        if (Math.abs(word.length - keyword.length) <= 2 && keyword.length >= 5) {
          const similarity = semanticMatchingService.calculateImprovedSimilarity(keyword, word);
          
          if (similarity > 0.85) { // Much more strict threshold (was 0.7)
            console.log(`✅ Fuzzy similarity match found: "${keyword}" ~ "${word}" (${Math.round(similarity * 100)}% similar)`);
            return true;
          }
        }
      }
    }
    
    // Check for context-aware matches (e.g., skills in job requirements)
    const contextMatches = [
      { query: ['project', 'projet'], candidate: ['gestion de projet', 'project management', 'chef de projet'] },
      { query: ['gestion', 'management'], candidate: ['project management', 'management', 'gestion de projet'] },
      { query: ['développement', 'development', 'dev'], candidate: ['développeur', 'developer', 'software', 'programming'] },
      { query: ['technique', 'technical'], candidate: ['ingénieur', 'engineer', 'technical', 'technique'] }
    ];
    
    for (const match of contextMatches) {
      const queryHasContext = match.query.some(q => normalizedQuery.includes(q));
      const candidateHasContext = match.candidate.some(c => normalizedCandidateText.includes(c));
      
      if (queryHasContext && candidateHasContext) {
        console.log(`✅ Context-aware match found: query contains [${match.query.join(', ')}] and candidate contains [${match.candidate.join(', ')}]`);
        return true;
      }
    }
    
    // Try to match skill abbreviations and their full forms
    const abbreviations: Record<string, string[]> = {
      "pmo": ["project management office", "program management office"],
      "ms": ["microsoft", "ms project", "management system"],
      "pm": ["project manager", "project management"],
      "rh": ["ressources humaines", "human resources", "hr"],
      "it": ["information technology", "informatique", "tech"],
      "ia": ["intelligence artificielle", "artificial intelligence", "ai"],
      "ai": ["intelligence artificielle", "artificial intelligence", "ia"]
    };
    
    for (const [abbr, fullForms] of Object.entries(abbreviations)) {
      if (normalizedQuery.includes(abbr)) {
        for (const form of fullForms) {
          if (normalizedCandidateText.includes(form)) {
            console.log(`✅ Abbreviation match found: "${abbr}" ~ "${form}"`);
            return true;
          }
        }
      }
      
      // Check the reverse
      if (fullForms.some(form => normalizedQuery.includes(form))) {
        if (normalizedCandidateText.includes(abbr)) {
          console.log(`✅ Reverse abbreviation match found: "${fullForms.join(' or ')}" ~ "${abbr}"`);
          return true;
        }
      }
    }
    
    return false;
  },
  
  /**
   * Calculate improved similarity between two strings
   * Uses a combination of character overlap and positional similarity
   */
  calculateImprovedSimilarity: (str1: string, str2: string): number => {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;
    
    // Check if one string is a substring of the other
    if (str1.includes(str2) || str2.includes(str1)) {
      const shorterLength = Math.min(str1.length, str2.length);
      const longerLength = Math.max(str1.length, str2.length);
      return shorterLength / longerLength;
    }
    
    // Calculate character overlap
    const chars1 = [...str1];
    const chars2 = [...str2];
    const commonChars = chars1.filter(char => chars2.includes(char)).length;
    const maxLength = Math.max(str1.length, str2.length);
    const charOverlap = commonChars / maxLength;
    
    // Calculate positional similarity (bonus for characters in similar positions)
    let positionalScore = 0;
    const minLength = Math.min(str1.length, str2.length);
    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) {
        positionalScore += 1;
      }
    }
    const positionalSimilarity = positionalScore / maxLength;
    
    // Combine both scores (weighted average)
    return (charOverlap * 0.6) + (positionalSimilarity * 0.4);
  },
  
  /**
   * Get the searchable text from a candidate to perform matching against
   */
  getCandidateSearchableText: (candidate: any): string => {
    if (!candidate) return '';
    
    const textParts = [
      // Basic info
      candidate.first_name,
      candidate.last_name,
      candidate.position,
      candidate.company,
      candidate.location,
      candidate.city,
      candidate.country,
      candidate.address,
      
      // Skills - handle both array and string formats
      Array.isArray(candidate.skills) 
        ? candidate.skills.map((skill: any) => String(skill)).join(' ')
        : String(candidate.skills || ''),
      
      // Experiences - extract all relevant text
      Array.isArray(candidate.experiences) 
        ? candidate.experiences.map((exp: any) => {
            if (typeof exp === 'object' && exp !== null) {
              return [
                exp.title,
                exp.position,
                exp.company,
                exp.description,
                exp.industry,
                exp.location
              ].filter(Boolean).join(' ');
            }
            return String(exp || '');
          }).join(' ')
        : String(candidate.experiences || ''),
      
      // Education
      Array.isArray(candidate.education)
        ? candidate.education.map((edu: any) => {
            if (typeof edu === 'object' && edu !== null) {
              return [
                edu.degree,
                edu.field_of_study,
                edu.school,
                edu.institution,
                edu.description
              ].filter(Boolean).join(' ');
            }
            return String(edu || '');
          }).join(' ')
        : String(candidate.education || ''),
      
      // Industries
      Array.isArray(candidate.industries) 
        ? candidate.industries.map((ind: any) => String(ind)).join(' ')
        : String(candidate.industries || ''),
      
      // Languages
      Array.isArray(candidate.languages)
        ? candidate.languages.map((lang: any) => {
            if (typeof lang === 'object' && lang !== null) {
              return [lang.language, lang.name].filter(Boolean).join(' ');
            }
            return String(lang || '');
          }).join(' ')
        : String(candidate.languages || ''),
      
      // Certifications
      Array.isArray(candidate.certifications)
        ? candidate.certifications.map((cert: any) => {
            if (typeof cert === 'object' && cert !== null) {
              return [cert.name, cert.organization, cert.description].filter(Boolean).join(' ');
            }
            return String(cert || '');
          }).join(' ')
        : String(candidate.certifications || ''),
      
      // Additional fields
      candidate.career_objectives,
      candidate.professional_values,
      candidate.interests,
      candidate.availability,
      candidate.contract_type,
      candidate.remote_preference,
      candidate.work_authorization,
    ];
    
    const searchableText = textParts
      .filter(Boolean)
      .map(part => String(part))
      .join(' ')
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .trim();
    
    return searchableText;
  }
};
