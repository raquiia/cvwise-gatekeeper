
import { supabase, SUPABASE_API_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/client';
import { resumeDataService } from './resumeDataService';
import { CandidateData } from './resumeDataService';
import { Json } from '@/integrations/supabase/types';

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
 * Interface pour les résultats de matching
 */
export interface CandidateJobMatch {
  id: string;
  candidate_id: string;
  job_offer_id: string;
  match_score: number;
  skills_match_score: number;
  experience_match_score: number;
  education_match_score: number;
  location_match_score: number;
  match_details: {
    skills_details: { score: number };
    experience_details: { score: number };
    education_details: { score: number };
    location_details: { score: number };
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Service responsable de la gestion des données des candidats
 */
export const candidateDataService = {
  /**
   * Récupérer tous les candidats d'un utilisateur
   */
  getUserCandidates: async (userId: string): Promise<CandidateData[]> => {
    try {
      console.log("Fetching candidates for user:", userId);
      
      // Using the secure RPC function to get all candidates
      const { data, error } = await supabase.rpc('get_user_candidates', {
        user_id_param: userId
      });
      
      if (error) {
        console.error("Error fetching candidates:", error.message);
        throw new Error(`Erreur lors de la récupération des candidats: ${error.message}`);
      }
      
      if (!data) {
        console.log("No candidates found for user:", userId);
        return [];
      }
      
      console.log(`Retrieved ${data.length} candidates`);
      
      // Transform the skills field from Json to string[] to match the CandidateData interface
      const transformedData = data.map(candidate => ({
        ...candidate,
        // Convert skills from Json to string[]
        skills: Array.isArray(candidate.skills) ? candidate.skills : 
                (typeof candidate.skills === 'string' ? [candidate.skills] : [])
      })) as CandidateData[];
      
      return transformedData;
    } catch (error: any) {
      console.error("Exception in getUserCandidates:", error);
      throw new Error(error.message || "Impossible de récupérer les candidats");
    }
  },
  
  /**
   * Récupérer un candidat par son ID
   */
  getCandidateById: async (candidateId: string): Promise<CandidateData | null> => {
    try {
      console.log("Fetching candidate with ID:", candidateId);
      
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Non authentifié");
      }
      
      // Fetch all candidates and find the matching one
      const candidates = await candidateDataService.getUserCandidates(user.id);
      
      // Find the candidate with the matching ID
      const candidate = candidates.find(c => c.id === candidateId);
      
      if (!candidate) {
        console.log("No candidate found with ID:", candidateId);
        return null;
      }
      
      console.log("Successfully retrieved candidate data:", candidate);
      
      return candidate;
    } catch (error: any) {
      console.error("Exception in getCandidateById:", error);
      throw new Error(error.message || "Impossible de récupérer le candidat");
    }
  },
  
  /**
   * Supprimer un candidat par son ID et le CV associé
   */
  deleteCandidate: async (candidateId: string): Promise<boolean> => {
    try {
      console.log(`Starting deletion of candidate with ID: ${candidateId}`);
      
      // 1. Récupérer d'abord le candidat pour obtenir le resume_id
      const { data: candidateData, error: candidateFetchError } = await supabase
        .from('candidates')
        .select('resume_id')
        .eq('id', candidateId)
        .maybeSingle();
      
      if (candidateFetchError) {
        console.error("Error fetching candidate for deletion:", candidateFetchError.message);
        throw new Error(`Erreur lors de la récupération du candidat: ${candidateFetchError.message}`);
      }
      
      // Store resume_id for later use if found
      const resumeId = candidateData?.resume_id;
      
      // 2. Supprimer le candidat
      const { error: deleteError } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);
      
      if (deleteError) {
        console.error("Error deleting candidate:", deleteError.message);
        throw new Error(`Erreur lors de la suppression du candidat: ${deleteError.message}`);
      }
      
      console.log(`Candidate ${candidateId} deleted successfully`);
      
      // 3. Si le candidat avait un resume_id, supprimer également le CV
      if (resumeId) {
        console.log(`Associated resume found: ${resumeId}, proceeding with resume deletion`);
        
        try {
          // Récupérer le CV pour obtenir le file_path
          const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .select('file_path')
            .eq('id', resumeId)
            .maybeSingle();
          
          if (resumeError) {
            console.error("Error fetching resume for deletion:", resumeError.message);
            // Ne pas bloquer le processus si la récupération du CV échoue
            return true;
          }
          
          if (resume && resume.file_path) {
            // Utiliser la fonction de suppression de CV qui gère à la fois le fichier et l'enregistrement
            const { deleteResume } = await import('../resume/fileOperations');
            await deleteResume(resumeId, resume.file_path);
            console.log(`Associated resume ${resumeId} deleted successfully`);
          }
        } catch (resumeDeleteError: any) {
          console.error("Error while deleting associated resume:", resumeDeleteError);
          // Le candidat a été supprimé avec succès, donc considérons l'opération comme réussie
          // même si la suppression du CV associé a échoué
          return true;
        }
      } else {
        console.log(`No associated resume found for candidate ${candidateId}, skipping resume deletion`);
      }
      
      return true;
    } catch (error: any) {
      console.error("Exception in deleteCandidate:", error);
      throw new Error(error.message || "Impossible de supprimer le candidat");
    }
  },
  
  /**
   * Créer une nouvelle offre d'emploi
   */
  createJobOffer: async (jobOffer: Omit<JobOffer, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<JobOffer> => {
    try {
      console.log("Creating new job offer:", jobOffer.title);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Non authentifié");
      }
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/create_job_offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_job_offer: {
            ...jobOffer,
            user_id: user.id
          }
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
        await candidateDataService.calculateMatchesForJobOffer(typedData.id);
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
        await candidateDataService.calculateMatchesForJobOffer(jobOfferId);
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
   * Calculer les scores de matching pour tous les candidats d'un utilisateur par rapport à une offre d'emploi
   */
  calculateMatchesForJobOffer: async (jobOfferId: string): Promise<string[]> => {
    try {
      console.log(`Calculating matches for job offer ID: ${jobOfferId}`);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/calculate_all_candidates_job_matches`, {
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
        throw new Error(`Error calculating matches: ${errorText}`);
      }

      const data = await response.json();
      
      // Cast data to string[] type
      const typedData = (data || []) as string[];
      
      console.log(`Calculated matches for ${typedData.length} candidates`);
      return typedData;
    } catch (error: any) {
      console.error("Exception in calculateMatchesForJobOffer:", error);
      throw new Error(error.message || "Impossible de calculer les correspondances");
    }
  },
  
  /**
   * Récupérer les résultats de matching pour un candidat et une offre d'emploi spécifiques
   */
  getCandidateJobMatch: async (candidateId: string, jobOfferId: string): Promise<CandidateJobMatch | null> => {
    try {
      console.log(`Fetching match between candidate ${candidateId} and job offer ${jobOfferId}`);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/get_candidate_job_match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_candidate_id: candidateId,
          p_job_offer_id: jobOfferId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching candidate-job match: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data) {
        console.log(`No match found between candidate ${candidateId} and job offer ${jobOfferId}`);
        return null;
      }
      
      // Cast data to CandidateJobMatch type
      const typedData = data as CandidateJobMatch;
      
      console.log("Match retrieved successfully:", typedData);
      return typedData;
    } catch (error: any) {
      console.error("Exception in getCandidateJobMatch:", error);
      throw new Error(error.message || "Impossible de récupérer le matching");
    }
  },
  
  /**
   * Récupérer tous les matchs pour une offre d'emploi spécifique, avec détails des candidats
   */
  getMatchesForJobOffer: async (jobOfferId: string): Promise<{candidate: CandidateData; match: CandidateJobMatch}[]> => {
    try {
      console.log(`Fetching all matches for job offer: ${jobOfferId}`);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/get_matches_for_job_offer`, {
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
        throw new Error(`Error fetching matches for job offer: ${errorText}`);
      }

      const data = await response.json();
      
      // Si aucune donnée n'est retournée, renvoyer un tableau vide
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      // Cast data to expected type
      const typedData = data as {candidate: CandidateData; match: CandidateJobMatch}[];
      
      // Trier par score de matching (du plus élevé au plus bas)
      typedData.sort((a, b) => b.match.match_score - a.match.match_score);
      
      console.log(`Retrieved ${typedData.length} matches for job offer ${jobOfferId}`);
      return typedData;
    } catch (error: any) {
      console.error("Exception in getMatchesForJobOffer:", error);
      throw new Error(error.message || "Impossible de récupérer les matchings");
    }
  },
  
  /**
   * Récupérer les meilleurs candidats pour une offre d'emploi spécifique
   */
  getTopCandidatesForJobOffer: async (jobOfferId: string, limit: number = 10): Promise<{candidate: CandidateData; match: CandidateJobMatch}[]> => {
    try {
      const allMatches = await candidateDataService.getMatchesForJobOffer(jobOfferId);
      return allMatches.slice(0, limit);
    } catch (error: any) {
      console.error("Exception in getTopCandidatesForJobOffer:", error);
      throw new Error(error.message || "Impossible de récupérer les meilleurs candidats");
    }
  },
  
  /**
   * Filtrer les candidats selon des critères spécifiques
   */
  filterCandidates: async (
    filters: {
      companies?: string[];
      locations?: string[];
      schools?: string[];
      degrees?: string[];
      skills?: string[];
      experienceMin?: number;
      experienceMax?: number;
      industries?: string[];
    }
  ): Promise<CandidateData[]> => {
    try {
      console.log("Filtering candidates with criteria:", filters);
      
      // Récupérer tous les candidats de l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Non authentifié");
      }
      
      const allCandidates = await candidateDataService.getUserCandidates(user.id);
      
      // Appliquer les filtres
      const filteredCandidates = allCandidates.filter(candidate => {
        // Filtrer par entreprises
        if (filters.companies && filters.companies.length > 0) {
          const candidateCompanies = Array.isArray(candidate.experiences) 
            ? candidate.experiences.map((exp: any) => exp.company?.toLowerCase())
            : [];
          
          if (!filters.companies.some(company => 
            candidateCompanies.some(candidateCompany => 
              candidateCompany?.includes(company.toLowerCase())
            )
          )) {
            return false;
          }
        }
        
        // Filtrer par localisation
        if (filters.locations && filters.locations.length > 0) {
          if (!candidate.location || 
              !filters.locations.some(location => 
                candidate.location?.toLowerCase().includes(location.toLowerCase())
              )) {
            return false;
          }
        }
        
        // Filtrer par écoles
        if (filters.schools && filters.schools.length > 0) {
          const candidateSchools = Array.isArray(candidate.education)
            ? candidate.education.map((edu: any) => edu.school?.toLowerCase())
            : [];
          
          if (!filters.schools.some(school => 
            candidateSchools.some(candidateSchool => 
              candidateSchool?.includes(school.toLowerCase())
            )
          )) {
            return false;
          }
        }
        
        // Filtrer par diplômes
        if (filters.degrees && filters.degrees.length > 0) {
          const candidateDegrees = Array.isArray(candidate.education)
            ? candidate.education.map((edu: any) => edu.degree?.toLowerCase())
            : [];
          
          if (!filters.degrees.some(degree => 
            candidateDegrees.some(candidateDegree => 
              candidateDegree?.includes(degree.toLowerCase())
            )
          )) {
            return false;
          }
        }
        
        // Filtrer par compétences
        if (filters.skills && filters.skills.length > 0) {
          const candidateSkills = Array.isArray(candidate.skills)
            ? candidate.skills.map(skill => typeof skill === 'string' ? skill.toLowerCase() : '')
            : [];
          
          if (!filters.skills.some(skill => 
            candidateSkills.some(candidateSkill => 
              candidateSkill?.includes(skill.toLowerCase())
            )
          )) {
            return false;
          }
        }
        
        // Filtrer par expérience
        if (filters.experienceMin !== undefined && candidate.years_experience !== undefined && 
            candidate.years_experience < filters.experienceMin) {
          return false;
        }
        
        if (filters.experienceMax !== undefined && candidate.years_experience !== undefined && 
            candidate.years_experience > filters.experienceMax) {
          return false;
        }
        
        // Filtrer par secteurs d'activité
        if (filters.industries && filters.industries.length > 0) {
          const candidateIndustries = Array.isArray(candidate.industries)
            ? candidate.industries.map((industry: any) => 
                typeof industry === 'string' ? industry.toLowerCase() : ''
              )
            : [];
          
          if (!filters.industries.some(industry => 
            candidateIndustries.some(candidateIndustry => 
              candidateIndustry?.includes(industry.toLowerCase())
            )
          )) {
            return false;
          }
        }
        
        return true;
      });
      
      console.log(`Filtered candidates: ${filteredCandidates.length} out of ${allCandidates.length}`);
      return filteredCandidates;
    } catch (error: any) {
      console.error("Exception in filterCandidates:", error);
      throw new Error(error.message || "Impossible de filtrer les candidats");
    }
  }
};
