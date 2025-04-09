
import { supabase } from '@/integrations/supabase/client';
import { candidateMatchingService } from '../candidateMatchingService';
import { JobOffer } from './types';

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
      
      // Préparer les données pour l'insertion
      const jobOfferData = {
        ...jobOffer,
        user_id: user.id
      };
      
      // Insérer directement dans la table job_offers
      const { data, error } = await supabase
        .from('job_offers')
        .insert(jobOfferData)
        .select()
        .single();
      
      if (error) {
        console.error("Error creating job offer:", error);
        throw new Error(`Error creating job offer: ${error.message}`);
      }
      
      console.log("Job offer created successfully:", data);
      
      // Cast data to JobOffer type
      const typedData = data as JobOffer;
      
      // Calculer automatiquement les scores de matching pour tous les candidats de l'utilisateur
      if (typedData && typedData.id) {
        await candidateMatchingService.calculateMatchesForJobOffer(typedData.id);
        
        // Set this as the active job offer
        await candidateMatchingService.setActiveJobOffer(typedData.id);
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
      
      // Cast data to JobOffer type
      const typedData = data as JobOffer;
      
      // Recalculer les scores de matching pour tous les candidats
      if (typedData && typedData.id) {
        await candidateMatchingService.calculateMatchesForJobOffer(jobOfferId);
        
        // If this is the active job offer, update the cached version
        if (candidateMatchingService.getActiveJobOfferId() === jobOfferId) {
          await candidateMatchingService.setActiveJobOffer(jobOfferId);
        }
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
      
      // Utiliser directement les opérations de requête de Supabase
      const { data, error } = await supabase
        .from('job_offers')
        .select('*')
        .eq('id', jobOfferId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          console.log(`No job offer found with ID: ${jobOfferId}`);
          return null;
        }
        console.error("Error fetching job offer:", error);
        throw new Error(`Error fetching job offer: ${error.message}`);
      }
      
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
  }
};
