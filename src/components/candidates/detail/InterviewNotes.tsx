
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CandidateNote, candidateNotesService } from '@/services/data/candidateNotesService';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PencilLine, Trash2, FileEdit, FilePlus, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InterviewNotesProps {
  candidateId: string;
}

const InterviewNotes: React.FC<InterviewNotesProps> = ({ candidateId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  
  // Charger les notes au chargement du composant
  useEffect(() => {
    loadNotes();
  }, [candidateId]);
  
  const loadNotes = async () => {
    setIsLoadingNotes(true);
    const fetchedNotes = await candidateNotesService.getNotesForCandidate(candidateId);
    setNotes(fetchedNotes);
    setIsLoadingNotes(false);
  };
  
  const handleSubmitNote = async () => {
    if (!newNoteContent.trim() || !user?.id) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une note",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const result = await candidateNotesService.addNote({
      candidate_id: candidateId,
      user_id: user.id,
      content: newNoteContent,
    });
    
    if (result) {
      setNewNoteContent('');
      await loadNotes();
    }
    
    setIsSubmitting(false);
  };
  
  const handleEnhanceNote = async (noteId: string, content: string) => {
    setIsEnhancing(true);
    
    const enhancedContent = await candidateNotesService.enhanceNoteContent(noteId, content);
    
    if (enhancedContent) {
      toast({
        title: "Note améliorée",
        description: "Le contenu de la note a été amélioré avec succès",
      });
      
      await loadNotes();
    }
    
    setIsEnhancing(false);
  };
  
  const handleStartEdit = (note: CandidateNote) => {
    setEditingNoteId(note.id || null);
    setEditContent(note.content);
  };
  
  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };
  
  const handleSaveEdit = async () => {
    if (editingNoteId && editContent.trim()) {
      await candidateNotesService.updateNote(editingNoteId, { content: editContent });
      setEditingNoteId(null);
      setEditContent('');
      await loadNotes();
    }
  };
  
  const confirmDelete = (noteId: string) => {
    setDeleteNoteId(noteId);
  };
  
  const handleDeleteNote = async () => {
    if (deleteNoteId) {
      await candidateNotesService.deleteNote(deleteNoteId);
      setDeleteNoteId(null);
      await loadNotes();
    }
  };
  
  const cancelDelete = () => {
    setDeleteNoteId(null);
  };
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <PencilLine className="mr-2 h-5 w-5" />
          Notes d'entretien
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Zone d'ajout de note */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4">
            <h3 className="text-sm font-medium mb-2">Ajouter une nouvelle note</h3>
            <Textarea
              placeholder="Saisissez vos notes d'entretien ici..."
              className="min-h-[120px] mb-3"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitNote}
                disabled={isSubmitting || !newNoteContent.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Ajouter la note
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Liste des notes */}
          {isLoadingNotes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune note d'entretien pour ce candidat</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {notes.map((note) => (
                  <div 
                    key={note.id} 
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-muted-foreground">
                        {note.created_at && format(new Date(note.created_at), 'PPP à HH:mm', { locale: fr })}
                      </span>
                      <div className="flex space-x-1">
                        {editingNoteId !== note.id && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleStartEdit(note)}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => confirmDelete(note.id || '')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            Annuler
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editContent.trim()}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {/* Afficher le contenu amélioré s'il existe, sinon afficher le contenu original */}
                          {note.enhanced_content || note.content}
                        </div>
                        
                        {!note.enhanced_content && (
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => handleEnhanceNote(note.id || '', note.content)}
                              disabled={isEnhancing}
                            >
                              {isEnhancing ? (
                                <>
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  Amélioration en cours...
                                </>
                              ) : (
                                <>
                                  Améliorer cette note avec IA
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        {/* Boîte de dialogue de confirmation pour la suppression */}
        <AlertDialog open={!!deleteNoteId} onOpenChange={() => deleteNoteId && setDeleteNoteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette note ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. La note sera définitivement supprimée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteNote} className="bg-red-500 hover:bg-red-600">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default InterviewNotes;
