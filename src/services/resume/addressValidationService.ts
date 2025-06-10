
/**
 * Service de validation et correction des données d'adresse extraites par l'IA
 * Version améliorée avec détection intelligente des données manquantes
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
 * Patterns améliorés pour détecter des erreurs courantes dans l'extraction d'adresse
 */
const VALIDATION_PATTERNS = {
  age: [
    /^\d{1,2}\s*ans?$/i,
    /^\d{1,2}$/, // Juste un nombre seul (probablement un âge)
    /age\s*:\s*\d{1,2}/i,
    /\d{1,2}\s*years?\s*old/i
  ],
  phone: [
    /^\+?\d{1,4}[\s\-\(\)]*\d{1,4}[\s\-\(\)]*\d{1,4}[\s\-\(\)]*\d{1,4}[\s\-\(\)]*\d{0,4}$/,
    /^0\d{9,10}$/,
    /^\d{2}\s\d{2}\s\d{2}\s\d{2}\s\d{2}$/,
    /mobile\s*:\s*\+?\d/i,
    /tel\s*:\s*\+?\d/i,
    /phone\s*:\s*\+?\d/i
  ],
  email: [
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    /email\s*:\s*[^\s@]+@/i,
    /mail\s*:\s*[^\s@]+@/i
  ]
};

/**
 * Patterns améliorés pour extraction de données manquantes
 */
const EXTRACTION_PATTERNS = {
  email: [
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    /e-?mail\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
  ],
  phone: [
    /(?:tel|phone|mobile|portable)\s*:?\s*(\+?[\d\s\-\(\)\.]{8,20})/gi,
    /(\+?33\s?[1-9](?:[\s\-\.]?\d{2}){4})/g,
    /(\+?41\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2})/g,
    /(0[1-9](?:[\s\-\.]?\d{2}){4})/g,
    /(\d{2}\s\d{2}\s\d{2}\s\d{2}\s\d{2})/g
  ],
  address: [
    // Adresses avec numéro + rue + ville
    /(?:^|\n)\s*(\d+[\w\s]*(?:rue|avenue|boulevard|place|chemin|allée|impasse|passage)[^,\n]*?)[\s,]*(\d{5})?\s*([A-Za-zÀ-ÿ\s\-']+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium))?/gim,
    // Adresses sans numéro mais avec indication de rue
    /(?:^|\n)\s*((?:rue|avenue|boulevard|place|chemin|allée|impasse|passage)\s+[^,\n]+?)[\s,]*(\d{5})?\s*([A-Za-zÀ-ÿ\s\-']+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium))?/gim
  ],
  postalCode: [
    /\b(\d{5})\s+([A-Za-zÀ-ÿ\s\-']+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium))?/gi
  ]
};

/**
 * Valide et corrige les données d'adresse extraites par l'IA
 */
export const validateAndCorrectAddressData = (candidateData: CandidateDataWithAddress): CandidateDataWithAddress => {
  console.log('🔍 Enhanced AddressValidationService: Starting validation...');
  console.log('📊 Input data:', {
    address: candidateData.address,
    postal_code: candidateData.postal_code,
    city: candidateData.city,
    country: candidateData.country,
    location: candidateData.location,
    email: candidateData.email,
    phone: candidateData.phone
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
    if (addressComponents.postal_code || addressComponents.city || addressComponents.address) {
      Object.assign(correctedData, addressComponents);
      console.log(`✅ Extracted components:`, addressComponents);
    }
  }
  
  console.log('✅ Enhanced AddressValidationService: Validation completed');
  console.log('📊 Output data:', {
    address: correctedData.address,
    postal_code: correctedData.postal_code,
    city: correctedData.city,
    country: correctedData.country,
    location: correctedData.location,
    email: correctedData.email,
    phone: correctedData.phone
  });
  
  return correctedData;
};

/**
 * Extrait les composants d'adresse à partir d'un texte (amélioré)
 */
export const extractAddressComponents = (text: string): AddressData => {
  if (!text) return {};
  
  console.log(`🔍 Enhanced address component extraction from: "${text}"`);
  
  // Patterns améliorés pour extraire les composants d'adresse
  const patterns = [
    // Pattern 1: Adresse complète avec rue + code postal + ville + pays
    /(\d+[\w\s]*(?:rue|avenue|boulevard|place|chemin|allée|impasse|passage)[^,\n]*?)[\s,]*(\d{5})\s+([A-Za-zÀ-ÿ\s\-']+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium|Luxembourg))?/i,
    // Pattern 2: Code postal + ville + pays
    /(\d{5})\s+([A-Za-zÀ-ÿ\s\-']+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium|Luxembourg))?/i,
    // Pattern 3: Ville, Pays
    /([A-Za-zÀ-ÿ\s\-']+?)\s*,\s*(France|Suisse|Switzerland|Belgique|Belgium|Luxembourg)/i,
    // Pattern 4: Ville reconnue
    /(Geneva|Genève|Lausanne|Zurich|Bern|Berne|Basel|Bâle|Paris|Lyon|Marseille|Toulouse|Nice|Colomiers)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const result: AddressData = {};
      
      if (pattern.source.includes('rue|avenue|boulevard')) {
        // Pattern avec adresse complète
        result.address = match[1]?.trim();
        result.postal_code = match[2];
        result.city = match[3]?.trim();
        result.country = match[4] || 'France';
      } else if (pattern.source.includes('\\d{5}')) {
        // Pattern avec code postal
        result.postal_code = match[1];
        result.city = match[2]?.trim();
        result.country = match[3] || 'France';
      } else if (pattern.source.includes(',')) {
        // Pattern ville, pays
        result.city = match[1]?.trim();
        result.country = match[2];
      } else {
        // Pattern ville seule
        result.city = match[1]?.trim();
        // Auto-détection du pays basé sur la ville
        const cityLower = match[1]?.toLowerCase();
        if (['geneva', 'genève', 'lausanne', 'zurich', 'bern', 'berne', 'basel', 'bâle'].includes(cityLower)) {
          result.country = 'Switzerland';
        } else {
          result.country = 'France';
        }
      }
      
      result.location = match[0];
      
      console.log('✅ Enhanced address components extracted:', result);
      return result;
    }
  }
  
  console.log('ℹ️ No address components found');
  return {};
};

/**
 * Extrait les données manquantes à partir du texte brut
 */
export const extractMissingDataFromText = (text: string, currentData: CandidateDataWithAddress): CandidateDataWithAddress => {
  console.log('🔍 Enhanced missing data extraction from text...');
  
  const enhancedData = { ...currentData };
  
  // Extraction des emails manquants
  if (!enhancedData.email) {
    for (const pattern of EXTRACTION_PATTERNS.email) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const email = match[1] || match[0];
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          enhancedData.email = email;
          console.log(`📧 Found missing email: ${email}`);
          break;
        }
      }
      if (enhancedData.email) break;
    }
  }
  
  // Extraction des téléphones manquants
  if (!enhancedData.phone) {
    for (const pattern of EXTRACTION_PATTERNS.phone) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const phone = match[1] || match[0];
        if (phone && phone.replace(/\D/g, '').length >= 8) {
          enhancedData.phone = phone.trim();
          console.log(`📱 Found missing phone: ${phone}`);
          break;
        }
      }
      if (enhancedData.phone) break;
    }
  }
  
  // Extraction des adresses manquantes
  if (!enhancedData.address) {
    for (const pattern of EXTRACTION_PATTERNS.address) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const potentialAddress = match[1];
        if (potentialAddress && potentialAddress.length > 5) {
          // Vérifier que ce n'est pas un âge ou autre donnée
          if (!/^\d{1,2}\s*ans?$/i.test(potentialAddress) && 
              !/^[a-zA-Z0-9._%+-]+@/.test(potentialAddress)) {
            enhancedData.address = potentialAddress.trim();
            if (match[2]) enhancedData.postal_code = match[2];
            if (match[3]) enhancedData.city = match[3].trim();
            if (match[4]) enhancedData.country = match[4];
            console.log(`🏠 Found missing address: ${potentialAddress}`);
            break;
          }
        }
      }
      if (enhancedData.address) break;
    }
  }
  
  // Extraction des codes postaux et villes manquants
  if (!enhancedData.postal_code || !enhancedData.city) {
    for (const pattern of EXTRACTION_PATTERNS.postalCode) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (!enhancedData.postal_code && match[1]) {
          enhancedData.postal_code = match[1];
          console.log(`📮 Found missing postal code: ${match[1]}`);
        }
        if (!enhancedData.city && match[2]) {
          enhancedData.city = match[2].trim();
          console.log(`🏙️ Found missing city: ${match[2]}`);
        }
        if (!enhancedData.country && match[3]) {
          enhancedData.country = match[3];
          console.log(`🌍 Found missing country: ${match[3]}`);
        }
        if (enhancedData.postal_code && enhancedData.city) break;
      }
      if (enhancedData.postal_code && enhancedData.city) break;
    }
  }
  
  console.log('✅ Enhanced missing data extraction completed');
  return enhancedData;
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
 * Détecte les données critiques manquantes
 */
export const detectMissingCriticalData = (candidateData: CandidateDataWithAddress, originalText: string): string[] => {
  const missing: string[] = [];
  
  // Vérifier si email est présent dans le texte mais pas extrait
  if (!candidateData.email) {
    const emailFound = EXTRACTION_PATTERNS.email.some(pattern => pattern.test(originalText));
    if (emailFound) {
      missing.push('Email trouvé dans le CV mais non extrait');
    }
  }
  
  // Vérifier si téléphone est présent dans le texte mais pas extrait
  if (!candidateData.phone) {
    const phoneFound = EXTRACTION_PATTERNS.phone.some(pattern => pattern.test(originalText));
    if (phoneFound) {
      missing.push('Téléphone trouvé dans le CV mais non extrait');
    }
  }
  
  // Vérifier si adresse est présente dans le texte mais pas extraite
  if (!candidateData.address) {
    const addressFound = EXTRACTION_PATTERNS.address.some(pattern => pattern.test(originalText));
    if (addressFound) {
      missing.push('Adresse trouvée dans le CV mais non extraite');
    }
  }
  
  return missing;
};

/**
 * Suggère des corrections pour les données d'adresse (amélioré)
 */
export const suggestAddressCorrections = (candidateData: CandidateDataWithAddress, originalText?: string): string[] => {
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
  
  // Suggestions basées sur les données manquantes détectées
  if (originalText) {
    const missingData = detectMissingCriticalData(candidateData, originalText);
    suggestions.push(...missingData);
  }
  
  return suggestions;
};
