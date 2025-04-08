
/**
 * Assure qu'un champ possiblement JSON, array ou string est transformé en tableau
 */
export function ensureArray<T>(data: unknown): T[] {
  if (!data) return [];
  
  // Si c'est déjà un tableau, le retourner
  if (Array.isArray(data)) {
    return data as T[];
  }
  
  // Si c'est une string, essayer de la parser comme JSON
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed as T[] : [data as T];
    } catch (e) {
      // Si le parsing échoue, retourner la string comme élément unique du tableau
      return [data as T];
    }
  }
  
  // Si c'est un objet JSON, le retourner comme élément unique du tableau
  if (typeof data === 'object' && data !== null) {
    return [data as T];
  }
  
  // Pour les valeurs primitives (number, boolean), les retourner comme élément unique
  return [data as T];
}
