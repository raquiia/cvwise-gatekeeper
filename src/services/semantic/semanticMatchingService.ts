
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
      'chef de projet': ['project manager', 'gestionnaire de projet', 'responsable projet', 'directeur de projet'],
      'développeur': ['ingénieur logiciel', 'software engineer', 'programmeur', 'fullstack'],
      
      // Industry mappings
      'santé': ['hôpital', 'clinique', 'médical', 'pharmaceutique', 'médecin', 'soins'],
      'finance': ['banque', 'assurance', 'crédit', 'comptabilité', 'audit'],
      
      // Location mappings
      'sydney': ['australie', 'australia', 'nsw', 'new south wales'],
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
