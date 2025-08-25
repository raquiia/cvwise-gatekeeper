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

  async processCommand(command: string, conversationHistory?: any[]): Promise<ChatResponse> {
    try {
      console.log('📤 [ChatbotService] Envoi de la commande:', command);
      
      // Appel à l'Edge Function pour traiter la commande avec OpenAI
      const { data, error } = await supabase.functions.invoke('ai-chatbot', {
        body: { 
          command,
          conversationHistory: conversationHistory?.slice(-10) || [] // Derniers 10 messages max
        }
      });

      console.log('📥 [ChatbotService] Réponse reçue - Data:', data, 'Error:', error);

      if (error) {
        console.error('❌ [ChatbotService] Erreur de l\'Edge Function:', error);
        return {
          message: `Erreur du serveur: ${error.message || 'Erreur inconnue'}`,
          action: {
            type: 'error',
            success: false,
            details: error.message || 'Erreur lors de l\'appel au serveur'
          }
        };
      }

      if (!data || !data.message) {
        console.error('❌ [ChatbotService] Réponse invalide du serveur:', data);
        return {
          message: "Réponse invalide du serveur. Veuillez réessayer.",
          action: {
            type: 'error',
            success: false,
            details: 'Réponse serveur invalide'
          }
        };
      }

      console.log('✅ [ChatbotService] Traitement de la réponse avec action:', !!data.action);

      // Exécuter l'action identifiée par l'IA
      if (data.action) {
        console.log('🔄 [ChatbotService] Exécution de l\'action:', data.action.type);
        const actionResult = await this.executeAction(data.action);
        console.log('✅ [ChatbotService] Résultat de l\'action:', actionResult);
        return {
          message: data.message,
          action: actionResult
        };
      }

      return {
        message: data.message
      };
    } catch (error) {
      console.error('💥 [ChatbotService] Exception lors du traitement de la commande:', error);
      return {
        message: "Une erreur inattendue s'est produite. Veuillez réessayer.",
        action: {
          type: 'error',
          success: false,
          details: error instanceof Error ? error.message : 'Erreur inconnue'
        }
      };
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
      // Validation critique pour CI1, CI2 et CI3
      if (status === 'ci1' || status === 'ci2' || status === 'ci3') {
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
    interviewType?: 'ci1' | 'ci2' | 'ci3',
    businessManagerEmail?: string
  ): Promise<{ type: string; success: boolean; details?: string }> {
    try {
      // Validation critique pour CI1, CI2 et CI3
      if ((status === 'ci1' || status === 'ci2' || status === 'ci3') && (!businessManager || !scheduledDate)) {
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

      // Créer une tâche si c'est un entretien CI1, CI2 ou CI3 avec BM
      if ((status === 'ci1' || status === 'ci2' || status === 'ci3') && businessManager && scheduledDate && interviewType) {
        try {
          const task = await recruiterTasksService.createBMInterviewTask(
            user.id,
            candidateId,
            `${candidate.first_name} ${candidate.last_name}`,
            candidate.position || 'Poste non spécifié',
            businessManager,
            status as 'ci1' | 'ci2' | 'ci3',
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

  private async searchCandidates(criteria: any): Promise<{ type: string; success: boolean; details?: string }> {
    try {
      const candidates = await candidateService.getAllCandidates();
      
      let filteredCandidates = candidates;
      
      // Filtre par localisation (ville, pays, code postal)
      if (criteria.location) {
        const locationSearch = criteria.location.toLowerCase();
        filteredCandidates = filteredCandidates.filter(candidate => {
          const location = candidate.location?.toLowerCase() || '';
          const city = candidate.city?.toLowerCase() || '';
          const country = candidate.country?.toLowerCase() || '';
          const postalCode = candidate.postal_code?.toLowerCase() || '';
          
          return location.includes(locationSearch) || 
                 city.includes(locationSearch) || 
                 country.includes(locationSearch) ||
                 postalCode.includes(locationSearch);
        });
      }
      
      // Filtre par années d'expérience (min/max)
      if (criteria.experienceMin !== undefined) {
        filteredCandidates = filteredCandidates.filter(candidate => 
          (candidate.years_experience || 0) >= criteria.experienceMin
        );
      }
      if (criteria.experienceMax !== undefined) {
        filteredCandidates = filteredCandidates.filter(candidate => 
          (candidate.years_experience || 0) <= criteria.experienceMax
        );
      }
      
      // Filtre par diplômes/éducation
      if (criteria.education) {
        const educationSearch = criteria.education.toLowerCase();
        filteredCandidates = filteredCandidates.filter(candidate => {
          const education = candidate.education || [];
          return Array.isArray(education) && education.some((edu: any) => {
            const degree = edu.degree?.toLowerCase() || '';
            const field = edu.field?.toLowerCase() || '';
            const institution = edu.institution?.toLowerCase() || '';
            
            return degree.includes(educationSearch) || 
                   field.includes(educationSearch) ||
                   institution.includes(educationSearch) ||
                   (educationSearch.includes('ingénieur') && (degree.includes('ingénieur') || degree.includes('engineer'))) ||
                   (educationSearch.includes('master') && degree.includes('master')) ||
                   (educationSearch.includes('doctorat') && (degree.includes('doctorat') || degree.includes('phd')));
          });
        });
      }
      
      // Filtre par compétences
      if (criteria.skills && criteria.skills.length > 0) {
        filteredCandidates = filteredCandidates.filter(candidate => {
          const candidateSkills = candidate.skills || [];
          return criteria.skills.some((skill: string) => 
            Array.isArray(candidateSkills) && candidateSkills.some((candidateSkill: any) => 
              candidateSkill.name?.toLowerCase().includes(skill.toLowerCase())
            )
          );
        });
      }
      
      // Filtre par statut
      if (criteria.status) {
        filteredCandidates = filteredCandidates.filter(candidate => 
          candidate.detailed_status === criteria.status || candidate.status === criteria.status
        );
      }
      
      // Filtre par score AI minimum
      if (criteria.minScore !== undefined) {
        filteredCandidates = filteredCandidates.filter(candidate => 
          (candidate.ai_score || candidate.score || 0) >= criteria.minScore
        );
      }
      
      // Filtre par position (legacy support)
      if (criteria.position) {
        filteredCandidates = filteredCandidates.filter(candidate => 
          candidate.position?.toLowerCase().includes(criteria.position.toLowerCase())
        );
      }
      
      // Tri par score AI (décroissant)
      filteredCandidates.sort((a, b) => {
        const scoreA = a.ai_score || a.score || 0;
        const scoreB = b.ai_score || b.score || 0;
        return scoreB - scoreA;
      });
      
      // Limiter les résultats à 10 max
      const limitedResults = filteredCandidates.slice(0, 10);
      
      // Formater les résultats
      const resultsText = limitedResults.map((candidate, index) => {
        const score = candidate.ai_score || candidate.score || 0;
        const experience = candidate.years_experience || 0;
        const location = candidate.city || candidate.location || 'Non spécifié';
        const status = candidate.detailed_status || candidate.status || 'initial';
        
        return `${index + 1}. **${candidate.first_name} ${candidate.last_name}** (Score: ${score})
   📍 ${location} • 💼 ${experience} ans d'exp. • 📊 Statut: ${status}
   🔗 [Voir le profil](/candidates/${candidate.id})`;
      }).join('\n\n');
      
      let summaryText = `🔍 **${filteredCandidates.length} candidat(s) trouvé(s)**`;
      if (limitedResults.length < filteredCandidates.length) {
        summaryText += ` (affichage des ${limitedResults.length} meilleurs)`;
      }
      
      const finalDetails = limitedResults.length > 0 
        ? `${summaryText}\n\n${resultsText}`
        : `${summaryText}\n\nAucun candidat ne correspond exactement aux critères spécifiés.`;
      
      return {
        type: 'search_candidates',
        success: true,
        details: finalDetails
      };
    } catch (error) {
      console.error('Erreur lors de la recherche de candidats:', error);
      return {
        type: 'search_candidates',
        success: false,
        details: 'Erreur lors de la recherche de candidats'
      };
    }
  }
}

export const chatbotService = new ChatbotService();