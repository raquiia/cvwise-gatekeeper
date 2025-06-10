
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, StickyNote } from 'lucide-react';
import { candidateNotesService, type CandidateNote } from '@/services/data/candidateNotesService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface PersonalNotesSectionProps {
  candidateId: string;
}

const PersonalNotesSection: React.FC<PersonalNotesSectionProps> = ({ candidateId }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [existingNote, setExistingNote] = useState<CandidateNote | null>(null);

  useEffect(() => {
    const loadExistingNotes = async () => {
      try {
        const allNotes = await candidateNotesService.getNotesForCandidate(candidateId);
        const profileNote = allNotes.find(note => note.note_type === 'global' && note.content.startsWith('[NOTE PROFIL]'));
        
        if (profileNote) {
          setExistingNote(profileNote);
          // Retirer le préfixe [NOTE PROFIL] pour l'affichage
          const content = profileNote.content.replace('[NOTE PROFIL] ', '');
          setNotes(content);
        }
      } catch (error) {
        console.error('Error loading personal notes:', error);
      }
    };

    if (candidateId && user) {
      loadExistingNotes();
    }
  }, [candidateId, user]);

  const handleSave = async () => {
    if (!user || !notes.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une note avant de sauvegarder",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Préfixer avec [NOTE PROFIL] pour identifier les notes de profil
      const noteContent = `[NOTE PROFIL] ${notes}`;

      if (existingNote) {
        // Mettre à jour la note existante
        await candidateNotesService.updateNote(existingNote.id!, {
          content: noteContent
        });
      } else {
        // Créer une nouvelle note
        const newNote = await candidateNotesService.addNote({
          candidate_id: candidateId,
          user_id: user.id,
          content: noteContent,
          note_type: 'global'
        });
        
        if (newNote) {
          setExistingNote(newNote);
        }
      }

      toast({
        title: "Note sauvegardée",
        description: "Votre note personnelle a été enregistrée avec succès",
      });
    } catch (error) {
      console.error('Error saving personal note:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la note",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <StickyNote className="w-5 h-5" />
          </div>
          Notes personnelles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Ajoutez vos notes personnelles sur ce candidat..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[120px] resize-none"
        />
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving || !notes.trim()}
            className="bg-navy hover:bg-navy/90 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalNotesSection;
