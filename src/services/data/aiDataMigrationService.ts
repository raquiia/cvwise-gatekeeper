
import { supabase } from '@/integrations/supabase/client';
import { candidateService } from './candidateService';

/**
 * Service pour migrer les données AI - SIMPLIFIÉ
 * Plus besoin de migration complexe, les données sont maintenant dans la table candidates
 */
export class AIDataMigrationService {
  
  /**
   * Plus besoin de migrer - les données AI sont maintenant stockées directement dans candidates
   */
  async migrateCandidateAIData(candidateId: string): Promise<boolean> {
    console.log('ℹ️ Migration not needed - AI data is now stored directly in candidates table');
    return true;
  }

  /**
   * Plus besoin de vérification - les données AI sont récupérées avec le candidat
   */
  async checkAndMigrateIfNeeded(candidateId: string): Promise<void> {
    console.log('ℹ️ Migration check not needed - AI data is now stored directly in candidates table');
  }
}

export const aiDataMigrationService = new AIDataMigrationService();
