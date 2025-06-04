import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/candidateService';

export interface AIScoringResult {
  education_score: number;
  skills_score: number;
  experience_score: number;
  location_score: number;
  languages_score: number;
  profile_summary_score?: number;
  cv_structure_score?: number;
  cultural_fit_score?: number;
  availability_score?: number;
  interview_bonus?: number;
  total_score: number;
  explanation: string;
}

export interface CachedAIScore {
  score: number;
  explanation: string;
  breakdown: any;
  isJobSpecific: boolean;
  lastCalculated: string;
  dataHash: string;
  source: 'cache' | 'database' | 'fresh_calculation';
}

export class AIScoringService {
  
  /**
   * Calculer le hash des données candidat pour détecter les changements
   */
  private async calculateCandidateHash(candidateId: string, jobOfferId?: string): Promise<string> {
    const { data } = await supabase.rpc('calculate_candidate_data_hash', { 
      p_candidate_id: candidateId 
    });
    const baseHash = data || '';
    return jobOfferId ? `${baseHash}_${jobOfferId}` : baseHash;
  }
  
  /**
   * Récupérer un score AI depuis la base de données si disponible et récent
   */
  private async getCachedAIScore(candidateId: string, jobOfferId?: string): Promise<CachedAIScore | null> {
    try {
      console.log('Checking for cached AI score in database...', { candidateId, jobOfferId });
      
      // Calculer le hash actuel des données
      const currentHash = await this.calculateCandidateHash(candidateId, jobOfferId);
      
      if (jobOfferId) {
        // Score de matching job-spécifique
        const { data: cachedScore, error } = await supabase
          .from('candidate_job_matching_scores')
          .select('*')
          .eq('candidate_id', candidateId)
          .eq('job_offer_id', jobOfferId)
          .eq('data_hash', currentHash)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching cached matching score:', error);
          return null;
        }
        
        if (cachedScore) {
          // Vérifier si le score n'est pas trop ancien (24h)
          const scoreAge = Date.now() - new Date(cachedScore.calculated_at).getTime();
          const maxAge = 24 * 60 * 60 * 1000; // 24 heures
          
          if (scoreAge < maxAge) {
            console.log('Found valid cached matching score from database');
            return {
              score: cachedScore.total_matching_score,
              explanation: 'Score de correspondance calculé précédemment',
              breakdown: {
                education: cachedScore.education_match_score,
                skills: cachedScore.skills_tools_score,
                experience: cachedScore.relevant_experience_score,
                location: cachedScore.location_score,
                languages: cachedScore.languages_match_score,
                culturalFit: cachedScore.cultural_fit_score,
                availability: cachedScore.availability_mobility_score,
                interviewBonus: cachedScore.interview_notes_bonus
              },
              isJobSpecific: true,
              lastCalculated: cachedScore.calculated_at,
              dataHash: cachedScore.data_hash,
              source: 'database'
            };
          }
        }
      } else {
        // Score de complétude général
        const { data: cachedScore, error } = await supabase
          .from('candidate_scores')
          .select('*')
          .eq('candidate_id', candidateId)
          .eq('data_hash', currentHash)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching cached completeness score:', error);
          return null;
        }
        
        if (cachedScore) {
          // Vérifier si le score n'est pas trop ancien (24h)
          const scoreAge = Date.now() - new Date(cachedScore.calculated_at).getTime();
          const maxAge = 24 * 60 * 60 * 1000; // 24 heures
          
          if (scoreAge < maxAge) {
            console.log('Found valid cached completeness score from database');
            return {
              score: cachedScore.general_score,
              explanation: 'Score de complétude calculé précédemment',
              breakdown: {
                education: cachedScore.education_score,
                skills: cachedScore.skills_score,
                experience: cachedScore.experience_score,
                languages: cachedScore.languages_score,
                locationMobility: cachedScore.location_mobility_score,
                profileSummary: cachedScore.profile_summary_score,
                cvStructure: cachedScore.cv_structure_score
              },
              isJobSpecific: false,
              lastCalculated: cachedScore.calculated_at,
              dataHash: cachedScore.data_hash,
              source: 'database'
            };
          }
        }
      }
      
      return null;
    } catch (error: any) {
      console.error('Error checking cached AI score:', error);
      return null;
    }
  }
  
  /**
   * Calculer le score de complétude avec vérification cache
   */
  async calculateCompletenessScore(candidateId: string): Promise<AIScoringResult | null> {
    try {
      console.log('Calculating AI completeness score with cache check for candidate:', candidateId);
      
      // Vérifier d'abord le cache en base de données
      const cachedResult = await this.getCachedAIScore(candidateId);
      if (cachedResult) {
        console.log('Using cached completeness score from database');
        return {
          education_score: cachedResult.breakdown.education || 0,
          skills_score: cachedResult.breakdown.skills || 0,
          experience_score: cachedResult.breakdown.experience || 0,
          location_score: cachedResult.breakdown.locationMobility || 0,
          languages_score: cachedResult.breakdown.languages || 0,
          profile_summary_score: cachedResult.breakdown.profileSummary || 0,
          cv_structure_score: cachedResult.breakdown.cvStructure || 0,
          total_score: cachedResult.score,
          explanation: cachedResult.explanation
        };
      }
      
      console.log('No valid cache found, calculating new AI score via OpenAI...');
      
      const { data, error } = await supabase.functions.invoke('ai-scoring', {
        body: {
          candidateId,
          scoringType: 'completeness'
        }
      });
      
      if (error) {
        console.error('Error calling AI scoring function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'AI scoring failed');
      }
      
      console.log('AI completeness score calculated successfully (fresh calculation)');
      return data.scoringResult;
      
    } catch (error: any) {
      console.error('Error in calculateCompletenessScore:', error);
      return null;
    }
  }
  
  /**
   * Calculer le score de matching avec vérification cache
   */
  async calculateMatchingScore(candidateId: string, jobOfferId: string): Promise<AIScoringResult | null> {
    try {
      console.log('Calculating AI matching score with cache check for candidate:', candidateId, 'and job:', jobOfferId);
      
      // Vérifier d'abord le cache en base de données
      const cachedResult = await this.getCachedAIScore(candidateId, jobOfferId);
      if (cachedResult) {
        console.log('Using cached matching score from database');
        return {
          education_score: cachedResult.breakdown.education || 0,
          skills_score: cachedResult.breakdown.skills || 0,
          experience_score: cachedResult.breakdown.experience || 0,
          location_score: cachedResult.breakdown.location || 0,
          languages_score: cachedResult.breakdown.languages || 0,
          cultural_fit_score: cachedResult.breakdown.culturalFit || 0,
          availability_score: cachedResult.breakdown.availability || 0,
          interview_bonus: cachedResult.breakdown.interviewBonus || 0,
          total_score: cachedResult.score,
          explanation: cachedResult.explanation
        };
      }
      
      console.log('No valid cache found, calculating new AI matching score via OpenAI...');
      
      const { data, error } = await supabase.functions.invoke('ai-scoring', {
        body: {
          candidateId,
          jobOfferId,
          scoringType: 'matching'
        }
      });
      
      if (error) {
        console.error('Error calling AI scoring function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'AI scoring failed');
      }
      
      console.log('AI matching score calculated successfully (fresh calculation)');
      return data.scoringResult;
      
    } catch (error: any) {
      console.error('Error in calculateMatchingScore:', error);
      return null;
    }
  }
  
  /**
   * Obtenir le score avec explication pour l'interface (optimisé avec cache)
   */
  async getScoreWithExplanation(candidateId: string, jobOfferId?: string): Promise<{
    score: number;
    breakdown: any;
    explanation: string;
    isJobSpecific: boolean;
    source?: string;
  } | null> {
    try {
      // Vérifier d'abord le cache
      const cachedResult = await this.getCachedAIScore(candidateId, jobOfferId);
      if (cachedResult) {
        console.log(`Using ${cachedResult.source} score for candidate:`, candidateId);
        return {
          score: cachedResult.score,
          breakdown: cachedResult.breakdown,
          explanation: `${cachedResult.explanation} (Source: ${cachedResult.source === 'database' ? 'Base de données' : 'Cache'})`,
          isJobSpecific: cachedResult.isJobSpecific,
          source: cachedResult.source
        };
      }
      
      // Sinon calculer un nouveau score
      let result: AIScoringResult | null;
      
      if (jobOfferId) {
        result = await this.calculateMatchingScore(candidateId, jobOfferId);
      } else {
        result = await this.calculateCompletenessScore(candidateId);
      }
      
      if (!result) {
        return null;
      }
      
      return {
        score: result.total_score,
        breakdown: {
          education: result.education_score,
          skills: result.skills_score,
          experience: result.experience_score,
          location: result.location_score,
          languages: result.languages_score,
          profileSummary: result.profile_summary_score,
          cvStructure: result.cv_structure_score,
          culturalFit: result.cultural_fit_score,
          availability: result.availability_score,
          interviewBonus: result.interview_bonus
        },
        explanation: `${result.explanation} (Source: Nouveau calcul IA)`,
        isJobSpecific: Boolean(jobOfferId),
        source: 'fresh_calculation'
      };
      
    } catch (error: any) {
      console.error('Error getting score with explanation:', error);
      return null;
    }
  }
  
  /**
   * Forcer le recalcul (ignorer le cache)
   */
  async forceRecalculate(candidateId: string, jobOfferId?: string): Promise<{
    score: number;
    breakdown: any;
    explanation: string;
    isJobSpecific: boolean;
  } | null> {
    try {
      console.log('Force recalculating AI score (bypassing cache)...');
      
      let result: AIScoringResult | null;
      
      if (jobOfferId) {
        result = await this.calculateMatchingScore(candidateId, jobOfferId);
      } else {
        result = await this.calculateCompletenessScore(candidateId);
      }
      
      if (!result) {
        return null;
      }
      
      return {
        score: result.total_score,
        breakdown: {
          education: result.education_score,
          skills: result.skills_score,
          experience: result.experience_score,
          location: result.location_score,
          languages: result.languages_score,
          profileSummary: result.profile_summary_score,
          cvStructure: result.cv_structure_score,
          culturalFit: result.cultural_fit_score,
          availability: result.availability_score,
          interviewBonus: result.interview_bonus
        },
        explanation: `${result.explanation} (Source: Nouveau calcul forcé)`,
        isJobSpecific: Boolean(jobOfferId)
      };
      
    } catch (error: any) {
      console.error('Error in forceRecalculate:', error);
      return null;
    }
  }
}

export const aiScoringService = new AIScoringService();
