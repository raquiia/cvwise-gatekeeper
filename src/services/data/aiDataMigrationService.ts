
import { supabase } from '@/integrations/supabase/client';
import { candidateService } from './candidateService';

/**
 * Service pour migrer les données AI de ai_candidate_scores vers candidates
 */
export class AIDataMigrationService {
  
  /**
   * Migrer les données AI d'un candidat spécifique
   */
  async migrateCandidateAIData(candidateId: string): Promise<boolean> {
    try {
      console.log('🔄 Migrating AI data for candidate:', candidateId);
      
      // Récupérer les données AI depuis ai_candidate_scores
      const { data: aiScores, error: aiError } = await supabase.rpc('get_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_job_offer_id: null // Score général, pas spécifique à un job
      });

      if (aiError) {
        console.error('❌ Error fetching AI scores:', aiError);
        return false;
      }

      if (!aiScores || aiScores.length === 0) {
        console.log('📭 No AI scores found for candidate:', candidateId);
        return false;
      }

      const aiScore = aiScores[0];
      console.log('📊 Found AI score data to migrate:', {
        score: aiScore.score,
        hasExplanation: !!aiScore.explanation,
        strengthsCount: Array.isArray(aiScore.strengths) ? aiScore.strengths.length : 0,
        weaknessesCount: Array.isArray(aiScore.weaknesses) ? aiScore.weaknesses.length : 0,
        recommendationsCount: Array.isArray(aiScore.recommendations) ? aiScore.recommendations.length : 0
      });

      // Récupérer les données actuelles du candidat
      const currentCandidate = await candidateService.getCandidateById(candidateId);
      if (!currentCandidate) {
        console.error('❌ Candidate not found:', candidateId);
        return false;
      }

      // S'assurer que l'id est défini
      if (!currentCandidate.id) {
        console.error('❌ Candidate id is missing:', candidateId);
        return false;
      }

      // Mettre à jour le candidat avec les données AI
      const updatedCandidate = await candidateService.updateCandidate({
        ...currentCandidate,
        id: currentCandidate.id, // S'assurer que l'id est présent
        ai_score: aiScore.score,
        ai_explanation: aiScore.explanation,
        ai_breakdown: aiScore.breakdown,
        ai_strengths: aiScore.strengths,
        ai_weaknesses: aiScore.weaknesses,
        ai_recommendations: aiScore.recommendations,
        ai_analyzed_at: aiScore.calculated_at
      });

      console.log('✅ Successfully migrated AI data to candidate table:', {
        candidateId,
        ai_score: updatedCandidate.ai_score,
        ai_analyzed_at: updatedCandidate.ai_analyzed_at
      });

      return true;

    } catch (error: any) {
      console.error('❌ Error migrating AI data:', error);
      return false;
    }
  }

  /**
   * Vérifier et migrer automatiquement les données AI manquantes
   */
  async checkAndMigrateIfNeeded(candidateId: string): Promise<void> {
    try {
      // Récupérer le candidat actuel
      const candidate = await candidateService.getCandidateById(candidateId);
      if (!candidate) return;

      // Si le candidat n'a pas de données AI, essayer de les migrer
      if (!candidate.ai_score && !candidate.ai_explanation) {
        console.log('🔍 Candidate has no AI data, checking for migration...');
        await this.migrateCandidateAIData(candidateId);
      } else {
        console.log('✅ Candidate already has AI data:', {
          ai_score: candidate.ai_score,
          ai_analyzed_at: candidate.ai_analyzed_at
        });
      }
    } catch (error: any) {
      console.error('❌ Error in checkAndMigrateIfNeeded:', error);
    }
  }
}

export const aiDataMigrationService = new AIDataMigrationService();
