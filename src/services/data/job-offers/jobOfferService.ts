
import { supabase } from '@/integrations/supabase/client';
import { candidateMatchingService } from '../candidate-matching/candidateMatchingService';
import { JobOffer } from './types';
import { ensureArray, processJobOfferData } from '@/utils/candidateUtils';
import { Json } from '@/integrations/supabase/types';

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
      
      // Récupérer l'ID de l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Pre-process the job offer to ensure types are correct for the database
      const dataToInsert = {
        ...jobOffer,
        user_id: user.id
      };
      
      // Insérer directement dans la table job_offers
      const { data, error } = await supabase
        .from('job_offers')
        .insert(dataToInsert)
        .select()
        .single();
      
      if (error) {
        console.error("Error creating job offer:", error);
        throw new Error(`Error creating job offer: ${error.message}`);
      }
      
      console.log("Job offer created successfully:", data);
      
      // Process the response to ensure correct types
      const processedData = processJobOfferData(data);
      
      // Set this as the active job offer
      if (processedData && processedData.id) {
        await candidateMatchingService.calculateMatchesForJobOffer(processedData.id);
        await candidateMatchingService.setActiveJobOffer(processedData.id);
      }
      
      return processedData as JobOffer;
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
      
      // Utiliser directement les opérations de mise à jour de Supabase
      const { data, error } = await supabase
        .from('job_offers')
        .update(updates)
        .eq('id', jobOfferId)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating job offer:", error);
        throw new Error(`Error updating job offer: ${error.message}`);
      }
      
      console.log("Job offer updated successfully:", data);
      
      // Process the response to ensure correct types
      const processedData = processJobOfferData(data);
      
      // Recalculer les scores de matching pour tous les candidats
      if (processedData && processedData.id) {
        await candidateMatchingService.calculateMatchesForJobOffer(jobOfferId);
        
        // If this is the active job offer, update the cached version
        if (candidateMatchingService.getActiveJobOfferId() === jobOfferId) {
          await candidateMatchingService.setActiveJobOffer(jobOfferId);
        }
      }
      
      return processedData as JobOffer;
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
      
      // If this is the active job offer, clear it
      if (candidateMatchingService.getActiveJobOfferId() === jobOfferId) {
        await candidateMatchingService.setActiveJobOffer(null);
      }
      
      // Utiliser directement les opérations de suppression de Supabase
      const { error } = await supabase
        .from('job_offers')
        .delete()
        .eq('id', jobOfferId);
      
      if (error) {
        console.error("Error deleting job offer:", error);
        throw new Error(`Error deleting job offer: ${error.message}`);
      }
      
      console.log(`Job offer ${jobOfferId} deleted successfully`);
      return true;
    } catch (error: any) {
      console.error("Exception in deleteJobOffer:", error);
      throw new Error(error.message || "Impossible de supprimer l'offre d'emploi");
    }
  },
  
  /**
   * Activer une offre d'emploi (la définir comme contexte actif pour le scoring)
   */
  activateJobOffer: async (jobOfferId: string): Promise<boolean> => {
    try {
      return await candidateMatchingService.setActiveJobOffer(jobOfferId);
    } catch (error: any) {
      console.error("Exception in activateJobOffer:", error);
      return false;
    }
  },
  
  /**
   * Récupérer toutes les offres d'emploi d'un utilisateur
   */
  getUserJobOffers: async (): Promise<JobOffer[]> => {
    try {
      console.log("Fetching job offers for current user");
      
      // Récupérer l'ID de l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Utiliser directement les opérations de requête de Supabase
      const { data, error } = await supabase
        .from('job_offers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching job offers:", error);
        throw new Error(`Error fetching job offers: ${error.message}`);
      }
      
      // Process each job offer to ensure correct types
      const processedData = (data || []).map(processJobOfferData);
      
      console.log(`Retrieved ${processedData.length} job offers`);
      return processedData as JobOffer[];
    } catch (error: any) {
      console.error("Exception in getUserJobOffers:", error);
      throw new Error(error.message || "Impossible de récupérer les offres d'emploi");
    }
  },

  /**
   * Récupérer toutes les offres d'emploi avec les informations des propriétaires
   */
  getAllJobOffers: async (): Promise<(JobOffer & { owner_first_name: string; owner_last_name: string; is_own_offer: boolean })[]> => {
    try {
      console.log("Fetching all job offers with owner details");
      
      // Récupérer l'ID de l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Récupérer toutes les offres d'emploi
      const { data: offersData, error: offersError } = await supabase
        .from('job_offers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (offersError) {
        console.error("Error fetching job offers:", offersError);
        throw new Error(`Error fetching job offers: ${offersError.message}`);
      }

      if (!offersData || offersData.length === 0) {
        console.log("No job offers found");
        return [];
      }

      // Récupérer les profils des propriétaires
      const userIds = [...new Set(offersData.map(offer => offer.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw new Error(`Error fetching profiles: ${profilesError.message}`);
      }

      // Créer un map des profils pour un accès rapide
      const profilesMap = new Map();
      (profilesData || []).forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Combiner les données
      const processedData = offersData.map(offer => {
        const profile = profilesMap.get(offer.user_id);
        const processedOffer = processJobOfferData(offer);
        
        return {
          ...processedOffer,
          owner_first_name: profile?.first_name || '',
          owner_last_name: profile?.last_name || '',
          is_own_offer: offer.user_id === user.id
        };
      });
      
      console.log(`Retrieved ${processedData.length} job offers from all users`);
      return processedData as (JobOffer & { owner_first_name: string; owner_last_name: string; is_own_offer: boolean })[];
    } catch (error: any) {
      console.error("Exception in getAllJobOffers:", error);
      throw new Error(error.message || "Impossible de récupérer les offres d'emploi");
    }
  },
  
  /**
   * Récupérer une offre d'emploi par son ID
   */
  getJobOfferById: async (jobOfferId: string): Promise<JobOffer | null> => {
    try {
      console.log(`Fetching job offer with ID: ${jobOfferId}`);
      
      // Utiliser directement les opérations de requête de Supabase
      const { data, error } = await supabase
        .from('job_offers')
        .select('*')
        .eq('id', jobOfferId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching job offer:", error);
        throw new Error(`Error fetching job offer: ${error.message}`);
      }
      
      if (!data) {
        console.log(`No job offer found with ID: ${jobOfferId}`);
        return null;
      }
      
      // Process the response to ensure correct types
      const processedData = processJobOfferData(data);
      
      console.log("Job offer retrieved successfully:", processedData);
      return processedData as JobOffer;
    } catch (error: any) {
      console.error("Exception in getJobOfferById:", error);
      throw new Error(error.message || "Impossible de récupérer l'offre d'emploi");
    }
  }
};
