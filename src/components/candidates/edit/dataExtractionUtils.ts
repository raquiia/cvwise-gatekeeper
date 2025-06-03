import { CandidateData } from '@/services/data/candidateService';

/**
 * Fonction ultra-robuste pour extraire les valeurs de champs qui peuvent être dans différents formats
 */
export const extractFieldValue = (field: any): string | undefined => {
  console.log('🔍 EXTRACTING FIELD:', JSON.stringify(field, null, 2));
  
  // Si null ou undefined - CORRECTION: retourner undefined au lieu de chaîne vide
  if (field === null || field === undefined) {
    return undefined;
  }
  
  // Si c'est déjà une chaîne valide
  if (typeof field === 'string') {
    if (field === 'undefined' || field === 'null' || field === '') {
      return undefined;
    }
    return field;
  }
  
  // Si c'est un nombre
  if (typeof field === 'number') {
    return String(field);
  }
  
  // Si c'est un objet complexe
  if (typeof field === 'object' && field !== null) {
    // Format {_type: "...", value: "..."}
    if (field.hasOwnProperty('value')) {
      const value = field.value;
      if (value && value !== 'undefined' && value !== 'null' && value !== '') {
        return String(value);
      }
    }
    
    // Si l'objet a d'autres propriétés, on essaie de les extraire
    if (field.hasOwnProperty('text')) {
      return String(field.text);
    }
    
    if (field.hasOwnProperty('name')) {
      return String(field.name);
    }
    
    // En dernier recours, on essaie de stringifier
    try {
      const stringified = JSON.stringify(field);
      if (stringified !== '{}' && stringified !== 'null') {
        return stringified;
      }
    } catch (e) {
      // Ignore
    }
  }
  
  return undefined;
};

/**
 * Fonction pour extraire un nombre de façon sécurisée
 */
export const extractNumberValue = (field: any): number | undefined => {
  console.log('🔢 EXTRACTING NUMBER:', JSON.stringify(field, null, 2));
  
  if (field === null || field === undefined) {
    return undefined;
  }
  
  if (typeof field === 'number') {
    return field;
  }
  
  if (typeof field === 'string') {
    if (field === '' || field === 'undefined' || field === 'null') {
      return undefined;
    }
    const parsed = parseInt(field, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  
  // Si c'est un objet complexe
  if (typeof field === 'object' && field !== null) {
    if (field.hasOwnProperty('value')) {
      const value = field.value;
      if (value && value !== 'undefined' && value !== 'null') {
        const parsed = parseInt(String(value), 10);
        return isNaN(parsed) ? undefined : parsed;
      }
    }
  }
  
  return undefined;
};

/**
 * Fonction pour extraire un tableau de façon sécurisée
 */
export const extractArrayValue = (field: any): any[] => {
  console.log('📚 EXTRACTING ARRAY:', JSON.stringify(field, null, 2));
  
  if (Array.isArray(field)) {
    return field;
  }
  
  if (field === null || field === undefined) {
    return [];
  }
  
  if (typeof field === 'string') {
    if (field === '' || field === 'undefined' || field === 'null') {
      return [];
    }
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [field];
    } catch {
      return [field];
    }
  }
  
  // Si c'est un objet complexe
  if (typeof field === 'object' && field !== null) {
    if (field.hasOwnProperty('value')) {
      const value = field.value;
      if (value && value !== 'undefined' && value !== 'null') {
        try {
          const parsed = JSON.parse(String(value));
          return Array.isArray(parsed) ? parsed : [value];
        } catch {
          return [value];
        }
      }
    }
  }
  
  return [];
};

/**
 * Fonction principale pour extraire toutes les données d'un candidat
 */
export const extractCandidateFormData = (candidate: CandidateData) => {
  console.log('🎯 EXTRACTING ALL CANDIDATE DATA:', JSON.stringify(candidate, null, 2));
  
  const formData = {
    first_name: extractFieldValue(candidate.first_name),
    last_name: extractFieldValue(candidate.last_name),
    email: extractFieldValue(candidate.email),
    phone: extractFieldValue(candidate.phone),
    position: extractFieldValue(candidate.position),
    location: extractFieldValue(candidate.location),
    years_experience: extractNumberValue(candidate.years_experience),
    company: extractFieldValue(candidate.company),
    skills: extractArrayValue(candidate.skills),
    availability: extractFieldValue(candidate.availability),
    salary_expectations: extractFieldValue(candidate.salary_expectations),
    mobility: extractFieldValue(candidate.mobility),
    contract_type: extractFieldValue(candidate.contract_type),
    remote_preference: extractFieldValue(candidate.remote_preference),
    travel_willingness: extractFieldValue(candidate.travel_willingness),
    career_objectives: extractFieldValue(candidate.career_objectives),
    professional_values: extractFieldValue(candidate.professional_values),
    work_authorization: extractFieldValue(candidate.work_authorization),
    interests: extractFieldValue(candidate.interests)
  };
  
  console.log('🎯 FINAL EXTRACTED FORM DATA:', JSON.stringify(formData, null, 2));
  
  // Log des champs spécifiques pour debug
  console.log('🏢 Company:', formData.company);
  console.log('🏠 Remote preference:', formData.remote_preference);
  console.log('🚗 Mobility:', formData.mobility);
  console.log('💰 Salary expectations:', formData.salary_expectations);
  console.log('📝 Contract type:', formData.contract_type);
  
  return formData;
};
