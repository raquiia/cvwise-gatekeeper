
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type NoteType = 'precal' | 'ci1' | 'ci2' | 'ci3' | 'global';

export interface CandidateNote {
  id?: string;
  candidate_id: string;
  user_id: string;
  content: string;
  note_type: NoteType;
  enhanced_content?: string;
  business_manager?: string;
  created_at?: string;
  updated_at?: string;
}

export const candidateNotesService = {
  // Récupérer les notes pour un candidat spécifique
  getNotesForCandidate: async (candidateId: string): Promise<CandidateNote[]> => {
    try {
      const { data, error } = await supabase
        .from('candidate_notes')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Adapter les données pour s'assurer que note_type existe
      const notesWithType = data?.map(note => ({
        ...note,
        // Assurer que note_type est disponible, sinon utiliser 'global' comme fallback
        note_type: (note as any).note_type || 'global' as NoteType
      })) as CandidateNote[] || [];
      
      return notesWithType;
    } catch (error: any) {
      console.error('Error fetching candidate notes:', error);
      toast({
        title: "Erreur",
        description: `Impossible de récupérer les notes: ${error.message}`,
        variant: "destructive",
      });
      return [];
    }
  },

  // Ajouter une nouvelle note
  addNote: async (note: Omit<CandidateNote, 'id' | 'created_at' | 'updated_at'>): Promise<CandidateNote | null> => {
    try {
      const { data, error } = await supabase
        .from('candidate_notes')
        .insert(note)
        .select()
        .single();
      
      if (error) throw error;
      
      // Succès
      toast({
        title: "Note ajoutée",
        description: "La note a été enregistrée avec succès",
      });
      
      return data as CandidateNote;
    } catch (error: any) {
      console.error('Error adding candidate note:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'ajouter la note: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  },

  // Mettre à jour une note existante
  updateNote: async (id: string, updates: Partial<CandidateNote>): Promise<CandidateNote | null> => {
    try {
      const { data, error } = await supabase
        .from('candidate_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Note mise à jour",
        description: "La note a été mise à jour avec succès",
      });
      
      return data as CandidateNote;
    } catch (error: any) {
      console.error('Error updating candidate note:', error);
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour la note: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  },

  // Supprimer une note
  deleteNote: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('candidate_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Note supprimée",
        description: "La note a été supprimée avec succès",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting candidate note:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer la note: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  },

  // Améliorer le contenu d'une note avec OpenAI
  enhanceNoteContent: async (noteId: string, content: string): Promise<string | null> => {
    try {
      // Appel à la fonction Edge pour améliorer le contenu avec OpenAI
      const { data, error } = await supabase.functions.invoke('enhance-interview-note', {
        body: { content }
      });
      
      if (error) throw error;
      
      if (data && data.enhancedContent) {
        // Mettre à jour la note avec le contenu amélioré
        await supabase
          .from('candidate_notes')
          .update({ enhanced_content: data.enhancedContent })
          .eq('id', noteId);
        
        return data.enhancedContent;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error enhancing note content:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'améliorer la note: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  },
  
  // Générer un compte-rendu global basé sur toutes les notes du candidat
  generateGlobalSummary: async (candidateId: string): Promise<CandidateNote | null> => {
    try {
      // Récupérer toutes les notes existantes pour le candidat
      const notes = await candidateNotesService.getNotesForCandidate(candidateId);
      
      if (notes.length === 0) {
        toast({
          title: "Information",
          description: "Aucune note à synthétiser pour ce candidat",
        });
        return null;
      }
      
      // Préparer le contenu pour l'appel à OpenAI
      const notesContent = notes
        .filter(note => note.note_type !== 'global') // Exclure les notes globales précédentes
        .map(note => {
          const type = getNoteTypeLabel(note.note_type);
          const content = note.enhanced_content || note.content;
          return `--- ${type} ---\n${content}`;
        })
        .join('\n\n');
      
      // Appel à la fonction Edge pour générer le résumé global
      const { data, error } = await supabase.functions.invoke('generate-global-summary', {
        body: { notesContent, candidateId }
      });
      
      if (error) throw error;
      
      if (!data || !data.globalSummary) {
        throw new Error("La génération du résumé a échoué");
      }
      
      const userId = notes[0]?.user_id; // Utiliser l'ID de l'utilisateur des notes existantes
      
      if (!userId) {
        throw new Error("Impossible de déterminer l'utilisateur");
      }
      
      // Créer une nouvelle note de type global
      const newGlobalNote: Omit<CandidateNote, 'id' | 'created_at' | 'updated_at'> = {
        candidate_id: candidateId,
        user_id: userId,
        note_type: 'global',
        content: data.globalSummary,
      };
      
      // Enregistrer la note globale
      const result = await candidateNotesService.addNote(newGlobalNote);
      
      if (result) {
        toast({
          title: "Compte-rendu global généré",
          description: "Le compte-rendu global a été créé avec succès",
        });
        return result;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error generating global summary:', error);
      toast({
        title: "Erreur",
        description: `Impossible de générer le compte-rendu global: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  }
};

// Fonction pour obtenir le nom complet du type de note
export const getNoteTypeLabel = (noteType?: NoteType): string => {
  switch (noteType) {
    case 'precal': return 'Pré-qualification';
    case 'ci1': return 'Client Interview 1';
    case 'ci2': return 'Client Interview 2';
    case 'ci3': return 'Client Interview 3';
    case 'global': return 'Compte-rendu global';
    default: return 'Note';
  }
};
