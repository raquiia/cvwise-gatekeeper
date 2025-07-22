import { supabase } from '@/integrations/supabase/client';
import { candidateService } from '../candidateService';
import { jobOfferService } from '../job-offers/jobOfferService';
import { calculateCandidateJobMatch } from './matchUtils';
import { intelligentCache } from '@/services/cache/intelligentCacheService';
import type { CandidateJobMatch, ExtendedCandidateMatch } from './types';

interface MatchData {
  candidateId: string;
  firstName: string;
  lastName: string;
  position: string;
  company: string;
  score: number;
  local_score: number;
  global_score: number;
  skills_only_score: number;
  details: any;
  isOwnCandidate?: boolean;
  ownerFirstName?: string;
  ownerLastName?: string;
}

class MatchDbService {
  // PHASE 2: Bump calculation version to force complete cache invalidation
  private static readonly CALCULATION_VERSION = 2; // Increased from 1 to 2
  private activeJobId: string | null = null;
  private activeJobTitle: string | null = null;

  /**
   * PHASE 1: Set active job context for PMO-specific scoring
   */
  async setActiveJobContext(jobOfferId: string | null, jobTitle?: string): Promise<void> {
    this.activeJobId = jobOfferId;
    this.activeJobTitle = jobTitle || null;
    console.log(`[Match DB Service] 🎯 PHASE 1 - Active job context set: ${jobOfferId} (${jobTitle})`);
  }

  /**
   * PHASE 2 & 3: Force complete recalculation with enhanced PMO debugging
   */
  async forceRecalculateAllScores(jobOfferId: string, includeGlobalCandidates: boolean = false): Promise<MatchData[]> {
    console.log(`[Match DB Service] 🚀 PHASE 2 - FORCE RECALCULATION v${MatchDbService.CALCULATION_VERSION} for job: ${jobOfferId}`);
    
    // Clear ALL related caches first
    intelligentCache.invalidatePattern(`*${jobOfferId}*`);
    intelligentCache.expireScoreCache();
    intelligentCache.clear(); // Nuclear option for complete cache reset
    
    // PHASE 3: Enable enhanced PMO debugging
    const wasDebugEnabled = (window as any).DEBUG_MATCHING;
    (window as any).DEBUG_MATCHING = true;
    
    try {
      const jobOffer = await jobOfferService.getJobOfferById(jobOfferId);
      if (!jobOffer) {
        throw new Error('Job offer not found');
      }

      // PHASE 3: Enhanced PMO job detection logging
      const isPMOJob = this.isPMOJobOffer(jobOffer);
      console.log(`[Match DB Service] 🎯 PHASE 3 - PMO JOB DETECTION: "${jobOffer.title}" → ${isPMOJob ? 'PMO DETECTED' : 'Non-PMO'}`);
      
      if (isPMOJob) {
        console.log(`[Match DB Service] 🎯 PMO JOB ANALYSIS:`);
        console.log(`[Match DB Service] - Title: "${jobOffer.title}"`);
        console.log(`[Match DB Service] - Required Skills: [${(jobOffer.required_skills || []).join(', ')}]`);
        console.log(`[Match DB Service] - Preferred Skills: [${(jobOffer.preferred_skills || []).join(', ')}]`);
        console.log(`[Match DB Service] - Expected high scores for: Simon Prost (Project Leader), Adrien Lacorte (Consultant PMO)`);
      }

      const allCandidates = includeGlobalCandidates 
        ? await this.getAllCandidatesGlobally()
        : await candidateService.getUserCandidates();

      console.log(`[Match DB Service] 📊 PHASE 2 - Processing ${allCandidates.length} candidates for PMO job matching`);

      const matches: MatchData[] = [];
      let processedCount = 0;

      for (const candidate of allCandidates) {
        try {
          processedCount++;
          console.log(`[Match DB Service] 🔄 PHASE 3 - Processing candidate ${processedCount}/${allCandidates.length}: ${candidate.first_name} ${candidate.last_name} (${candidate.position})`);
          
          const matchResult = await calculateCandidateJobMatch(candidate, jobOffer);
          
          // PHASE 3: Enhanced PMO candidate detection
          const candidateIsPMO = this.isCandidatePMO(candidate);
          console.log(`[Match DB Service] 🎯 CANDIDATE PMO ANALYSIS: ${candidate.first_name} ${candidate.last_name}`);
          console.log(`[Match DB Service] - Position: "${candidate.position}"`);
          console.log(`[Match DB Service] - Is PMO: ${candidateIsPMO}`);
          console.log(`[Match DB Service] - Final Score: ${matchResult.score}%`);
          console.log(`[Match DB Service] - Role Match: ${matchResult.details.roleMatch?.score}% (${matchResult.details.roleMatch?.explanation})`);
          
          // Store the match with enhanced version tracking
          const matchData: MatchData = {
            candidateId: candidate.id!,
            firstName: candidate.first_name || '',
            lastName: candidate.last_name || '',
            position: candidate.position || '',
            company: candidate.company || '',
            score: matchResult.score,
            local_score: matchResult.localScore,
            global_score: matchResult.globalScore,
            skills_only_score: matchResult.skillsOnlyScore,
            details: matchResult.details,
            isOwnCandidate: includeGlobalCandidates ? candidate.is_own_candidate : true,
            ownerFirstName: includeGlobalCandidates ? candidate.owner_first_name : undefined,
            ownerLastName: includeGlobalCandidates ? candidate.owner_last_name : undefined
          };

          // Save to database with new version
          await this.saveMatchToDatabase(jobOfferId, candidate.id!, matchResult, includeGlobalCandidates);
          
          matches.push(matchData);
          
        } catch (error) {
          console.error(`[Match DB Service] ❌ Error processing candidate ${candidate.first_name} ${candidate.last_name}:`, error);
        }
      }

      // PHASE 3: Final results analysis for PMO
      console.log(`[Match DB Service] 🎯 PHASE 3 - PMO MATCHING RESULTS:`);
      const topMatches = matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      topMatches.forEach((match, index) => {
        const isPMOCandidate = this.isCandidatePositionPMO(match.position);
        console.log(`[Match DB Service] ${index + 1}. ${match.firstName} ${match.lastName} (${match.position}): ${match.score}% ${isPMOCandidate ? '🎯 PMO' : '📋 Non-PMO'}`);
      });

      console.log(`[Match DB Service] ✅ PHASE 2 - Force recalculation v${MatchDbService.CALCULATION_VERSION} completed: ${matches.length} matches processed`);
      
      return matches;
      
    } finally {
      // Restore original debug state
      (window as any).DEBUG_MATCHING = wasDebugEnabled;
    }
  }

  /**
   * PHASE 3: Enhanced PMO job detection
   */
  private isPMOJobOffer(jobOffer: any): boolean {
    const title = (jobOffer.title || '').toLowerCase();
    const requiredSkills = (jobOffer.required_skills || []).map((s: string) => s.toLowerCase());
    const preferredSkills = (jobOffer.preferred_skills || []).map((s: string) => s.toLowerCase());
    const allSkills = [...requiredSkills, ...preferredSkills];
    
    const pmoTitleKeywords = ['pmo', 'project manager', 'chef de projet', 'ingénieur projet', 'directeur de projet', 'responsable projet', 'project leader'];
    const pmoSkillKeywords = ['project management', 'gestion de projet', 'pmp', 'prince2', 'planisware', 'microsoft project'];
    
    const titleMatch = pmoTitleKeywords.some(keyword => title.includes(keyword));
    const skillMatch = pmoSkillKeywords.some(keyword => allSkills.some(skill => skill.includes(keyword)));
    
    return titleMatch || skillMatch;
  }

  /**
   * PHASE 3: Enhanced PMO candidate detection
   */
  private isCandidatePMO(candidate: any): boolean {
    return this.isCandidatePositionPMO(candidate.position);
  }

  private isCandidatePositionPMO(position: string): boolean {
    if (!position) return false;
    
    const pos = position.toLowerCase();
    const pmoKeywords = ['pmo', 'project manager', 'chef de projet', 'project leader', 'directeur de projet', 'responsable projet', 'consultant pmo', 'ingénieur projet'];
    
    return pmoKeywords.some(keyword => pos.includes(keyword));
  }

  async calculateMatchesForJobOffer(jobOfferId: string, includeGlobalCandidates: boolean = false): Promise<MatchData[]> {
    const cacheKey = `match-calculation-${jobOfferId}-${includeGlobalCandidates}-${MatchDbService.CALCULATION_VERSION}`;
    const cachedMatches = intelligentCache.get<MatchData[]>(cacheKey);

    if (cachedMatches) {
      console.log(`[Match DB Service] ✅ Returning cached matches for job offer: ${jobOfferId} (version ${MatchDbService.CALCULATION_VERSION})`);
      return cachedMatches;
    }

    console.log(`[Match DB Service] ⚡ Calculating matches for job offer: ${jobOfferId} (version ${MatchDbService.CALCULATION_VERSION})`);

    const jobOffer = await jobOfferService.getJobOfferById(jobOfferId);
    if (!jobOffer) {
      throw new Error('Job offer not found');
    }

    const allCandidates = includeGlobalCandidates
      ? await this.getAllCandidatesGlobally()
      : await candidateService.getUserCandidates();

    const matches: MatchData[] = [];

    for (const candidate of allCandidates) {
      try {
        const matchResult = await calculateCandidateJobMatch(candidate, jobOffer);

        const matchData: MatchData = {
          candidateId: candidate.id!,
          firstName: candidate.first_name || '',
          lastName: candidate.last_name || '',
          position: candidate.position || '',
          company: candidate.company || '',
          score: matchResult.score,
          local_score: matchResult.localScore,
          global_score: matchResult.globalScore,
          skills_only_score: matchResult.skillsOnlyScore,
          details: matchResult.details,
          isOwnCandidate: includeGlobalCandidates ? candidate.is_own_candidate : true,
          ownerFirstName: includeGlobalCandidates ? candidate.owner_first_name : undefined,
          ownerLastName: includeGlobalCandidates ? candidate.owner_last_name : undefined
        };

        matches.push(matchData);

        await this.saveMatchToDatabase(jobOfferId, candidate.id!, matchResult, includeGlobalCandidates);
      } catch (error) {
        console.error(`Error processing candidate ${candidate.first_name} ${candidate.last_name}:`, error);
      }
    }

    intelligentCache.set(cacheKey, matches);
    return matches;
  }

  private async getAllCandidatesGlobally() {
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        *,
        profiles!candidates_user_id_fkey (
          first_name as owner_first_name,
          last_name as owner_last_name
        )
      `);

    if (error) {
      throw error;
    }

    return data.map(candidate => ({
      ...candidate,
      is_own_candidate: false,
      owner_first_name: candidate.profiles?.owner_first_name,
      owner_last_name: candidate.profiles?.owner_last_name
    }));
  }

  private async saveMatchToDatabase(jobOfferId: string, candidateId: string, matchResult: CandidateJobMatch, isGlobal: boolean) {
    const { error } = await supabase
      .from('candidate_job_matches')
      .upsert({
        job_offer_id: jobOfferId,
        candidate_id: candidateId,
        match_score: matchResult.score,
        global_score: matchResult.globalScore,
        local_score: matchResult.localScore,
        skills_only_score: matchResult.skillsOnlyScore,
        skills_match_score: matchResult.details.skills?.matchPercentage || 0,
        experience_match_score: matchResult.details.experienceLevel?.score || 0,
        education_match_score: matchResult.details.educationLevel?.score || 0,
        location_match_score: matchResult.details.location?.score || 0,
        match_details: matchResult.details,
        is_global_match: isGlobal,
        calculation_version: MatchDbService.CALCULATION_VERSION,
        calculated_at: new Date().toISOString()
      });

    if (error) {
      console.error('[Match DB Service] Error saving match to database:', error);
    }
  }
}

export const matchDbService = new MatchDbService();
