import { supabase } from '@/integrations/supabase/client';
import { candidateNotesService } from '@/services/data/candidateNotesService';
import { candidateService } from '@/services/data/candidateService';
import { candidateStatusService } from '@/services/data/candidateStatusService';

export interface ChatResponse {
  message: string;
  action?: {
    type: string;
    success: boolean;
    details?: string;
  };
}

class ChatbotService {
  async processCommand(command: string): Promise<ChatResponse> {
    try {
      // Appel à l'Edge Function pour traiter la commande avec OpenAI
      const { data, error } = await supabase.functions.invoke('ai-chatbot', {
        body: { command }
      });

      if (error) {
        throw error;
      }

      // Exécuter l'action identifiée par l'IA
      if (data.action) {
        const actionResult = await this.executeAction(data.action);
        return {
          message: data.message,
          action: actionResult
        };
      }

      return {
        message: data.message
      };
    } catch (error) {
      console.error('Erreur lors du traitement de la commande:', error);
      throw error;
    }
  }

  private async executeAction(action: any): Promise<{ type: string; success: boolean; details?: string }> {
    try {
      switch (action.type) {
        case 'add_note':
          return await this.addCandidateNote(action.candidateId, action.content, action.noteType);
        
        case 'change_status':
          return await this.changeCandidateStatus(action.candidateId, action.status);
        
        case 'get_candidate_info':
          return await this.getCandidateInfo(action.candidateId);
        
        case 'search_candidates':
          return await this.searchCandidates(action.criteria);
        
        default:
          return {
            type: action.type,
            success: false,
            details: 'Action non reconnue'
          };
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'action:', error);
      return {
        type: action.type,
        success: false,
        details: 'Erreur lors de l\'exécution'
      };
    }
  }

  private async addCandidateNote(candidateId: string, content: string, noteType: string = 'global') {
    try {
      const result = await candidateNotesService.addNote({
        candidate_id: candidateId,
        user_id: '', // Sera rempli par le service
        content,
        note_type: noteType as any,
        business_manager: undefined
      });

      return {
        type: 'add_note',
        success: !!result,
        details: result ? 'Note ajoutée avec succès' : 'Échec de l\'ajout de la note'
      };
    } catch (error) {
      return {
        type: 'add_note',
        success: false,
        details: 'Erreur lors de l\'ajout de la note'
      };
    }
  }

  private async changeCandidateStatus(candidateId: string, status: string) {
    try {
      const result = await candidateStatusService.updateCandidateStatus(candidateId, status);

      return {
        type: 'change_status',
        success: result,
        details: result ? 'Statut mis à jour avec succès' : 'Échec de la mise à jour du statut'
      };
    } catch (error) {
      return {
        type: 'change_status',
        success: false,
        details: 'Erreur lors de la mise à jour du statut'
      };
    }
  }

  private async getCandidateInfo(candidateId: string) {
    try {
      const candidate = await candidateService.getCandidateById(candidateId);

      return {
        type: 'get_candidate_info',
        success: !!candidate,
        details: candidate ? 
          `${candidate.first_name} ${candidate.last_name} - ${candidate.position || 'Poste non spécifié'} - Statut: ${candidate.detailed_status || 'initial'}` :
          'Candidat non trouvé'
      };
    } catch (error) {
      return {
        type: 'get_candidate_info',
        success: false,
        details: 'Erreur lors de la récupération des informations'
      };
    }
  }

  private async searchCandidates(criteria: any) {
    try {
      // Implémentation basique pour rechercher des candidats
      // Cela peut être étendu selon les besoins
      const candidates = await candidateService.getUserCandidates();
      
      let filteredCandidates = candidates || [];

      if (criteria.minScore) {
        filteredCandidates = filteredCandidates.filter(c => (c.ai_score || 0) >= criteria.minScore);
      }

      if (criteria.status) {
        filteredCandidates = filteredCandidates.filter(c => c.detailed_status === criteria.status);
      }

      if (criteria.position) {
        filteredCandidates = filteredCandidates.filter(c => 
          c.position?.toLowerCase().includes(criteria.position.toLowerCase())
        );
      }

      return {
        type: 'search_candidates',
        success: true,
        details: `Trouvé ${filteredCandidates.length} candidat(s) correspondant aux critères`
      };
    } catch (error) {
      return {
        type: 'search_candidates',
        success: false,
        details: 'Erreur lors de la recherche'
      };
    }
  }
}

export const chatbotService = new ChatbotService();