
import { candidateService } from '../candidateService';
import { jobOfferService } from '../job-offers/jobOfferService';
import { localAlgorithmicScoringService } from '@/services/scoring/localAlgorithmicScoringService';
import type { CandidateData } from '../candidateService';
import type { JobOffer } from '../job-offers/types';

interface LocalMatchResult {
  candidateId: string;
  firstName: string;
  lastName: string;
  position: string;
  company: string;
  score: number;
  details: {
    skills: number;
    experience: number;
    location: number;
    roleMatch: number;
    pmoBonus: number;
  };
  explanation: string;
  isPMOCandidate: boolean;
}

/**
 * Service de matching local instantané sans IA
 */
class LocalMatchingService {
  
  /**
   * Calcule les correspondances pour une offre d'emploi
   */
  async calculateMatchesForJobOffer(jobOfferId: string): Promise<LocalMatchResult[]> {
    console.log(`[Local Matching] 🚀 Starting instant matching for job: ${jobOfferId}`);
    
    try {
      // Récupérer l'offre d'emploi
      const jobOffer = await jobOfferService.getJobOfferById(jobOfferId);
      if (!jobOffer) {
        throw new Error('Job offer not found');
      }
      
      console.log(`[Local Matching] 📋 Job: "${jobOffer.title}"`);
      
      // Récupérer tous les candidats de l'utilisateur
      const candidates = await candidateService.getUserCandidates();
      console.log(`[Local Matching] 👥 Processing ${candidates.length} candidates`);
      
      const results: LocalMatchResult[] = [];
      
      // Calculer les scores pour chaque candidat
      for (const candidate of candidates) {
        const scoringResult = localAlgorithmicScoringService.calculateScore(candidate, jobOffer);
        
        results.push({
          candidateId: candidate.id!,
          firstName: candidate.first_name || '',
          lastName: candidate.last_name || '',
          position: candidate.position || '',
          company: candidate.company || '',
          score: scoringResult.score,
          details: scoringResult.breakdown,
          explanation: scoringResult.explanation,
          isPMOCandidate: scoringResult.isPMOCandidate
        });
      }
      
      // Filtrer et trier les résultats
      const filteredResults = localAlgorithmicScoringService.filterCandidates(
        results.map(r => ({ 
          candidate: candidates.find(c => c.id === r.candidateId)!, 
          score: { score: r.score, breakdown: r.details, explanation: r.explanation, isPMOCandidate: r.isPMOCandidate, isPMOJob: false } 
        }))
      );
      
      const finalResults = filteredResults.map(fr => 
        results.find(r => r.candidateId === fr.candidate.id!)!
      );
      
      console.log(`[Local Matching] ✅ Completed: ${finalResults.length} matches (filtered from ${results.length})`);
      
      // Log des meilleurs résultats
      finalResults.slice(0, 5).forEach((result, index) => {
        const pmoTag = result.isPMOCandidate ? '🎯 PMO' : '📋 Non-PMO';
        console.log(`[Local Matching] ${index + 1}. ${result.firstName} ${result.lastName} (${result.position}): ${result.score}% ${pmoTag}`);
      });
      
      return finalResults;
      
    } catch (error) {
      console.error('[Local Matching] ❌ Error:', error);
      throw error;
    }
  }
  
  /**
   * Recalcul forcé (identique au calcul normal puisque c'est instantané)
   */
  async forceRecalculateAllScores(jobOfferId: string): Promise<LocalMatchResult[]> {
    console.log(`[Local Matching] ⚡ Force recalculation (instant) for job: ${jobOfferId}`);
    return this.calculateMatchesForJobOffer(jobOfferId);
  }
  
  /**
   * Obtenir les meilleurs candidats
   */
  async getTopCandidatesForJobOffer(jobOfferId: string, limit: number = 10): Promise<LocalMatchResult[]> {
    const matches = await this.calculateMatchesForJobOffer(jobOfferId);
    return matches.slice(0, limit);
  }
}

export const localMatchingService = new LocalMatchingService();
