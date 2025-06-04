
import { Json } from '@/integrations/supabase/types';

export const ensureStringArray = (data: Json | undefined | null): string[] => {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null && 'name' in item) {
        return String(item.name);
      }
      return String(item);
    }).filter(Boolean);
  }
  
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item)).filter(Boolean);
      }
    } catch {
      return [data];
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

// Safe string extraction from Json
export const safeString = (data: Json | undefined | null): string => {
  if (!data) return '';
  
  if (typeof data === 'string') return data;
  if (typeof data === 'number') return String(data);
  if (typeof data === 'boolean') return String(data);
  
  // For objects, try to extract a meaningful string
  if (typeof data === 'object' && data !== null) {
    if ('value' in data && typeof data.value === 'string') {
      return data.value;
    }
    if ('name' in data && typeof data.name === 'string') {
      return data.name;
    }
    if ('text' in data && typeof data.text === 'string') {
      return data.text;
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

// Process candidate data from database format to application format
export const processCandidateData = (rawCandidate: any): any => {
  if (!rawCandidate) return null;
  
  return {
    ...rawCandidate,
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
