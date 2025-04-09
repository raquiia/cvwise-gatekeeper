
import { Json } from '@/integrations/supabase/types';

/**
 * Ensures that a value is always returned as an array
 * Handles string JSON, objects, or already-arrays
 */
export function ensureArray<T>(value: Json | null | undefined): T[] {
  if (!value) return [];
  
  if (Array.isArray(value)) {
    return value as T[];
  }
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value as unknown as T];
    } catch (e) {
      return [value as unknown as T];
    }
  }
  
  // For objects that aren't arrays
  return [value as unknown as T];
}

/**
 * Ensures that a value is always returned as a string array
 * This is a more specific version of ensureArray for string values
 */
export function ensureStringArray(value: Json | null | undefined): string[] {
  return ensureArray<string>(value).map(item => 
    typeof item === 'string' ? item : String(item)
  );
}

/**
 * Type guard to check if an object has specific properties
 */
export function hasProperty<K extends string>(obj: unknown, property: K): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && property in obj;
}

/**
 * Safely extracts a property from an object if it exists
 */
export function safeGet<T>(obj: unknown, key: string, defaultValue: T): T {
  if (hasProperty(obj, key)) {
    return obj[key] as unknown as T;
  }
  return defaultValue;
}

/**
 * Process job offer data to ensure type consistency
 */
export function processJobOfferData(jobOffer: any) {
  return {
    ...jobOffer,
    required_skills: ensureStringArray(jobOffer.required_skills),
    preferred_skills: ensureStringArray(jobOffer.preferred_skills),
    required_languages: ensureArray(jobOffer.required_languages)
  };
}

/**
 * Process candidate data to ensure type consistency
 */
export function processCandidateData(candidate: any) {
  return {
    ...candidate,
    skills: ensureStringArray(candidate.skills),
    education: ensureArray(candidate.education),
    experiences: ensureArray(candidate.experiences),
    languages: ensureArray(candidate.languages),
    certifications: ensureArray(candidate.certifications),
    publications: ensureArray(candidate.publications),
    professional_references: ensureArray(candidate.professional_references),
    professional_networks: ensureArray(candidate.professional_networks),
    continuous_training: ensureArray(candidate.continuous_training),
    special_permits: ensureArray(candidate.special_permits),
    industries: ensureArray(candidate.industries),
    projects: ensureArray(candidate.projects)
  };
}
