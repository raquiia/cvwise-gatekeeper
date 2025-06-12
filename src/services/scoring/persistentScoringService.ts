
import { optimizedScoringService } from './optimizedScoringService';
import { CandidateData } from '@/services/data/candidateService';

/**
 * Service pour gérer la persistance et la synchronisation des scores - SIMPLIFIÉ
 * Ce service fait le pont entre l'ancien système et le nouveau système utilisant la table candidates
 */
export class PersistentScoringService {
  
  /**
   * Calculer et persister le score d'un candidat
   */
  async calculateAndPersistScore(candidate: CandidateData, jobOfferId?: string): Promise<number> {
    if (!candidate.id) {
      throw new Error('Candidate ID is required');
    }
    
    try {
      let scoreBreakdown;
      
      if (jobOfferId) {
        // Calcul de matching avec offre d'emploi
        scoreBreakdown = await optimizedScoringService.calculateMatchingScore(candidate.id, jobOfferId);
      } else {
        // Calcul de complétude du profil
        scoreBreakdown = await optimizedScoringService.getCompletenessScore(candidate.id);
      }
      
      if (!scoreBreakdown) {
        throw new Error('Failed to calculate score');
      }
      
      // Retourner le score principal
      return scoreBreakdown.is_job_specific ? 
        scoreBreakdown.total_matching_score! : 
        scoreBreakdown.general_score;
        
    } catch (error: any) {
      console.error('Error in calculateAndPersistScore:', error);
      throw error;
    }
  }
  
  /**
   * Recalculer les scores de tous les candidats d'un utilisateur
   */
  async recalculateAllUserScores(userCandidates: CandidateData[]): Promise<void> {
    console.log(`Recalculating scores for ${userCandidates.length} candidates`);
    
    const promises = userCandidates.map(async (candidate) => {
      if (candidate.id) {
        try {
          await optimizedScoringService.calculateCompletenessScore(candidate.id);
        } catch (error) {
          console.error(`Error recalculating score for candidate ${candidate.id}:`, error);
        }
      }
    });
    
    await Promise.allSettled(promises);
    console.log('Finished recalculating all user scores');
  }
  
  /**
   * Invalider et recalculer le score d'un candidat spécifique
   */
  async forceRecalculateCandidate(candidateId: string, jobOfferId?: string): Promise<number> {
    try {
      const scoreBreakdown = await optimizedScoringService.forceRecalculate(candidateId, jobOfferId);
      
      if (!scoreBreakdown) {
        throw new Error('Failed to recalculate score');
      }
      
      return scoreBreakdown.is_job_specific ? 
        scoreBreakdown.total_matching_score! : 
        scoreBreakdown.general_score;
        
    } catch (error: any) {
      console.error('Error in forceRecalculateCandidate:', error);
      throw error;
    }
  }
  
  /**
   * Recalculer le score général d'un candidat
   */
  async recalculateGeneralScore(candidateId: string): Promise<number | null> {
    try {
      const scoreBreakdown = await optimizedScoringService.forceRecalculate(candidateId);
      return scoreBreakdown ? scoreBreakdown.general_score : null;
    } catch (error: any) {
      console.error('Error recalculating general score:', error);
      return null;
    }
  }
  
  /**
   * Calculer et stocker le score de matching avec une offre
   */
  async calculateAndStoreJobScore(candidateId: string, jobOfferId: string): Promise<number | null> {
    try {
      const scoreBreakdown = await optimizedScoringService.calculateMatchingScore(candidateId, jobOfferId);
      return scoreBreakdown ? scoreBreakdown.total_matching_score! : null;
    } catch (error: any) {
      console.error('Error calculating job score:', error);
      return null;
    }
  }
  
  /**
   * Obtenir le score général d'un candidat
   */
  async getCandidateGeneralScore(candidateId: string): Promise<any> {
    try {
      const scoreBreakdown = await optimizedScoringService.getCompletenessScore(candidateId);
      if (!scoreBreakdown) return null;
      
      return {
        skills: scoreBreakdown.skills_score,
        experience: scoreBreakdown.experience_score,
        education: scoreBreakdown.education_score,
        profileCompleteness: scoreBreakdown.cv_structure_score,
        overall: scoreBreakdown.general_score,
        details: {
          skillsCount: 0,
          experienceYears: 0,
          educationLevel: 'Non spécifié',
          completenessPercentage: scoreBreakdown.general_score
        }
      };
    } catch (error) {
      console.error('Error getting general score:', error);
      return null;
    }
  }
  
  /**
   * Obtenir le score de matching avec une offre
   */
  async getCandidateJobScore(candidateId: string, jobOfferId: string): Promise<any> {
    try {
      const scoreBreakdown = await optimizedScoringService.calculateMatchingScore(candidateId, jobOfferId);
      if (!scoreBreakdown) return null;
      
      return {
        skills: scoreBreakdown.skills_tools_score!,
        experience: scoreBreakdown.relevant_experience_score!,
        education: scoreBreakdown.education_match_score!,
        profileCompleteness: 50,
        overall: scoreBreakdown.total_matching_score!,
        matchContext: `Score de correspondance`,
        details: {
          skillsCount: 0,
          experienceYears: 0,
          educationLevel: 'Non spécifié',
          completenessPercentage: scoreBreakdown.total_matching_score!
        }
      };
    } catch (error) {
      console.error('Error getting job score:', error);
      return null;
    }
  }
  
  /**
   * Calculer les scores de tous les candidats pour une offre d'emploi
   */
  async calculateAllCandidatesJobScores(jobOfferId: string): Promise<void> {
    // Cette méthode sera implémentée plus tard si nécessaire
    console.log('calculateAllCandidatesJobScores not yet implemented for jobOfferId:', jobOfferId);
  }
  
  /**
   * Migrer les scores existants vers le nouveau système (si nécessaire)
   */
  async migrateExistingScores(candidates: CandidateData[]): Promise<void> {
    console.log('Starting score migration for existing candidates');
    
    for (const candidate of candidates) {
      if (candidate.id && candidate.score) {
        try {
          // Vérifier si le score existe déjà dans le nouveau système
          const existingScore = await optimizedScoringService.getCompletenessScore(candidate.id);
          
          if (!existingScore) {
            // Calculer le score avec le nouveau système
            await optimizedScoringService.calculateCompletenessScore(candidate.id);
            console.log(`Migrated score for candidate ${candidate.id}`);
          }
        } catch (error) {
          console.error(`Error migrating score for candidate ${candidate.id}:`, error);
        }
      }
    }
    
    console.log('Score migration completed');
  }
}

export const persistentScoringService = new PersistentScoringService();
