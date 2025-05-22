
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type NoteType = 'precal' | 'ec1' | 'ec2' | 'general';

export interface CandidateNote {
  id?: string;
  candidate_id: string;
  user_id: string;
  content: string;
  note_type: NoteType;
  enhanced_content?: string;
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
      return data || [];
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
      
      return data;
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
      
      return data;
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
  }
};
