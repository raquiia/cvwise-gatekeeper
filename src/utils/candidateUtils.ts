
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
