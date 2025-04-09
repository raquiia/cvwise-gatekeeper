
import { Json } from '@/integrations/supabase/types';

/**
 * Checks if a value represents an "undefined" special object
 */
export function isUndefinedObject(value: any): boolean {
  return (
    typeof value === 'object' && 
    value !== null &&
    '_type' in value && 
    value._type === 'undefined'
  );
}

/**
 * Ensures that a value is always returned as an array
 * Handles string JSON, objects, or already-arrays
 */
export function ensureArray<T>(value: Json | null | undefined): T[] {
  if (!value) return [];
  
  // Handle special "undefined" objects
  if (isUndefinedObject(value)) {
    return [];
  }
  
  if (Array.isArray(value)) {
    // Remove any "undefined" objects from arrays and null/undefined values
    return value.filter(item => item !== null && item !== undefined && !isUndefinedObject(item)) as T[];
  }
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? 
        parsed.filter(item => item !== null && item !== undefined && !isUndefinedObject(item)) : 
        [value as unknown as T];
    } catch (e) {
      return [value as unknown as T];
    }
  }
  
  // For other objects that aren't special "undefined" objects
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
 * Safe string extractor that handles undefined objects
 */
export function safeString(value: unknown, defaultValue: string = ''): string {
  if (value === null || value === undefined) return defaultValue;
  if (isUndefinedObject(value)) return defaultValue;
  return typeof value === 'string' ? value : String(value);
}

/**
 * Process job offer data to ensure type consistency
 */
export function processJobOfferData(jobOffer: any) {
  if (!jobOffer) return {};
  
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
  if (!candidate) return {};
  
  // Handle the case where candidate data might be nested in a data property
  // This happens in some API responses
  if (candidate.data && typeof candidate.data === 'object') {
    return processCandidateData(candidate.data);
  }
  
  // Handle array case (should be rare, but just in case)
  if (Array.isArray(candidate) && candidate.length > 0) {
    return processCandidateData(candidate[0]);
  }
  
  // Deep clean the education and experiences arrays to ensure they don't contain undefined objects
  let education = ensureArray(candidate.education || []);
  let experiences = ensureArray(candidate.experiences || []);
  let certifications = ensureArray(candidate.certifications || []);
  let projects = ensureArray(candidate.projects || []);
  
  // Ensure each item in these arrays isn't an "undefined" object
  education = education.filter(item => !isUndefinedObject(item));
  experiences = experiences.filter(item => !isUndefinedObject(item));
  certifications = certifications.filter(item => !isUndefinedObject(item));
  projects = projects.filter(item => !isUndefinedObject(item));
  
  return {
    ...candidate,
    skills: ensureStringArray(candidate.skills || []),
    education: education,
    experiences: experiences,
    languages: ensureArray(candidate.languages || []),
    certifications: certifications,
    publications: ensureArray(candidate.publications || []),
    professional_references: ensureArray(candidate.professional_references || []),
    professional_networks: ensureArray(candidate.professional_networks || []),
    continuous_training: ensureArray(candidate.continuous_training || []),
    special_permits: ensureArray(candidate.special_permits || []),
    industries: ensureArray(candidate.industries || []),
    projects: projects
  };
}
