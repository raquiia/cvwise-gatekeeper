/**
 * Service d'extraction intelligente LinkedIn sans services tiers
 */

export interface ExtractedLinkedInData {
  fullName?: string;
  username?: string;
  headline?: string;
  location?: string;
  experience?: string;
  education?: string;
  skills?: string;
  summary?: string;
}

/**
 * Extrait des données intelligentes à partir d'une URL LinkedIn
 */
export const extractLinkedInDataFromUrl = async (url: string): Promise<ExtractedLinkedInData> => {
  const result: ExtractedLinkedInData = {};
  
  try {
    // Extraction du nom d'utilisateur depuis l'URL
    const urlMatch = url.match(/linkedin\.com\/in\/([^/?]+)/);
    if (urlMatch) {
      result.username = urlMatch[1];
      
      // Tentative de deviner le nom à partir du username
      const username = urlMatch[1];
      const cleanUsername = username.replace(/[-_]/g, ' ');
      
      // Si le username contient des mots reconnaissables, on peut deviner le nom
      const namePatterns = [
        /^([a-z]+[-_]?[a-z]+)[-_]\d+$/i, // prenom-nom-123
        /^([a-z]+)[-_]([a-z]+)$/i,        // prenom-nom
        /^([a-z]+)([a-z]+)$/i             // prenomnom
      ];
      
      for (const pattern of namePatterns) {
        const match = username.match(pattern);
        if (match) {
          if (match.length === 2) {
            result.fullName = cleanUsername.split(/[-_]/).map(capitalize).join(' ');
          } else if (match.length === 3) {
            result.fullName = `${capitalize(match[1])} ${capitalize(match[2])}`;
          }
          break;
        }
      }
    }
    
    // Tentative d'extraction des métadonnées Open Graph (si possible)
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      // Note: En raison des restrictions CORS, cette approche est limitée
      // Mais elle peut fonctionner dans certains cas
    } catch (error) {
      // Ignore les erreurs CORS, c'est attendu
    }
    
  } catch (error) {
    console.error('Error extracting from URL:', error);
    throw new Error('Impossible d\'extraire les données depuis l\'URL');
  }
  
  return result;
};

/**
 * Parse intelligemment le texte collé depuis LinkedIn
 */
export const parseLinkedInText = (text: string): ExtractedLinkedInData => {
  const result: ExtractedLinkedInData = {};
  
  try {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      throw new Error('Aucun contenu à parser');
    }
    
    // Patterns de reconnaissance intelligente
    const patterns = {
      // Nom (généralement la première ligne significative)
      name: /^[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ][a-zàâäéèêëïîôöùûüÿç]+\s+[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ][a-zàâäéèêëïîôöùûüÿç]+/,
      
      // Localisation (patterns français)
      location: /^(.*?),?\s*(France|Paris|Lyon|Marseille|Toulouse|Nice|Nantes|Montpellier|Strasbourg|Bordeaux|Lille|Rennes|Région\s+parisienne)/i,
      
      // Poste/titre (souvent après le nom)
      headline: /^(.*?)\s+(chez|at|@)\s+(.+)$/i,
      
      // Email
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
      
      // Téléphone français
      phone: /(?:\+33|0)[1-9](?:[.\-\s]?\d{2}){4}/,
      
      // Mots-clés d'expérience
      experienceKeywords: /^(experience|expérience|professional experience|parcours professionnel|carrière)/i,
      
      // Mots-clés d'éducation
      educationKeywords: /^(education|éducation|formation|études|diplôme|university|université|école)/i,
      
      // Mots-clés de compétences
      skillsKeywords: /^(skills|compétences|technologies|langages|frameworks|outils)/i,
      
      // Mots-clés de résumé
      summaryKeywords: /^(summary|résumé|about|à propos|bio|présentation)/i
    };
    
    let currentSection = '';
    let currentContent: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Détection du nom (première ligne qui ressemble à un nom)
      if (!result.fullName && patterns.name.test(line)) {
        result.fullName = line.replace(/[^\w\s\-àâäéèêëïîôöùûüÿç]/gi, '').trim();
        continue;
      }
      
      // Détection de la localisation
      const locationMatch = line.match(patterns.location);
      if (locationMatch && !result.location) {
        result.location = locationMatch[0];
        continue;
      }
      
      // Détection du poste/titre
      const headlineMatch = line.match(patterns.headline);
      if (headlineMatch && !result.headline) {
        result.headline = line;
        continue;
      }
      
      // Détection des sections
      if (patterns.experienceKeywords.test(line)) {
        saveCurrentSection();
        currentSection = 'experience';
        continue;
      }
      
      if (patterns.educationKeywords.test(line)) {
        saveCurrentSection();
        currentSection = 'education';
        continue;
      }
      
      if (patterns.skillsKeywords.test(line)) {
        saveCurrentSection();
        currentSection = 'skills';
        continue;
      }
      
      if (patterns.summaryKeywords.test(line)) {
        saveCurrentSection();
        currentSection = 'summary';
        continue;
      }
      
      // Si on est dans une section, accumuler le contenu
      if (currentSection) {
        currentContent.push(line);
      } else if (!result.headline && line.length > 10 && line.length < 100) {
        // Si pas encore de headline et que la ligne a une taille raisonnable, c'est peut-être le titre
        result.headline = line;
      }
    }
    
    // Sauvegarder la dernière section
    saveCurrentSection();
    
    function saveCurrentSection() {
      if (currentSection && currentContent.length > 0) {
        const content = currentContent.join('\n').trim();
        
        switch (currentSection) {
          case 'experience':
            result.experience = content;
            break;
          case 'education':
            result.education = content;
            break;
          case 'skills':
            result.skills = content;
            break;
          case 'summary':
            result.summary = content;
            break;
        }
        
        currentContent = [];
      }
    }
    
    // Post-traitement intelligent
    
    // Si pas de nom trouvé, prendre la première ligne comme fallback
    if (!result.fullName && lines.length > 0) {
      const firstLine = lines[0];
      if (firstLine.length > 2 && firstLine.length < 50 && !firstLine.includes('@')) {
        result.fullName = firstLine;
      }
    }
    
    // Nettoyage des compétences (séparation par virgules)
    if (result.skills) {
      result.skills = result.skills
        .split(/[,\n•·\-\*]/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 1)
        .join(', ');
    }
    
    // Extraction intelligente des entreprises dans l'expérience
    if (result.experience) {
      result.experience = cleanExperienceText(result.experience);
    }
    
    console.log('Parsed LinkedIn data:', result);
    
  } catch (error) {
    console.error('Error parsing LinkedIn text:', error);
    throw new Error('Erreur lors du parsing du texte');
  }
  
  return result;
};

/**
 * Nettoie et structure le texte d'expérience
 */
const cleanExperienceText = (text: string): string => {
  return text
    .split('\n')
    .map(line => {
      // Nettoyer les caractères spéciaux
      line = line.replace(/^[•·\-\*\s]+/, '').trim();
      
      // Détecter les patterns d'expérience
      const experiencePattern = /^(.+?)\s+[-–—]\s+(.+?)\s+\((.+?)\)$/;
      const match = line.match(experiencePattern);
      
      if (match) {
        return `• ${match[1]} chez ${match[2]} (${match[3]})`;
      }
      
      return line.length > 3 ? `• ${line}` : '';
    })
    .filter(line => line.length > 0)
    .join('\n');
};

/**
 * Capitalise la première lettre d'un mot
 */
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Valide et enrichit les données extraites
 */
export const validateAndEnrichExtractedData = (data: ExtractedLinkedInData): ExtractedLinkedInData => {
  const enriched = { ...data };
  
  // Validation du nom
  if (enriched.fullName) {
    enriched.fullName = enriched.fullName
      .replace(/[^\w\s\-àâäéèêëïîôöùûüÿç]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Validation de la localisation
  if (enriched.location) {
    enriched.location = enriched.location
      .replace(/^[,\s]+|[,\s]+$/g, '')
      .trim();
  }
  
  // Validation du titre
  if (enriched.headline) {
    enriched.headline = enriched.headline
      .replace(/^[,\-\s]+|[,\-\s]+$/g, '')
      .trim();
  }
  
  return enriched;
};