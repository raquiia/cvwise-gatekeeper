
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
    const normalizedQuery = query.toLowerCase();
    const normalizedCandidateText = candidateText.toLowerCase();
    
    // Log for debugging
    console.log(`Checking semantic match for query: "${query}"`);
    console.log(`Candidate text sample: "${candidateText.substring(0, 100)}..."`);
    
    // Domain-specific keyword mapping (this would be much more extensive in a real implementation)
    const domainMappings: Record<string, string[]> = {
      // Railway industry mappings
      'ferroviaire': ['sncf', 'train', 'rail', 'chemin de fer', 'tgv', 'ter', 'transport ferroviaire'],
      'transport': ['sncf', 'ratp', 'aéroport', 'avion', 'métro', 'bus', 'tramway'],
      
      // Job title mappings
      'chef de projet': ['project manager', 'gestionnaire de projet', 'responsable projet', 'directeur de projet', 'chef de projet pmo', 'pmo'],
      'développeur': ['ingénieur logiciel', 'software engineer', 'programmeur', 'fullstack', 'développeur web', 'coder'],
      'pmo': ['project management office', 'chef de projet', 'project manager', 'gestion de projet'],
      
      // Industry mappings
      'santé': ['hôpital', 'clinique', 'médical', 'pharmaceutique', 'médecin', 'soins'],
      'finance': ['banque', 'assurance', 'crédit', 'comptabilité', 'audit'],
      
      // Location mappings
      'sydney': ['australie', 'australia', 'nsw', 'new south wales'],
      'paris': ['france', 'île-de-france', 'idf', 'région parisienne'],
      
      // Skills mappings
      'gestion de projet': ['project management', 'chef de projet', 'direction de projet', 'suivi de projet'],
      'ms project': ['microsoft project', 'msproject', 'microsoft ms project', 'outil de gestion de projet microsoft'],
      'jira': ['atlassian', 'issue tracking', 'suivi de tickets', 'gestion agile'],
      
      // Tools mappings
      'outils de gestion de projet': ['ms project', 'jira', 'trello', 'asana', 'monday', 'azure devops', 'planification'],
      
      // Experience mappings
      'junior': ['débutant', '0-2 ans', '1-3 ans', 'peu expérimenté'],
      'intermédiaire': ['3-5 ans', '4-6 ans', 'mid-level'],
      'senior': ['6+ ans', '7+ ans', '8+ ans', 'expérimenté', 'expert'],
      
      // Education mappings
      'bac+5': ['master', 'diplôme d\'ingénieur', 'école d\'ingénieur', 'ingénieur', 'msc', 'master of science']
    };
    
    // Split query into keywords for more flexible matching
    const queryKeywords = normalizedQuery.split(/\s+/).filter(kw => kw.length > 2);
    
    // Check for direct matches with individual keywords
    for (const keyword of queryKeywords) {
      if (normalizedCandidateText.includes(keyword)) {
        console.log(`Direct keyword match found for "${keyword}"`);
        return true;
      }
    }
    
    // Check direct match with full query
    if (normalizedCandidateText.includes(normalizedQuery)) {
      console.log(`Direct match found for "${query}"`);
      return true;
    }
    
    // Check for domain-specific matches
    for (const [domain, keywords] of Object.entries(domainMappings)) {
      // If query contains this domain
      if (queryKeywords.some(kw => domain.includes(kw) || kw.includes(domain))) {
        // Check if candidate text contains any of the related keywords
        const matchedKeywords = keywords.filter(keyword => 
          normalizedCandidateText.includes(keyword)
        );
        
        if (matchedKeywords.length > 0) {
          console.log(`Semantic match found for "${query}" via domain "${domain}" with keywords: ${matchedKeywords.join(', ')}`);
          return true;
        }
      }
      
      // Check the reverse: if query contains keywords and candidate contains domain
      const queryMatchedKeywords = keywords.filter(keyword => 
        queryKeywords.some(qk => keyword.includes(qk) || qk.includes(keyword))
      );
      
      if (queryMatchedKeywords.length > 0 && normalizedCandidateText.includes(domain)) {
        console.log(`Semantic match found for "${query}" via keywords: ${queryMatchedKeywords.join(', ')} to domain "${domain}"`);
        return true;
      }
    }
    
    // For longer text, try fuzzy word matching
    // This helps with partial matches and minor typos
    for (const keyword of queryKeywords) {
      if (keyword.length < 4) continue; // Skip very short words
      
      // Look for words that contain the keyword or vice versa
      const candidateWords = normalizedCandidateText.split(/\s+/);
      for (const word of candidateWords) {
        if (word.length < 4) continue;
        
        if (word.includes(keyword) || keyword.includes(word)) {
          console.log(`Fuzzy word match found: "${keyword}" ~ "${word}"`);
          return true;
        }
        
        // Add Levenshtein distance calculation for typo tolerance (simple version)
        // If words are of similar length and share at least 70% of the same characters
        if (Math.abs(word.length - keyword.length) <= 2) {
          const commonChars = [...keyword].filter(char => word.includes(char)).length;
          const maxLength = Math.max(word.length, keyword.length);
          const similarity = commonChars / maxLength;
          
          if (similarity > 0.7) {
            console.log(`Fuzzy similarity match found: "${keyword}" ~ "${word}" (${Math.round(similarity * 100)}% similar)`);
            return true;
          }
        }
      }
    }
    
    // Check for context-aware matches (e.g., skills in job requirements)
    if (normalizedQuery.includes("project") && normalizedCandidateText.includes("gestion de projet")) {
      console.log(`Context-aware match found: "project" ~ "gestion de projet"`);
      return true;
    }
    
    if (normalizedQuery.includes("gestion") && 
        (normalizedCandidateText.includes("project management") || normalizedCandidateText.includes("management"))) {
      console.log(`Context-aware match found: "gestion" ~ "project management"`);
      return true;
    }
    
    // Try to match skill abbreviations and their full forms
    const abbreviations: Record<string, string[]> = {
      "pmo": ["project management office", "program management office"],
      "ms": ["microsoft", "ms project", "management system"],
      "pm": ["project manager", "project management"]
    };
    
    for (const [abbr, fullForms] of Object.entries(abbreviations)) {
      if (normalizedQuery.includes(abbr)) {
        for (const form of fullForms) {
          if (normalizedCandidateText.includes(form)) {
            console.log(`Abbreviation match found: "${abbr}" ~ "${form}"`);
            return true;
          }
        }
      }
      
      // Check the reverse
      if (fullForms.some(form => normalizedQuery.includes(form))) {
        if (normalizedCandidateText.includes(abbr)) {
          console.log(`Reverse abbreviation match found: "${fullForms.join(' or ')}" ~ "${abbr}"`);
          return true;
        }
      }
    }
    
    console.log(`No semantic match found for "${query}"`);
    return false;
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
      
      // Skills
      Array.isArray(candidate.skills) ? candidate.skills.join(' ') : '',
      
      // Experiences
      Array.isArray(candidate.experiences) 
        ? candidate.experiences.map((exp: any) => 
            `${exp.title || ''} ${exp.company || ''} ${exp.description || ''}`
          ).join(' ')
        : '',
      
      // Education
      Array.isArray(candidate.education)
        ? candidate.education.map((edu: any) => 
            `${edu.degree || ''} ${edu.field_of_study || ''} ${edu.school || ''}`
          ).join(' ')
        : '',
      
      // Industries
      Array.isArray(candidate.industries) ? candidate.industries.join(' ') : '',
    ];
    
    return textParts.filter(Boolean).join(' ');
  }
};
