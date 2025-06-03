
import { supabase } from '@/integrations/supabase/client';
import { persistentScoringService } from './persistentScoringService';

export const scoreRecalculationService = {
  /**
   * Recalculate general scores for all candidates
   */
  async recalculateAllGeneralScores(): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    try {
      console.log('Starting recalculation of all general scores...');
      
      // Get all candidates for the current user
      const { data: candidates, error } = await supabase
        .from('candidates')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error || !candidates) {
        console.error('Error fetching candidates:', error);
        return { success: 0, failed: 0 };
      }

      console.log(`Found ${candidates.length} candidates to recalculate`);

      // Process in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(candidate => 
            persistentScoringService.recalculateGeneralScore(candidate.id)
          )
        );
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value !== null) {
            success++;
            console.log(`✅ Recalculated score for candidate ${batch[index].id}: ${result.value}`);
          } else {
            failed++;
            console.error(`❌ Failed to recalculate score for candidate ${batch[index].id}`, 
              result.status === 'rejected' ? result.reason : 'Null result');
          }
        });
        
        // Small delay between batches
        if (i + batchSize < candidates.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log(`✅ Recalculation completed: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      console.error('Error in recalculateAllGeneralScores:', error);
      return { success, failed };
    }
  },

  /**
   * Recalculate job scores for all candidates for a specific job offer
   */
  async recalculateJobScores(jobOfferId: string): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    try {
      console.log(`Starting recalculation of job scores for job ${jobOfferId}...`);
      
      // Get all candidates for the current user
      const { data: candidates, error } = await supabase
        .from('candidates')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error || !candidates) {
        console.error('Error fetching candidates:', error);
        return { success: 0, failed: 0 };
      }

      console.log(`Found ${candidates.length} candidates to recalculate for job ${jobOfferId}`);

      // Process in batches
      const batchSize = 5;
      for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(candidate => 
            persistentScoringService.calculateAndStoreJobScore(candidate.id, jobOfferId)
          )
        );
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value !== null) {
            success++;
            console.log(`✅ Recalculated job score for candidate ${batch[index].id}`);
          } else {
            failed++;
            console.error(`❌ Failed to recalculate job score for candidate ${batch[index].id}`, 
              result.status === 'rejected' ? result.reason : 'Null result');
          }
        });
        
        // Small delay between batches
        if (i + batchSize < candidates.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      console.log(`✅ Job score recalculation completed: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      console.error('Error in recalculateJobScores:', error);
      return { success, failed };
    }
  }
};
