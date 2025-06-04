
import { supabase } from '@/integrations/supabase/client';
import { processCandidateData } from '@/utils/candidateUtils';

/**
 * Service pour re-traiter les données des candidats existants
 */
export const candidateDataReprocessingService = {
  /**
   * Re-traiter un candidat spécifique avec les nouvelles fonctions d'amélioration
   */
  async reprocessSingleCandidate(candidateId: string) {
    try {
      // Récupérer les données actuelles du candidat
      const { data: currentCandidate, error: fetchError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (fetchError) {
        console.error('Erreur lors de la récupération du candidat:', fetchError);
        throw new Error('Impossible de récupérer les données du candidat');
      }

      if (!currentCandidate) {
        throw new Error('Candidat non trouvé');
      }

      console.log('🔄 Re-traitement du candidat:', candidateId);
      console.log('📋 Données avant traitement:', {
        address: currentCandidate.address,
        postal_code: currentCandidate.postal_code,
        city: currentCandidate.city,
        country: currentCandidate.country,
        location: currentCandidate.location
      });

      // Appliquer les nouvelles fonctions de traitement
      const reprocessedCandidate = processCandidateData(currentCandidate);

      console.log('✨ Données après traitement:', {
        address: reprocessedCandidate.address,
        postal_code: reprocessedCandidate.postal_code,
        city: reprocessedCandidate.city,
        country: reprocessedCandidate.country,
        location: reprocessedCandidate.location
      });

      // Mettre à jour uniquement les champs qui ont changé
      const fieldsToUpdate: any = {};
      
      if (reprocessedCandidate.address !== currentCandidate.address) {
        fieldsToUpdate.address = reprocessedCandidate.address;
      }
      if (reprocessedCandidate.postal_code !== currentCandidate.postal_code) {
        fieldsToUpdate.postal_code = reprocessedCandidate.postal_code;
      }
      if (reprocessedCandidate.city !== currentCandidate.city) {
        fieldsToUpdate.city = reprocessedCandidate.city;
      }
      if (reprocessedCandidate.country !== currentCandidate.country) {
        fieldsToUpdate.country = reprocessedCandidate.country;
      }

      // Mettre à jour d'autres champs texte si nécessaire
      const textFields = ['first_name', 'last_name', 'company', 'position'];
      textFields.forEach(field => {
        if (reprocessedCandidate[field] !== currentCandidate[field]) {
          fieldsToUpdate[field] = reprocessedCandidate[field];
        }
      });

      if (Object.keys(fieldsToUpdate).length > 0) {
        console.log('📝 Champs à mettre à jour:', fieldsToUpdate);
        
        const { error: updateError } = await supabase
          .from('candidates')
          .update({
            ...fieldsToUpdate,
            updated_at: new Date().toISOString()
          })
          .eq('id', candidateId);

        if (updateError) {
          console.error('Erreur lors de la mise à jour:', updateError);
          throw new Error('Échec de la mise à jour des données');
        }

        console.log('✅ Candidat mis à jour avec succès');
        return { success: true, updatedFields: fieldsToUpdate };
      } else {
        console.log('ℹ️ Aucune mise à jour nécessaire');
        return { success: true, updatedFields: {} };
      }

    } catch (error) {
      console.error('Erreur lors du re-traitement:', error);
      throw error;
    }
  },

  /**
   * Re-traiter tous les candidats de l'utilisateur actuel
   */
  async reprocessAllUserCandidates() {
    try {
      // Récupérer tous les candidats de l'utilisateur
      const { data: candidates, error: fetchError } = await supabase
        .from('candidates')
        .select('id, first_name, last_name, location, address, city, postal_code, country')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Erreur lors de la récupération des candidats:', fetchError);
        throw new Error('Impossible de récupérer la liste des candidats');
      }

      if (!candidates || candidates.length === 0) {
        console.log('ℹ️ Aucun candidat à traiter');
        return { success: true, processed: 0, updated: 0 };
      }

      console.log(`🚀 Début du re-traitement de ${candidates.length} candidats`);

      let processedCount = 0;
      let updatedCount = 0;
      const errors: string[] = [];

      for (const candidate of candidates) {
        try {
          const result = await this.reprocessSingleCandidate(candidate.id);
          processedCount++;
          
          if (Object.keys(result.updatedFields).length > 0) {
            updatedCount++;
          }
          
          // Petite pause pour éviter de surcharger la base de données
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Erreur pour le candidat ${candidate.id}:`, error);
          errors.push(`${candidate.first_name} ${candidate.last_name}: ${error.message}`);
        }
      }

      console.log(`✅ Re-traitement terminé: ${processedCount}/${candidates.length} traités, ${updatedCount} mis à jour`);

      return {
        success: true,
        processed: processedCount,
        updated: updatedCount,
        total: candidates.length,
        errors
      };

    } catch (error) {
      console.error('Erreur lors du re-traitement en masse:', error);
      throw error;
    }
  }
};
