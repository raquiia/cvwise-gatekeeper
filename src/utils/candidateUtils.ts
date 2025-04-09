
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
