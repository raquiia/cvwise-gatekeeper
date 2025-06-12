
import { CandidateData } from '@/services/data/candidateService';

/**
 * Extrait la dernière entreprise (la plus récente) d'un candidat
 * Priorité : dernière expérience dans le champ `experiences`
 * Fallback : première partie du champ `company` si multiple
 */
export const getLastCompany = (candidate: CandidateData): string => {
  // 1. Essayer d'extraire depuis les expériences (plus fiable)
  if (candidate.experiences && Array.isArray(candidate.experiences) && candidate.experiences.length > 0) {
    // Trier les expériences par date de fin (plus récente en premier)
    const sortedExperiences = [...candidate.experiences].sort((a, b) => {
      // Si pas de date de fin, considérer comme l'expérience actuelle (plus récente)
      if (!a.end_date && b.end_date) return -1;
      if (a.end_date && !b.end_date) return 1;
      if (!a.end_date && !b.end_date) return 0;
      
      // Comparer les dates de fin
      return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
    });
    
    const lastExperience = sortedExperiences[0];
    if (lastExperience?.company && lastExperience.company.trim() !== '') {
      return lastExperience.company.trim();
    }
  }
  
  // 2. Fallback : utiliser le champ company en extrayant la première partie si multiple
  if (candidate.company && candidate.company.trim() !== '') {
    const company = candidate.company.trim();
    
    // Si le champ contient plusieurs entreprises séparées par des virgules, prendre la première
    if (company.includes(',')) {
      return company.split(',')[0].trim();
    }
    
    // Si le champ contient plusieurs entreprises séparées par des points-virgules, prendre la première
    if (company.includes(';')) {
      return company.split(';')[0].trim();
    }
    
    // Si le champ contient "chez" ou "at", prendre ce qui suit
    const chezMatch = company.match(/(?:chez|at)\s+([^,;]+)/i);
    if (chezMatch) {
      return chezMatch[1].trim();
    }
    
    return company;
  }
  
  // 3. Aucune entreprise trouvée
  return 'Non spécifiée';
};
