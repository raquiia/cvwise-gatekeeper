
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/candidateService';
import { toast } from '@/hooks/use-toast';

export interface ScoringBreakdown {
  // Scores de complétude (mode général)
  education_score: number;
  experience_score: number;
  skills_score: number;
  languages_score: number;
  location_mobility_score: number;
  profile_summary_score: number;
  cv_structure_score: number;
  general_score: number;
  
  // Scores de matching (mode job-spécifique)
  education_match_score?: number;
  skills_tools_score?: number;
  relevant_experience_score?: number;
  location_score?: number;
  languages_match_score?: number;
  cultural_fit_score?: number;
  availability_mobility_score?: number;
  interview_notes_bonus?: number;
  total_matching_score?: number;
  
  // Métadonnées
  calculated_at: string;
  is_job_specific: boolean;
  job_offer_id?: string;
}

// Helper function pour extraire les scores du breakdown AI de manière sûre
const safeGetBreakdownScore = (breakdown: any, key: string, defaultValue: number = 0): number => {
  if (!breakdown || typeof breakdown !== 'object' || Array.isArray(breakdown)) {
    return defaultValue;
  }
  
  const value = breakdown[key];
  if (typeof value === 'number') {
    return value;
  }
  
  return defaultValue;
};

export class OptimizedScoringService {
  
  /**
   * Récupérer le score de complétude d'un candidat depuis la table candidates
   */
  async getCompletenessScore(candidateId: string): Promise<ScoringBreakdown | null> {
    try {
      console.log('Getting completeness score for candidate from candidates table:', candidateId);
      
      // Récupérer les données AI directement depuis la table candidates
      const { data: candidate, error } = await supabase
        .from('candidates')
        .select('ai_score, ai_breakdown, ai_analyzed_at')
        .eq('id', candidateId)
        .single();
      
      if (error) {
        console.error('Error fetching candidate AI data:', error);
        return null;
      }
      
      // Si pas de données AI, calculer un nouveau score
      if (!candidate || candidate.ai_score === null) {
        console.log('No AI data found, calculating new completeness score');
        return await this.calculateCompletenessScore(candidateId);
      }
      
      // Extraire les scores depuis le breakdown AI de manière sûre
      return {
        education_score: safeGetBreakdownScore(candidate.ai_breakdown, 'education'),
        experience_score: safeGetBreakdownScore(candidate.ai_breakdown, 'experience'),
        skills_score: safeGetBreakdownScore(candidate.ai_breakdown, 'skills'),
        languages_score: safeGetBreakdownScore(candidate.ai_breakdown, 'languages'),
        location_mobility_score: safeGetBreakdownScore(candidate.ai_breakdown, 'location'),
        profile_summary_score: safeGetBreakdownScore(candidate.ai_breakdown, 'profileSummary'),
        cv_structure_score: safeGetBreakdownScore(candidate.ai_breakdown, 'cvStructure'),
        general_score: candidate.ai_score,
        calculated_at: candidate.ai_analyzed_at || new Date().toISOString(),
        is_job_specific: false
      };
      
    } catch (error: any) {
      console.error('Error in getCompletenessScore:', error);
      return null;
    }
  }
  
  /**
   * Calculer et stocker le score de complétude via la fonction SQL
   */
  async calculateCompletenessScore(candidateId: string): Promise<ScoringBreakdown | null> {
    try {
      console.log('Calculating completeness score for candidate:', candidateId);
      
      // Utiliser la fonction SQL existante pour calculer le score
      const { data, error } = await supabase.rpc('calculate_and_store_completeness_score', {
        p_candidate_id: candidateId
      });
      
      if (error) {
        console.error('Error calculating completeness score:', error);
        throw error;
      }
      
      console.log('Completeness score calculated:', data);
      
      // Récupérer les données AI mises à jour
      const { data: candidate, error: fetchError } = await supabase
        .from('candidates')
        .select('ai_score, ai_breakdown, ai_analyzed_at')
        .eq('id', candidateId)
        .single();
      
      if (fetchError || !candidate) {
        console.error('Error fetching updated candidate data:', fetchError);
        // Retourner un score basique basé sur le résultat de la fonction
        return {
          education_score: 0,
          experience_score: 0,
          skills_score: 0,
          languages_score: 0,
          location_mobility_score: 0,
          profile_summary_score: 0,
          cv_structure_score: 0,
          general_score: data || 50,
          calculated_at: new Date().toISOString(),
          is_job_specific: false
        };
      }
      
      return {
        education_score: safeGetBreakdownScore(candidate.ai_breakdown, 'education'),
        experience_score: safeGetBreakdownScore(candidate.ai_breakdown, 'experience'),
        skills_score: safeGetBreakdownScore(candidate.ai_breakdown, 'skills'),
        languages_score: safeGetBreakdownScore(candidate.ai_breakdown, 'languages'),
        location_mobility_score: safeGetBreakdownScore(candidate.ai_breakdown, 'location'),
        profile_summary_score: safeGetBreakdownScore(candidate.ai_breakdown, 'profileSummary'),
        cv_structure_score: safeGetBreakdownScore(candidate.ai_breakdown, 'cvStructure'),
        general_score: candidate.ai_score || data || 50,
        calculated_at: candidate.ai_analyzed_at || new Date().toISOString(),
        is_job_specific: false
      };
      
    } catch (error: any) {
      console.error('Error in calculateCompletenessScore:', error);
      toast({
        title: "Erreur de calcul",
        description: "Impossible de calculer le score de complétude",
        variant: "destructive",
      });
      return null;
    }
  }
  
  /**
   * Calculer le score de matching avec une offre d'emploi
   * Pour l'instant, utilise les données générales du candidat
   */
  async calculateMatchingScore(candidateId: string, jobOfferId: string): Promise<ScoringBreakdown | null> {
    try {
      console.log('Calculating matching score for candidate:', candidateId, 'and job:', jobOfferId);
      
      // Pour l'instant, récupérer le score général et l'adapter pour le matching
      const generalScore = await this.getCompletenessScore(candidateId);
      
      if (!generalScore) {
        return null;
      }
      
      // Adapter les scores généraux pour le matching
      return {
        // Scores de base pour compatibilité
        education_score: generalScore.education_score,
        experience_score: generalScore.experience_score,
        skills_score: generalScore.skills_score,
        languages_score: generalScore.languages_score,
        location_mobility_score: generalScore.location_mobility_score,
        profile_summary_score: generalScore.profile_summary_score,
        cv_structure_score: generalScore.cv_structure_score,
        general_score: generalScore.general_score,
        
        // Scores de matching (adaptés)
        education_match_score: generalScore.education_score,
        skills_tools_score: generalScore.skills_score,
        relevant_experience_score: generalScore.experience_score,
        location_score: generalScore.location_mobility_score,
        languages_match_score: generalScore.languages_score,
        cultural_fit_score: 50, // Valeur par défaut
        availability_mobility_score: generalScore.location_mobility_score,
        interview_notes_bonus: 0,
        total_matching_score: generalScore.general_score,
        
        calculated_at: generalScore.calculated_at,
        is_job_specific: true,
        job_offer_id: jobOfferId
      };
      
    } catch (error: any) {
      console.error('Error in calculateMatchingScore:', error);
      return null;
    }
  }
  
  /**
   * Forcer le recalcul d'un score (supprimer les données AI existantes)
   */
  async forceRecalculate(candidateId: string, jobOfferId?: string): Promise<ScoringBreakdown | null> {
    try {
      console.log('Force recalculating score for candidate:', candidateId);
      
      // Supprimer les données AI existantes dans candidates
      await supabase
        .from('candidates')
        .update({
          ai_score: null,
          ai_explanation: null,
          ai_breakdown: null,
          ai_strengths: null,
          ai_weaknesses: null,
          ai_recommendations: null,
          ai_analyzed_at: null
        })
        .eq('id', candidateId);
      
      // Recalculer le score
      if (jobOfferId) {
        return await this.calculateMatchingScore(candidateId, jobOfferId);
      } else {
        return await this.calculateCompletenessScore(candidateId);
      }
      
    } catch (error: any) {
      console.error('Error in forceRecalculate:', error);
      return null;
    }
  }
  
  /**
   * Invalider tous les scores d'un candidat
   */
  async invalidateAllScores(candidateId: string): Promise<void> {
    try {
      // Supprimer les données AI pour ce candidat
      await supabase
        .from('candidates')
        .update({
          ai_score: null,
          ai_explanation: null,
          ai_breakdown: null,
          ai_strengths: null,
          ai_weaknesses: null,
          ai_recommendations: null,
          ai_analyzed_at: null
        })
        .eq('id', candidateId);
      
      console.log('All AI scores invalidated for candidate:', candidateId);
    } catch (error: any) {
      console.error('Error invalidating scores:', error);
    }
  }
}

export const optimizedScoringService = new OptimizedScoringService();
