
/**
 * Service de validation et correction des données d'adresse extraites par l'IA
 */

export interface AddressData {
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  location?: string;
}

export interface CandidateDataWithAddress {
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  location?: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

/**
 * Patterns pour détecter des erreurs courantes dans l'extraction d'adresse
 */
const VALIDATION_PATTERNS = {
  age: [
    /^\d{1,2}\s*ans?$/i,
    /^\d{1,2}$/, // Juste un nombre seul (probablement un âge)
    /age\s*:\s*\d{1,2}/i,
    /\d{1,2}\s*years?\s*old/i
  ],
  phone: [
    /^\+?\d{1,4}[\s\-\(\)]*\d{1,4}[\s\-\(\)]*\d{1,4}[\s\-\(\)]*\d{1,4}/,
    /^0\d{9,10}$/,
    /mobile\s*:\s*\+?\d/i,
    /tel\s*:\s*\+?\d/i
  ],
  email: [
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    /email\s*:\s*[^\s@]+@/i
  ]
};

/**
 * Valide et corrige les données d'adresse extraites par l'IA
 */
export const validateAndCorrectAddressData = (candidateData: CandidateDataWithAddress): CandidateDataWithAddress => {
  console.log('🔍 AddressValidationService: Starting validation...');
  console.log('📊 Input data:', {
    address: candidateData.address,
    postal_code: candidateData.postal_code,
    city: candidateData.city,
    country: candidateData.country,
    location: candidateData.location
  });
  
  const correctedData = { ...candidateData };
  
  // Validation du champ address
  if (correctedData.address) {
    const address = String(correctedData.address).trim();
    
    // Vérifier si l'adresse contient un âge par erreur
    for (const pattern of VALIDATION_PATTERNS.age) {
      if (pattern.test(address)) {
        console.log(`⚠️ Detected age "${address}" in address field, clearing it`);
        correctedData.address = '';
        break;
      }
    }
    
    // Vérifier si l'adresse contient un téléphone par erreur
    if (correctedData.address) {
      for (const pattern of VALIDATION_PATTERNS.phone) {
        if (pattern.test(address)) {
          console.log(`⚠️ Detected phone "${address}" in address field, moving to phone`);
          if (!correctedData.phone) {
            correctedData.phone = address;
          }
          correctedData.address = '';
          break;
        }
      }
    }
    
    // Vérifier si l'adresse contient un email par erreur
    if (correctedData.address) {
      for (const pattern of VALIDATION_PATTERNS.email) {
        if (pattern.test(address)) {
          console.log(`⚠️ Detected email "${address}" in address field, moving to email`);
          if (!correctedData.email) {
            correctedData.email = address;
          }
          correctedData.address = '';
          break;
        }
      }
    }
  }
  
  // Extraction intelligente d'adresse à partir de la localisation si l'adresse est vide
  if (!correctedData.address && correctedData.location) {
    const location = String(correctedData.location);
    console.log(`🏠 Trying to extract address components from location: "${location}"`);
    
    const addressComponents = extractAddressComponents(location);
    if (addressComponents.postal_code || addressComponents.city) {
      Object.assign(correctedData, addressComponents);
      console.log(`✅ Extracted components:`, addressComponents);
    }
  }
  
  console.log('✅ AddressValidationService: Validation completed');
  console.log('📊 Output data:', {
    address: correctedData.address,
    postal_code: correctedData.postal_code,
    city: correctedData.city,
    country: correctedData.country,
    location: correctedData.location
  });
  
  return correctedData;
};

/**
 * Extrait les composants d'adresse à partir d'un texte
 */
export const extractAddressComponents = (text: string): AddressData => {
  if (!text) return {};
  
  console.log(`🔍 Extracting address components from: "${text}"`);
  
  // Patterns pour extraire les composants d'adresse
  const patterns = [
    // Pattern 1: Code postal + ville + pays
    /(\d{5})\s+([A-Za-zÀ-ÿ\s-]+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium|Luxembourg))?/i,
    // Pattern 2: Ville, Pays
    /([A-Za-zÀ-ÿ\s-]+?)\s*,\s*(France|Suisse|Switzerland|Belgique|Belgium|Luxembourg)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const result: AddressData = {};
      
      if (pattern.source.includes('\\d{5}')) {
        // Pattern avec code postal
        result.postal_code = match[1];
        result.city = match[2]?.trim();
        result.country = match[3] || 'France';
      } else {
        // Pattern ville, pays
        result.city = match[1]?.trim();
        result.country = match[2];
      }
      
      result.location = match[0];
      
      console.log('✅ Address components extracted:', result);
      return result;
    }
  }
  
  console.log('ℹ️ No address components found');
  return {};
};

/**
 * Valide si une adresse semble être une vraie adresse de rue
 */
export const isValidStreetAddress = (address: string): boolean => {
  if (!address) return false;
  
  // Une adresse valide devrait contenir plus qu'un simple âge ou numéro
  if (/^\d{1,2}\s*ans?$/i.test(address)) return false;
  if (/^\d{1,2}$/.test(address)) return false;
  
  // Une adresse valide devrait avoir une certaine longueur
  if (address.length < 5) return false;
  
  // Une adresse ne devrait pas être un email ou téléphone
  if (VALIDATION_PATTERNS.email.some(pattern => pattern.test(address))) return false;
  if (VALIDATION_PATTERNS.phone.some(pattern => pattern.test(address))) return false;
  
  return true;
};

/**
 * Suggère des corrections pour les données d'adresse
 */
export const suggestAddressCorrections = (candidateData: CandidateDataWithAddress): string[] => {
  const suggestions: string[] = [];
  
  if (candidateData.address && !isValidStreetAddress(candidateData.address)) {
    suggestions.push(`L'adresse "${candidateData.address}" ne semble pas être une adresse de rue valide`);
  }
  
  if (!candidateData.postal_code && candidateData.location) {
    const components = extractAddressComponents(candidateData.location);
    if (components.postal_code) {
      suggestions.push(`Code postal "${components.postal_code}" trouvé dans la localisation`);
    }
  }
  
  if (!candidateData.city && candidateData.location) {
    const components = extractAddressComponents(candidateData.location);
    if (components.city) {
      suggestions.push(`Ville "${components.city}" trouvée dans la localisation`);
    }
  }
  
  return suggestions;
};
