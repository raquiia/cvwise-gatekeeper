
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

export class OptimizedScoringService {
  
  /**
   * Récupérer le score de complétude d'un candidat (avec cache intelligent)
   */
  async getCompletenessScore(candidateId: string): Promise<ScoringBreakdown | null> {
    try {
      console.log('Getting completeness score for candidate:', candidateId);
      
      // Essayer de récupérer le score existant dans le cache
      const { data: cachedScore, error: cacheError } = await supabase
        .from('candidate_scores')
        .select('*')
        .eq('candidate_id', candidateId)
        .single();
      
      if (cacheError && cacheError.code !== 'PGRST116') {
        console.error('Error fetching cached score:', cacheError);
      }
      
      // Si le score existe dans le cache, le retourner
      if (cachedScore) {
        console.log('Found cached completeness score:', cachedScore);
        return {
          education_score: cachedScore.education_score,
          experience_score: cachedScore.experience_score,
          skills_score: cachedScore.skills_score,
          languages_score: cachedScore.languages_score,
          location_mobility_score: cachedScore.location_mobility_score,
          profile_summary_score: cachedScore.profile_summary_score,
          cv_structure_score: cachedScore.cv_structure_score,
          general_score: cachedScore.general_score,
          calculated_at: cachedScore.calculated_at,
          is_job_specific: false
        };
      }
      
      // Si pas de cache, calculer le score
      console.log('No cached score found, calculating new completeness score');
      return await this.calculateCompletenessScore(candidateId);
      
    } catch (error: any) {
      console.error('Error in getCompletenessScore:', error);
      return null;
    }
  }
  
  /**
   * Calculer et stocker le score de complétude
   */
  async calculateCompletenessScore(candidateId: string): Promise<ScoringBreakdown | null> {
    try {
      console.log('Calculating completeness score for candidate:', candidateId);
      
      // Appeler la fonction SQL qui calcule et stocke le score
      const { data, error } = await supabase.rpc('calculate_and_store_completeness_score', {
        p_candidate_id: candidateId
      });
      
      if (error) {
        console.error('Error calculating completeness score:', error);
        throw error;
      }
      
      console.log('Completeness score calculated:', data);
      
      // Récupérer le score détaillé qui vient d'être calculé
      const { data: scoreDetails, error: detailsError } = await supabase
        .from('candidate_scores')
        .select('*')
        .eq('candidate_id', candidateId)
        .single();
      
      if (detailsError) {
        console.error('Error fetching score details:', detailsError);
        throw detailsError;
      }
      
      return {
        education_score: scoreDetails.education_score,
        experience_score: scoreDetails.experience_score,
        skills_score: scoreDetails.skills_score,
        languages_score: scoreDetails.languages_score,
        location_mobility_score: scoreDetails.location_mobility_score,
        profile_summary_score: scoreDetails.profile_summary_score,
        cv_structure_score: scoreDetails.cv_structure_score,
        general_score: scoreDetails.general_score,
        calculated_at: scoreDetails.calculated_at,
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
   */
  async calculateMatchingScore(candidateId: string, jobOfferId: string): Promise<ScoringBreakdown | null> {
    try {
      console.log('Calculating matching score for candidate:', candidateId, 'and job:', jobOfferId);
      
      // Vérifier si le score existe déjà dans le cache
      const { data: cachedScore, error: cacheError } = await supabase
        .from('candidate_job_matching_scores')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('job_offer_id', jobOfferId)
        .single();
      
      if (cacheError && cacheError.code !== 'PGRST116') {
        console.error('Error fetching cached matching score:', cacheError);
      }
      
      // Si le score existe et est récent (moins de 1 heure), le retourner
      if (cachedScore) {
        const scoreAge = Date.now() - new Date(cachedScore.calculated_at).getTime();
        const oneHour = 60 * 60 * 1000;
        
        if (scoreAge < oneHour) {
          console.log('Found recent cached matching score:', cachedScore);
          return {
            education_match_score: cachedScore.education_match_score,
            skills_tools_score: cachedScore.skills_tools_score,
            relevant_experience_score: cachedScore.relevant_experience_score,
            location_score: cachedScore.location_score,
            languages_match_score: cachedScore.languages_match_score,
            cultural_fit_score: cachedScore.cultural_fit_score,
            availability_mobility_score: cachedScore.availability_mobility_score,
            interview_notes_bonus: cachedScore.interview_notes_bonus,
            total_matching_score: cachedScore.total_matching_score,
            calculated_at: cachedScore.calculated_at,
            is_job_specific: true,
            job_offer_id: jobOfferId,
            // Scores de base (pour compatibilité)
            education_score: 0,
            experience_score: 0,
            skills_score: 0,
            languages_score: 0,
            location_mobility_score: 0,
            profile_summary_score: 0,
            cv_structure_score: 0,
            general_score: cachedScore.total_matching_score
          };
        }
      }
      
      // Calculer un nouveau score de matching
      console.log('Calculating new matching score');
      return await this.performMatchingCalculation(candidateId, jobOfferId);
      
    } catch (error: any) {
      console.error('Error in calculateMatchingScore:', error);
      return null;
    }
  }
  
  /**
   * Effectuer le calcul de matching (logique métier simplifiée pour l'instant)
   */
  private async performMatchingCalculation(candidateId: string, jobOfferId: string): Promise<ScoringBreakdown | null> {
    try {
      // Récupérer les données du candidat
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
      
      if (candidateError) {
        throw candidateError;
      }
      
      // Récupérer les données de l'offre d'emploi
      const { data: jobOffer, error: jobError } = await supabase
        .from('job_offers')
        .select('*')
        .eq('id', jobOfferId)
        .single();
      
      if (jobError) {
        throw jobError;
      }
      
      // Récupérer les notes d'entretien
      const { data: notes, error: notesError } = await supabase
        .from('candidate_notes')
        .select('*')
        .eq('candidate_id', candidateId);
      
      if (notesError) {
        console.warn('Error fetching interview notes:', notesError);
      }
      
      // Calculer les scores selon vos critères
      const scores = this.calculateMatchingScores(candidate, jobOffer, notes || []);
      
      // Stocker le résultat dans la base de données
      const { error: insertError } = await supabase
        .from('candidate_job_matching_scores')
        .upsert({
          candidate_id: candidateId,
          job_offer_id: jobOfferId,
          user_id: candidate.user_id,
          education_match_score: scores.education_match_score,
          skills_tools_score: scores.skills_tools_score,
          relevant_experience_score: scores.relevant_experience_score,
          location_score: scores.location_score,
          languages_match_score: scores.languages_match_score,
          cultural_fit_score: scores.cultural_fit_score,
          availability_mobility_score: scores.availability_mobility_score,
          interview_notes_bonus: scores.interview_notes_bonus,
          total_matching_score: scores.total_matching_score,
          data_hash: `${candidateId}-${jobOfferId}-${Date.now()}`,
          calculated_at: new Date().toISOString(),
          last_candidate_update: candidate.updated_at,
          last_job_update: jobOffer.updated_at,
          last_notes_update: notes && notes.length > 0 ? 
            Math.max(...notes.map(n => new Date(n.updated_at).getTime())) : null
        });
      
      if (insertError) {
        console.error('Error storing matching score:', insertError);
      }
      
      return {
        ...scores,
        calculated_at: new Date().toISOString(),
        is_job_specific: true,
        job_offer_id: jobOfferId,
        // Scores de base pour compatibilité
        education_score: 0,
        experience_score: 0,
        skills_score: 0,
        languages_score: 0,
        location_mobility_score: 0,
        profile_summary_score: 0,
        cv_structure_score: 0,
        general_score: scores.total_matching_score
      };
      
    } catch (error: any) {
      console.error('Error in performMatchingCalculation:', error);
      toast({
        title: "Erreur de calcul",
        description: "Impossible de calculer le score de matching",
        variant: "destructive",
      });
      return null;
    }
  }
  
  /**
   * Calculer les scores de matching selon vos critères exacts
   */
  private calculateMatchingScores(candidate: any, jobOffer: any, notes: any[]): {
    education_match_score: number,
    skills_tools_score: number,
    relevant_experience_score: number,
    location_score: number,
    languages_match_score: number,
    cultural_fit_score: number,
    availability_mobility_score: number,
    interview_notes_bonus: number,
    total_matching_score: number
  } {
    let scores = {
      education_match_score: 0,     // 20 points max
      skills_tools_score: 0,        // 25 points max
      relevant_experience_score: 0, // 20 points max
      location_score: 0,            // 10 points max
      languages_match_score: 0,     // 5 points max
      cultural_fit_score: 0,        // 10 points max
      availability_mobility_score: 0, // 5 points max
      interview_notes_bonus: 0,     // 5 points bonus/malus
      total_matching_score: 0
    };
    
    // 1. Niveau d'études (20 points)
    if (candidate.education && Array.isArray(candidate.education) && candidate.education.length > 0) {
      // Logique simplifiée - à affiner selon les critères métier
      scores.education_match_score = 20;
    } else if (jobOffer.education_level) {
      scores.education_match_score = 10; // Partiel si pas d'info précise
    }
    
    // 2. Compétences/Outils requis (25 points)
    if (candidate.skills && jobOffer.required_skills) {
      const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
      const requiredSkills = Array.isArray(jobOffer.required_skills) ? jobOffer.required_skills : [];
      
      if (requiredSkills.length > 0) {
        const matchingSkills = candidateSkills.filter(skill => 
          requiredSkills.some(req => 
            skill.toLowerCase().includes(req.toLowerCase()) || 
            req.toLowerCase().includes(skill.toLowerCase())
          )
        );
        
        const matchRatio = matchingSkills.length / requiredSkills.length;
        scores.skills_tools_score = Math.round(matchRatio * 25);
      } else {
        scores.skills_tools_score = candidateSkills.length > 0 ? 15 : 0;
      }
    }
    
    // 3. Expérience professionnelle pertinente (20 points)
    if (candidate.years_experience && jobOffer.experience_years_min) {
      if (candidate.years_experience >= jobOffer.experience_years_min) {
        if (!jobOffer.experience_years_max || candidate.years_experience <= jobOffer.experience_years_max) {
          scores.relevant_experience_score = 20;
        } else {
          scores.relevant_experience_score = 15; // Surqualifié
        }
      } else if (candidate.years_experience > 0) {
        scores.relevant_experience_score = 10; // Sous-qualifié mais expérience
      }
    } else if (candidate.experiences && Array.isArray(candidate.experiences) && candidate.experiences.length > 0) {
      scores.relevant_experience_score = 10; // Expérience mentionnée mais pas quantifiée
    }
    
    // 4. Localisation (10 points)
    if (candidate.location && jobOffer.location) {
      // Logique simplifiée - même ville/région = 10 points
      if (candidate.location.toLowerCase().includes(jobOffer.location.toLowerCase()) ||
          jobOffer.location.toLowerCase().includes(candidate.location.toLowerCase())) {
        scores.location_score = 10;
      } else if (candidate.mobility === 'high' || candidate.remote_preference === 'full') {
        scores.location_score = 8; // Mobile ou télétravail
      } else {
        scores.location_score = 3; // Localisation différente
      }
    }
    
    // 5. Langues (5 points)
    if (candidate.languages && jobOffer.required_languages) {
      const candidateLanguages = Array.isArray(candidate.languages) ? candidate.languages : [];
      const requiredLanguages = Array.isArray(jobOffer.required_languages) ? jobOffer.required_languages : [];
      
      if (requiredLanguages.length > 0) {
        const hasAllRequired = requiredLanguages.every(reqLang => 
          candidateLanguages.some(candLang => 
            (typeof candLang === 'string' ? candLang : candLang.language || '')
              .toLowerCase().includes(reqLang.toLowerCase())
          )
        );
        scores.languages_match_score = hasAllRequired ? 5 : 0;
      } else {
        scores.languages_match_score = candidateLanguages.length > 0 ? 3 : 0;
      }
    }
    
    // 6. Adéquation culturelle/soft skills (10 points) - basé sur les notes d'entretien
    if (notes && notes.length > 0) {
      // Analyser les notes d'entretien (logique simplifiée)
      const positiveKeywords = ['excellent', 'très bien', 'parfait', 'idéal', 'motivé', 'compétent'];
      const negativeKeywords = ['problème', 'difficulté', 'inadéquat', 'insuffisant'];
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      notes.forEach(note => {
        const content = (note.content + ' ' + (note.enhanced_content || '')).toLowerCase();
        positiveCount += positiveKeywords.filter(keyword => content.includes(keyword)).length;
        negativeCount += negativeKeywords.filter(keyword => content.includes(keyword)).length;
      });
      
      if (positiveCount > negativeCount) {
        scores.cultural_fit_score = Math.min(10, positiveCount * 2);
      } else if (negativeCount > positiveCount) {
        scores.cultural_fit_score = Math.max(0, 5 - negativeCount);
      } else {
        scores.cultural_fit_score = 5; // Neutre
      }
    }
    
    // 7. Disponibilité et mobilité (5 points)
    let availabilityScore = 0;
    if (candidate.availability) {
      if (candidate.availability.includes('immédiat') || candidate.availability.includes('disponible')) {
        availabilityScore += 3;
      } else {
        availabilityScore += 1;
      }
    }
    if (candidate.mobility === 'high' || candidate.travel_willingness === 'high') {
      availabilityScore += 2;
    }
    scores.availability_mobility_score = Math.min(5, availabilityScore);
    
    // 8. Notes d'entretien (bonus/malus) (5 points)
    if (notes && notes.length > 0) {
      // Bonus si entretien confirme l'adéquation, malus si incohérences
      const totalNotes = notes.length;
      if (scores.cultural_fit_score >= 8) {
        scores.interview_notes_bonus = 5; // Excellent entretien
      } else if (scores.cultural_fit_score >= 5) {
        scores.interview_notes_bonus = 2; // Bon entretien
      } else if (scores.cultural_fit_score < 3) {
        scores.interview_notes_bonus = -3; // Entretien décevant
      }
    }
    
    // Calculer le score total
    scores.total_matching_score = Math.min(100, Math.max(0,
      scores.education_match_score +
      scores.skills_tools_score +
      scores.relevant_experience_score +
      scores.location_score +
      scores.languages_match_score +
      scores.cultural_fit_score +
      scores.availability_mobility_score +
      scores.interview_notes_bonus
    ));
    
    return scores;
  }
  
  /**
   * Forcer le recalcul d'un score (bypasser le cache)
   */
  async forceRecalculate(candidateId: string, jobOfferId?: string): Promise<ScoringBreakdown | null> {
    try {
      if (jobOfferId) {
        // Supprimer le cache de matching
        await supabase
          .from('candidate_job_matching_scores')
          .delete()
          .eq('candidate_id', candidateId)
          .eq('job_offer_id', jobOfferId);
        
        return await this.calculateMatchingScore(candidateId, jobOfferId);
      } else {
        // Supprimer le cache de complétude
        await supabase
          .from('candidate_scores')
          .delete()
          .eq('candidate_id', candidateId);
        
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
      // Supprimer tous les caches pour ce candidat
      await Promise.all([
        supabase
          .from('candidate_scores')
          .delete()
          .eq('candidate_id', candidateId),
        supabase
          .from('candidate_job_matching_scores')
          .delete()
          .eq('candidate_id', candidateId)
      ]);
      
      console.log('All scores invalidated for candidate:', candidateId);
    } catch (error: any) {
      console.error('Error invalidating scores:', error);
    }
  }
}

export const optimizedScoringService = new OptimizedScoringService();
