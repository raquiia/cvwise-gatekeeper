import { supabase } from '@/integrations/supabase/client';
import { candidateNotesService } from '@/services/data/candidateNotesService';
import { candidateService } from '@/services/data/candidateService';
import { candidateStatusService } from '@/services/data/candidateStatusService';
import { recruiterTasksService } from '@/services/data/recruiterTasksService';

export interface ChatResponse {
  message: string;
  action?: {
    type: string;
    success: boolean;
    details?: string;
  };
}

class ChatbotService {
  private navigateFunction: ((path: string) => void) | null = null;

  setNavigateFunction(navigate: (path: string) => void) {
    this.navigateFunction = navigate;
  }

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
        
        case 'change_status_with_note':
          return await this.changeStatusWithNote(action.candidateId, action.status, action.noteContent, action.businessManager, action.scheduledDate, action.interviewType);
        
        case 'get_candidate_info':
          return await this.getCandidateInfo(action.candidateId);
        
        case 'search_candidates':
          return await this.searchCandidates(action.criteria);
        
        case 'navigate':
          return await this.navigateToPage(action.path, action.candidateId, action.searchParams);
        
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

  private async navigateToPage(path: string, candidateId?: string, searchParams?: any): Promise<{ type: string; success: boolean; details?: string }> {
    try {
      if (!this.navigateFunction) {
        return {
          type: 'navigate',
          success: false,
          details: 'Navigation non disponible'
        };
      }

      let targetPath = path;

      // Si c'est une navigation vers un candidat spécifique
      if (candidateId && path === '/candidates/:id') {
        targetPath = `/candidates/${candidateId}`;
      }

      // Ajouter des paramètres de recherche si nécessaire
      if (searchParams && Object.keys(searchParams).length > 0) {
        const params = new URLSearchParams(searchParams);
        targetPath += `?${params.toString()}`;
      }

      this.navigateFunction(targetPath);

      return {
        type: 'navigate',
        success: true,
        details: `Navigation vers ${targetPath}`
      };
    } catch (error) {
      return {
        type: 'navigate',
        success: false,
        details: 'Erreur lors de la navigation'
      };
    }
  }

  private async addCandidateNote(candidateId: string, content: string, noteType: string = 'global') {
    try {
      // Récupérer l'utilisateur actuel pour le user_id
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          type: 'add_note',
          success: false,
          details: 'Utilisateur non authentifié'
        };
      }

      const result = await candidateNotesService.addNote({
        candidate_id: candidateId,
        user_id: user.id,
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

  private async changeCandidateStatus(candidateId: string, status: string): Promise<{ type: string; success: boolean; details?: string }> {
    try {
      // Validation critique pour EC1 et EC2
      if (status === 'ec1' || status === 'ec2') {
        return {
          type: 'change_status',
          success: false,
          details: `❌ Impossible de passer en ${status.toUpperCase()} sans les informations du Business Manager. Utilisez la commande complète avec le nom, email et date d'entretien.`
        };
      }

      const success = await candidateStatusService.updateCandidateStatus(candidateId, status);
      
      return {
        type: 'change_status',
        success,
        details: success ? `Statut changé en ${status}` : 'Erreur lors du changement de statut'
      };
    } catch (error) {
      return {
        type: 'change_status',
        success: false,
        details: 'Erreur lors du changement de statut'
      };
    }
  }

  private async changeStatusWithNote(
    candidateId: string, 
    status: string, 
    noteContent: string, 
    businessManager?: string,
    scheduledDate?: string,
    interviewType?: 'ec1' | 'ec2',
    businessManagerEmail?: string
  ): Promise<{ type: string; success: boolean; details?: string }> {
    try {
      // Validation critique pour EC1 et EC2
      if ((status === 'ec1' || status === 'ec2') && (!businessManager || !scheduledDate)) {
        return {
          type: 'change_status_with_note',
          success: false,
          details: `❌ Informations manquantes pour ${status.toUpperCase()}. Requis: Business Manager (nom + email) + Date/heure d'entretien.`
        };
      }
      // Changer le statut
      const statusSuccess = await candidateStatusService.updateCandidateStatus(candidateId, status);
      
      if (!statusSuccess) {
        return {
          type: 'change_status_with_note',
          success: false,
          details: 'Erreur lors du changement de statut'
        };
      }

      // Récupérer l'utilisateur actuel pour le user_id
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          type: 'change_status_with_note',
          success: false,
          details: 'Utilisateur non authentifié'
        };
      }

      // Récupérer les informations du candidat pour la tâche
      const candidate = await candidateService.getCandidateById(candidateId);
      if (!candidate) {
        return {
          type: 'change_status_with_note',
          success: false,
          details: 'Candidat non trouvé'
        };
      }

      // Formatter le contenu de la note comme le fait BusinessManagerSelector
      let formattedNoteContent = noteContent;
      if (businessManager && scheduledDate) {
        const dateFormatted = new Date(scheduledDate).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        formattedNoteContent = `Entretien ${status.toUpperCase()} planifié avec ${businessManager} le ${dateFormatted}.\n\n${noteContent}`;
      }

      // Ajouter la note
      const noteSuccess = await candidateNotesService.addNote({
        candidate_id: candidateId,
        user_id: user.id,
        content: formattedNoteContent,
        note_type: status as any, // 'ec1' ou 'ec2'
        business_manager: businessManager
      });

      let taskCreated = false;
      let taskDetails = '';

      // Créer une tâche si c'est un entretien EC1 ou EC2 avec BM
      if ((status === 'ec1' || status === 'ec2') && businessManager && scheduledDate && interviewType) {
        try {
          const task = await recruiterTasksService.createBMInterviewTask(
            user.id,
            candidateId,
            `${candidate.first_name} ${candidate.last_name}`,
            candidate.position || 'Poste non spécifié',
            businessManager,
            interviewType,
            scheduledDate
          );
          taskCreated = !!task;
          taskDetails = taskCreated ? ' et tâche créée sur le tableau de bord' : '';
        } catch (taskError) {
          console.error('Erreur lors de la création de la tâche:', taskError);
          taskDetails = ' mais erreur lors de la création de la tâche';
        }
      }

      return {
        type: 'change_status_with_note',
        success: !!noteSuccess,
        details: noteSuccess ? 
          `Statut changé en ${status}, note ajoutée avec succès${taskDetails}` : 
          'Statut changé mais erreur lors de l\'ajout de la note'
      };
    } catch (error) {
      console.error('Erreur dans changeStatusWithNote:', error);
      return {
        type: 'change_status_with_note',
        success: false,
        details: 'Erreur lors du changement de statut et ajout de note'
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