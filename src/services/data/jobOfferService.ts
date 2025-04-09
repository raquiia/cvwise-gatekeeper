import { SUPABASE_API_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/client';
import { candidateMatchingService } from './candidateMatchingService';

/**
 * Interface pour les offres d'emploi
 */
export interface JobOffer {
  id: string;
  user_id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  contract_type?: string;
  remote_preference?: string;
  experience_years_min?: number;
  experience_years_max?: number;
  education_level?: string;
  required_degrees?: string[];
  required_schools?: string[];
  required_skills?: any[];
  preferred_skills?: any[];
  industry_sectors?: string[];
  preferred_companies?: string[];
  required_languages?: any[];
  mobility?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  benefits?: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
  valid_until?: string;
}

/**
 * Service responsable de la gestion des offres d'emploi
 */
export const jobOfferService = {
  /**
   * Créer une nouvelle offre d'emploi
   */
  createJobOffer: async (jobOffer: Omit<JobOffer, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<JobOffer> => {
    try {
      console.log("Creating new job offer:", jobOffer.title);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/create_job_offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_job_offer: jobOffer
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error creating job offer: ${errorText}`);
      }

      const data = await response.json();
      console.log("Job offer created successfully:", data);
      
      // Cast data to JobOffer type
      const typedData = data as JobOffer;
      
      // Calculer automatiquement les scores de matching pour tous les candidats de l'utilisateur
      if (typedData && typedData.id) {
        await candidateMatchingService.calculateMatchesForJobOffer(typedData.id);
      }
      
      return typedData;
    } catch (error: any) {
      console.error("Exception in createJobOffer:", error);
      throw new Error(error.message || "Impossible de créer l'offre d'emploi");
    }
  },
  
  /**
   * Mettre à jour une offre d'emploi existante
   */
  updateJobOffer: async (jobOfferId: string, updates: Partial<JobOffer>): Promise<JobOffer> => {
    try {
      console.log(`Updating job offer with ID: ${jobOfferId}`);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/update_job_offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_job_offer_id: jobOfferId,
          p_updates: updates
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error updating job offer: ${errorText}`);
      }

      const data = await response.json();
      console.log("Job offer updated successfully:", data);
      
      // Cast data to JobOffer type
      const typedData = data as JobOffer;
      
      // Recalculer les scores de matching pour tous les candidats
      if (typedData && typedData.id) {
        await candidateMatchingService.calculateMatchesForJobOffer(jobOfferId);
      }
      
      return typedData;
    } catch (error: any) {
      console.error("Exception in updateJobOffer:", error);
      throw new Error(error.message || "Impossible de mettre à jour l'offre d'emploi");
    }
  },
  
  /**
   * Supprimer une offre d'emploi
   */
  deleteJobOffer: async (jobOfferId: string): Promise<boolean> => {
    try {
      console.log(`Deleting job offer with ID: ${jobOfferId}`);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/delete_job_offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_job_offer_id: jobOfferId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error deleting job offer: ${errorText}`);
      }

      const result = await response.json();
      console.log(`Job offer ${jobOfferId} deleted successfully`);
      return result as boolean;
    } catch (error: any) {
      console.error("Exception in deleteJobOffer:", error);
      throw new Error(error.message || "Impossible de supprimer l'offre d'emploi");
    }
  },
  
  /**
   * Récupérer toutes les offres d'emploi d'un utilisateur
   */
  getUserJobOffers: async (): Promise<JobOffer[]> => {
    try {
      console.log("Fetching job offers for current user");
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/get_user_job_offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching job offers: ${errorText}`);
      }

      const data = await response.json();
      
      // Cast data to JobOffer[] type
      const typedData = (data || []) as JobOffer[];
      
      console.log(`Retrieved ${typedData.length} job offers`);
      return typedData;
    } catch (error: any) {
      console.error("Exception in getUserJobOffers:", error);
      throw new Error(error.message || "Impossible de récupérer les offres d'emploi");
    }
  },
  
  /**
   * Récupérer une offre d'emploi par son ID
   */
  getJobOfferById: async (jobOfferId: string): Promise<JobOffer | null> => {
    try {
      console.log(`Fetching job offer with ID: ${jobOfferId}`);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/get_job_offer_by_id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_job_offer_id: jobOfferId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching job offer: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data) {
        console.log(`No job offer found with ID: ${jobOfferId}`);
        return null;
      }
      
      // Cast data to JobOffer type
      const typedData = data as JobOffer;
      
      console.log("Job offer retrieved successfully:", typedData);
      return typedData;
    } catch (error: any) {
      console.error("Exception in getJobOfferById:", error);
      throw new Error(error.message || "Impossible de récupérer l'offre d'emploi");
    }
  },
  
  /**
   * Déterminer le pays à partir d'une localisation
   */
  getCountryFromLocation: (location: string): string => {
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
  },
  
  /**
   * Déterminer la devise en fonction du pays
   */
  getCurrencyFromCountry: (country: string): string => {
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
  }
};
