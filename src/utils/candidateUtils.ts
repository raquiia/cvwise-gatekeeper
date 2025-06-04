
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
