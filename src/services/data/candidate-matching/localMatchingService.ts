
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
  skillsDetails: {
    matched: string[];
    missing: string[];
    additional: string[];
  };
  explanation: string;
  isPMOCandidate: boolean;
  // Nouvelles propriétés pour la gestion globale
  isOwnCandidate: boolean;
  ownerFirstName: string;
  ownerLastName: string;
  // Nouvelle propriété pour la relocalisation
  needsRelocation: boolean;
}

/**
 * Service de matching local instantané sans IA
 */
class LocalMatchingService {
  
  /**
   * Calcule les correspondances pour une offre d'emploi
   */
  async calculateMatchesForJobOffer(jobOfferId: string, includeGlobalCandidates: boolean = false): Promise<LocalMatchResult[]> {
    console.log(`[Local Matching] 🚀 Starting matching for job: ${jobOfferId}`);
    console.log(`[Local Matching] 🔄 Mode: ${includeGlobalCandidates ? 'GLOBAL (all candidates)' : 'LOCAL (user candidates only)'}`);
    
    try {
      // Récupérer l'offre d'emploi
      const jobOffer = await jobOfferService.getJobOfferById(jobOfferId);
      if (!jobOffer) {
        throw new Error('Job offer not found');
      }
      
      console.log(`[Local Matching] 📋 Job: "${jobOffer.title}"`);
      
      // Récupérer les candidats selon le mode sélectionné
      const candidates = includeGlobalCandidates 
        ? await candidateService.getAllCandidates()
        : await candidateService.getUserCandidates();
      
      console.log(`[Local Matching] 📊 Retrieved ${candidates.length} candidates`);
      
      // Vérifier la répartition des candidats
      const ownCandidates = candidates.filter(c => c.isOwnCandidate);
      const otherCandidates = candidates.filter(c => !c.isOwnCandidate);
      
      console.log(`[Local Matching] 👤 Own candidates: ${ownCandidates.length}`);
      console.log(`[Local Matching] 🌍 Other candidates: ${otherCandidates.length}`);
      
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
          skillsDetails: scoringResult.skillsDetails,
          explanation: scoringResult.explanation,
          isPMOCandidate: scoringResult.isPMOCandidate,
          // Nouvelles propriétés pour la distinction
          isOwnCandidate: candidate.isOwnCandidate || false,
          ownerFirstName: candidate.owner_first_name || '',
          ownerLastName: candidate.owner_last_name || '',
          // Nouvelle propriété pour la relocalisation
          needsRelocation: scoringResult.needsRelocation
        });
      }
      
      // Filtrer et trier les résultats
      const filteredResults = localAlgorithmicScoringService.filterCandidates(
        results.map(r => ({ 
          candidate: candidates.find(c => c.id === r.candidateId)!, 
          score: { 
            score: r.score, 
            breakdown: r.details, 
            explanation: r.explanation, 
            isPMOCandidate: r.isPMOCandidate, 
            isPMOJob: false,
            skillsDetails: r.skillsDetails,
            needsRelocation: r.needsRelocation
          } 
        }))
      );
      
      const finalResults = filteredResults.map(fr => 
        results.find(r => r.candidateId === fr.candidate.id!)!
      );
      
      console.log(`[Local Matching] ✅ Final results: ${finalResults.length} matches`);
      console.log(`[Local Matching] 📊 Own candidates in results: ${finalResults.filter(r => r.isOwnCandidate).length}`);
      console.log(`[Local Matching] 📊 Other candidates in results: ${finalResults.filter(r => !r.isOwnCandidate).length}`);
      
      // Statistiques de localisation
      const localCandidates = finalResults.filter(r => !r.needsRelocation);
      const distantCandidates = finalResults.filter(r => r.needsRelocation);
      
      console.log(`[Local Matching] 📍 Local candidates: ${localCandidates.length}`);
      console.log(`[Local Matching] 🌍 Distant candidates: ${distantCandidates.length}`);
      
      // Log des meilleurs résultats
      finalResults.slice(0, 5).forEach((result, index) => {
        const ownerTag = result.isOwnCandidate ? '👤 Own' : `🌍 ${result.ownerFirstName} ${result.ownerLastName}`;
        const pmoTag = result.isPMOCandidate ? '🎯 PMO' : '📋 Non-PMO';
        const locationTag = result.needsRelocation ? '🚚 Relocation' : '📍 Local';
        console.log(`[Local Matching] ${index + 1}. ${result.firstName} ${result.lastName} (${result.position}): ${result.score}% ${ownerTag} ${pmoTag} ${locationTag}`);
      });
      
      return finalResults;
      
    } catch (error) {
      console.error('[Local Matching] ❌ Error:', error);
      throw error;
    }
  }
  
  /**
   * Recalcul forcé
   */
  async forceRecalculateAllScores(jobOfferId: string, includeGlobalCandidates: boolean = false): Promise<LocalMatchResult[]> {
    console.log(`[Local Matching] ⚡ Force recalculation for job: ${jobOfferId} (global: ${includeGlobalCandidates})`);
    return this.calculateMatchesForJobOffer(jobOfferId, includeGlobalCandidates);
  }
  
  /**
   * Obtenir les meilleurs candidats
   */
  async getTopCandidatesForJobOffer(jobOfferId: string, limit: number = 10, includeGlobalCandidates: boolean = false): Promise<LocalMatchResult[]> {
    const matches = await this.calculateMatchesForJobOffer(jobOfferId, includeGlobalCandidates);
    return matches.slice(0, limit);
  }
}

export const localMatchingService = new LocalMatchingService();
