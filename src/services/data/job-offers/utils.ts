
/**
 * Utilitaires pour les offres d'emploi
 */

/**
 * Déterminer le pays à partir d'une localisation
 */
export const getCountryFromLocation = (location: string): string => {
  const locationLower = location.toLowerCase();
  
  // Liste des principales villes françaises
  const frenchCities = ['paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes', 
    'strasbourg', 'montpellier', 'bordeaux', 'lille', 'rennes', 'reims', 'toulon',
    'saint-etienne', 'le havre', 'dijon', 'angers', 'nîmes', 'villeurbanne', 'france'];
    
  // Liste des principales villes suisses
  const swissCities = ['genève', 'geneve', 'geneva', 'zürich', 'zurich', 'bern', 'berne', 
    'lausanne', 'lugano', 'basel', 'bâle', 'lucerne', 'winterthur', 'st. gallen', 'suisse', 'switzerland'];
    
  // Liste des principales villes belges
  const belgianCities = ['bruxelles', 'brussels', 'antwerp', 'anvers', 'gent', 'gand', 
    'charleroi', 'liège', 'liege', 'bruges', 'namur', 'leuven', 'louvain', 'belgique', 'belgium'];
    
  // Liste des principales villes luxembourgeoises
  const luxembourgCities = ['luxembourg', 'esch-sur-alzette', 'differdange', 'dudelange', 'luxembourg'];
    
  // Liste des principales villes allemandes
  const germanCities = ['berlin', 'hamburg', 'munich', 'münchen', 'cologne', 'köln', 
    'frankfurt', 'stuttgart', 'düsseldorf', 'dusseldorf', 'dortmund', 'essen', 'leipzig', 
    'bremen', 'dresden', 'allemagne', 'germany'];
    
  // Liste des principales villes britanniques
  const ukCities = ['london', 'londres', 'birmingham', 'leeds', 'glasgow', 'sheffield', 
    'manchester', 'edinburgh', 'édimbourg', 'liverpool', 'bristol', 'cardiff', 'royaume-uni', 
    'angleterre', 'england', 'uk', 'united kingdom'];
  
  // Vérifier si la localisation contient une ville ou un pays connu
  if (frenchCities.some(city => locationLower.includes(city))) {
    return 'France';
  } else if (swissCities.some(city => locationLower.includes(city))) {
    return 'Suisse';
  } else if (belgianCities.some(city => locationLower.includes(city))) {
    return 'Belgique';
  } else if (luxembourgCities.some(city => locationLower.includes(city))) {
    return 'Luxembourg';
  } else if (germanCities.some(city => locationLower.includes(city))) {
    return 'Allemagne';
  } else if (ukCities.some(city => locationLower.includes(city))) {
    return 'Royaume-Uni';
  }
  
  // Par défaut, on considère que c'est en France
  return 'France';
};

/**
 * Déterminer la devise en fonction du pays
 */
export const getCurrencyFromCountry = (country: string): string => {
  const countryLower = country.toLowerCase();
  
  if (countryLower === 'suisse' || countryLower === 'switzerland') {
    return 'CHF';
  } else if (countryLower === 'royaume-uni' || countryLower === 'angleterre' || 
             countryLower === 'england' || countryLower === 'uk' || 
             countryLower === 'united kingdom') {
    return 'GBP';
  } else if (countryLower === 'états-unis' || countryLower === 'etats-unis' || 
             countryLower === 'usa' || countryLower === 'united states') {
    return 'USD';
  }
  
  // Par défaut, on utilise l'euro
  return 'EUR';
};
