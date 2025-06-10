
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

// Safe string extraction from Json with URL decoding
export const safeString = (data: Json | undefined | null): string => {
  if (!data) return '';
  
  if (typeof data === 'string') return cleanAndDecodeText(data);
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

// Process candidate data from database format to application format (simplifié)
export const processCandidateData = (rawCandidate: any): any => {
  if (!rawCandidate) return null;
  
  console.log('🔍 PROCESSING CANDIDATE DATA:', rawCandidate);
  
  const processedCandidate = {
    ...rawCandidate,
    // Apply URL decoding and cleaning to text fields
    first_name: safeString(rawCandidate.first_name),
    last_name: safeString(rawCandidate.last_name),
    email: safeString(rawCandidate.email),
    phone: safeString(rawCandidate.phone),
    position: safeString(rawCandidate.position),
    location: safeString(rawCandidate.location),
    company: safeString(rawCandidate.company),
    
    // Process address fields directly WITHOUT parsing location field
    address: cleanAndDecodeText(safeString(rawCandidate.address)),
    postal_code: cleanAndDecodeText(safeString(rawCandidate.postal_code)),
    city: cleanAndDecodeText(safeString(rawCandidate.city)),
    country: translateCountryToFrench(cleanAndDecodeText(safeString(rawCandidate.country))),
    
    // Process arrays
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
  
  // Log spécial pour Dorian Fournier pour débogage
  if (processedCandidate.first_name === 'Dorian' && processedCandidate.last_name === 'Fournier') {
    console.log('🎯 DORIAN FOURNIER - Processed address data:', {
      address: processedCandidate.address,
      postal_code: processedCandidate.postal_code,
      city: processedCandidate.city,
      country: processedCandidate.country,
      location: processedCandidate.location
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
