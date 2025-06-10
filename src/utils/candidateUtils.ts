
import { Json } from '@/integrations/supabase/types';

/**
 * Fonction pour décoder les URLs et nettoyer les caractères spéciaux (améliorée)
 */
const cleanAndDecodeText = (text: string): string => {
  if (!text) return '';
  
  try {
    // Décoder les caractères URL encodés de manière récursive
    let cleaned = text;
    
    // Répéter le décodage jusqu'à ce qu'il n'y ait plus de changement
    let previousCleaned = '';
    while (cleaned !== previousCleaned) {
      previousCleaned = cleaned;
      try {
        cleaned = decodeURIComponent(cleaned);
      } catch {
        break; // Arrêter si le décodage échoue
      }
    }
    
    // Nettoyer les caractères résiduels problématiques
    cleaned = cleaned.replace(/%/g, '');
    
    // Nettoyer les espaces supplémentaires
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    return cleaned.trim();
  } catch (error) {
    // Si le décodage échoue, retourner le texte original nettoyé
    return text.replace(/%/g, '').replace(/\s+/g, ' ').trim();
  }
};

/**
 * Fonction pour traduire les noms de pays de l'anglais vers le français
 */
const translateCountryToFrench = (country: string): string => {
  if (!country) return '';
  
  const countryTranslations: { [key: string]: string } = {
    // Anglais -> Français
    'Switzerland': 'Suisse',
    'SWITZERLAND': 'Suisse',
    'France': 'France',
    'FRANCE': 'France',
    'Germany': 'Allemagne',
    'GERMANY': 'Allemagne',
    'ALLEMAGNE': 'Allemagne',
    'Belgium': 'Belgique',
    'BELGIUM': 'Belgique',
    'BELGIQUE': 'Belgique',
    'Spain': 'Espagne',
    'SPAIN': 'Espagne',
    'ESPAGNE': 'Espagne',
    'Italy': 'Italie',
    'ITALY': 'Italie',
    'ITALIE': 'Italie',
    'Luxembourg': 'Luxembourg',
    'LUXEMBOURG': 'Luxembourg',
    'Netherlands': 'Pays-Bas',
    'NETHERLANDS': 'Pays-Bas',
    'United Kingdom': 'Royaume-Uni',
    'UNITED KINGDOM': 'Royaume-Uni',
    'UK': 'Royaume-Uni',
    'Austria': 'Autriche',
    'AUSTRIA': 'Autriche',
    'Portugal': 'Portugal',
    'PORTUGAL': 'Portugal',
    'Canada': 'Canada',
    'CANADA': 'Canada',
    'United States': 'États-Unis',
    'USA': 'États-Unis',
    'US': 'États-Unis'
  };
  
  const cleanCountry = country.trim();
  return countryTranslations[cleanCountry] || cleanCountry;
};

export const ensureStringArray = (data: Json | undefined | null): string[] => {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'string') return cleanAndDecodeText(item);
      if (typeof item === 'object' && item !== null && 'name' in item) {
        return cleanAndDecodeText(String(item.name));
      }
      return cleanAndDecodeText(String(item));
    }).filter(Boolean);
  }
  
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map(item => cleanAndDecodeText(String(item))).filter(Boolean);
      }
    } catch {
      return [cleanAndDecodeText(data)];
    }
  }
  
  return [];
};

// Generic array helper that works with any type
export const ensureArray = <T = any>(data: Json | undefined | null): T[] => {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data as T[];
  }
  
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed as T[];
      }
    } catch {
      // If parsing fails, return empty array
      return [];
    }
  }
  
  return [];
};

// CORRECTED: Safe string extraction from Json - preserve original values
export const safeString = (data: Json | undefined | null): string => {
  if (!data) return '';
  
  // If it's already a string, return it directly unless it's explicitly empty
  if (typeof data === 'string') {
    if (data === 'null' || data === 'undefined') return '';
    return data; // Return the original string value
  }
  
  if (typeof data === 'number') return String(data);
  if (typeof data === 'boolean') return String(data);
  
  // For objects, try to extract a meaningful string
  if (typeof data === 'object' && data !== null) {
    if ('value' in data && typeof data.value === 'string') {
      return cleanAndDecodeText(data.value);
    }
    if ('name' in data && typeof data.name === 'string') {
      return cleanAndDecodeText(data.name);
    }
    if ('text' in data && typeof data.text === 'string') {
      return cleanAndDecodeText(data.text);
    }
  }
  
  return '';
};

// Check if object has a property
export const hasProperty = <T extends object>(obj: T, prop: string): boolean => {
  return obj && typeof obj === 'object' && prop in obj;
};

// Check if object is undefined or has undefined values
export const isUndefinedObject = (obj: any): boolean => {
  if (!obj || typeof obj !== 'object') return false;
  
  // Check if all properties are undefined
  return Object.values(obj).every(value => value === undefined);
};

// DEBUGGING VERSION: Process candidate data with detailed logs
export const processCandidateData = (rawCandidate: any): any => {
  if (!rawCandidate) return null;
  
  console.log('🔄 STARTING processCandidateData with RAW INPUT:', {
    id: rawCandidate.id,
    first_name: rawCandidate.first_name,
    last_name: rawCandidate.last_name,
    address: rawCandidate.address,
    postal_code: rawCandidate.postal_code,
    city: rawCandidate.city,
    country: rawCandidate.country,
    location: rawCandidate.location
  });
  
  const processedCandidate = {
    ...rawCandidate,
    // Keep original values for basic text fields - no processing needed
    first_name: rawCandidate.first_name || '',
    last_name: rawCandidate.last_name || '',
    email: rawCandidate.email || '',
    phone: rawCandidate.phone || '',
    position: rawCandidate.position || '',
    location: rawCandidate.location || '',
    company: rawCandidate.company || '',
    
    // Keep address fields exactly as they are in the database
    address: rawCandidate.address || '',
    postal_code: rawCandidate.postal_code || '',
    city: rawCandidate.city || '',
    country: rawCandidate.country ? translateCountryToFrench(rawCandidate.country) : '',
    
    // Process only complex arrays that actually need processing
    skills: ensureStringArray(rawCandidate.skills),
    education: ensureArray(rawCandidate.education),
    experiences: ensureArray(rawCandidate.experiences),
    certifications: ensureArray(rawCandidate.certifications),
    languages: ensureArray(rawCandidate.languages),
    professional_references: ensureArray(rawCandidate.professional_references),
    professional_networks: ensureArray(rawCandidate.professional_networks),
    continuous_training: ensureArray(rawCandidate.continuous_training),
    special_permits: ensureArray(rawCandidate.special_permits),
    industries: ensureArray(rawCandidate.industries),
    projects: ensureArray(rawCandidate.projects)
  };
  
  console.log('✅ PROCESSED CANDIDATE - Final output from processCandidateData:', {
    first_name: processedCandidate.first_name,
    last_name: processedCandidate.last_name,
    address: processedCandidate.address,
    postal_code: processedCandidate.postal_code,
    city: processedCandidate.city,
    country: processedCandidate.country,
    location: processedCandidate.location
  });
  
  // Log spécial pour Louis Le Potvin
  if (processedCandidate.first_name === 'Louis' && processedCandidate.last_name === 'Le Potvin') {
    console.log('🎯 LOUIS LE POTVIN - FINAL PROCESSED DATA:', {
      address: processedCandidate.address || 'EMPTY',
      postal_code: processedCandidate.postal_code || 'EMPTY',
      city: processedCandidate.city || 'EMPTY',
      country: processedCandidate.country || 'EMPTY'
    });
  }
  
  return processedCandidate;
};

// Process job offer data from database format to application format
export const processJobOfferData = (rawJobOffer: any): any => {
  if (!rawJobOffer) return null;
  
  return {
    ...rawJobOffer,
    required_skills: ensureStringArray(rawJobOffer.required_skills),
    preferred_skills: ensureStringArray(rawJobOffer.preferred_skills),
    benefits: ensureArray(rawJobOffer.benefits),
    requirements: ensureArray(rawJobOffer.requirements)
  };
};
