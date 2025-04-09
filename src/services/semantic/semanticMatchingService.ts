
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
    };
    
    // Check direct match
    if (normalizedCandidateText.includes(normalizedQuery)) {
      console.log(`Direct match found for "${query}"`);
      return true;
    }
    
    // Check for domain-specific matches
    for (const [domain, keywords] of Object.entries(domainMappings)) {
      // If query contains this domain
      if (normalizedQuery.includes(domain)) {
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
        normalizedQuery.includes(keyword)
      );
      
      if (queryMatchedKeywords.length > 0 && normalizedCandidateText.includes(domain)) {
        console.log(`Semantic match found for "${query}" via keywords: ${queryMatchedKeywords.join(', ')} to domain "${domain}"`);
        return true;
      }
    }
    
    // In a real implementation, this would compute embedding similarity
    // and return true if the similarity score exceeds the threshold
    
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
