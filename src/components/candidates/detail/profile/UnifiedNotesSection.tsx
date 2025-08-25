import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  StickyNote, 
  PencilLine, 
  Trash2, 
  FileEdit, 
  FilePlus, 
  Check, 
  Loader2 
} from 'lucide-react';
import { CandidateNote, NoteType, candidateNotesService, getNoteTypeLabel } from '@/services/data/candidateNotesService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UnifiedNotesSectionProps {
  candidateId: string;
}

const UnifiedNotesSection: React.FC<UnifiedNotesSectionProps> = ({ candidateId }) => {
  const { user } = useAuth();
  
  // États pour notes personnelles
  const [personalNotes, setPersonalNotes] = useState('');
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [existingPersonalNote, setExistingPersonalNote] = useState<CandidateNote | null>(null);
  
  // États pour notes d'entretien
  const [interviewNotes, setInterviewNotes] = useState<CandidateNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<NoteType>('precal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editNoteType, setEditNoteType] = useState<NoteType>('precal');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  useEffect(() => {
    loadAllNotes();
  }, [candidateId, user]);

  const loadAllNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const allNotes = await candidateNotesService.getNotesForCandidate(candidateId);
      
      // Séparer notes personnelles et notes d'entretien
      const profileNote = allNotes.find(note => note.note_type === 'global' && note.content.startsWith('[NOTE PROFIL]'));
      const interviews = allNotes.filter(note => note.note_type !== 'global' || !note.content.startsWith('[NOTE PROFIL]'));
      
      if (profileNote) {
        setExistingPersonalNote(profileNote);
        const content = profileNote.content.replace('[NOTE PROFIL] ', '');
        setPersonalNotes(content);
      }
      
      setInterviewNotes(interviews);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleSavePersonalNotes = async () => {
    if (!user || !personalNotes.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une note avant de sauvegarder",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingPersonal(true);
      const noteContent = `[NOTE PROFIL] ${personalNotes}`;

      if (existingPersonalNote) {
        await candidateNotesService.updateNote(existingPersonalNote.id!, {
          content: noteContent
        });
      } else {
        const newNote = await candidateNotesService.addNote({
          candidate_id: candidateId,
          user_id: user.id,
          content: noteContent,
          note_type: 'global'
        });
        
        if (newNote) {
          setExistingPersonalNote(newNote);
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
      setIsSavingPersonal(false);
    }
  };

  const handleSubmitInterviewNote = async () => {
    if (!user?.id || !newNoteContent.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const result = await candidateNotesService.addNote({
      candidate_id: candidateId,
      user_id: user.id,
      content: newNoteContent,
      note_type: newNoteType,
    });
    
    if (result) {
      setNewNoteContent('');
      setNewNoteType('precal');
      await loadAllNotes();
    }
    
    setIsSubmitting(false);
  };

  const handleStartEdit = (note: CandidateNote) => {
    setEditingNoteId(note.id || null);
    setEditContent(note.content);
    setEditNoteType(note.note_type);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (editingNoteId && editContent.trim()) {
      await candidateNotesService.updateNote(editingNoteId, { 
        content: editContent,
        note_type: editNoteType
      });
      setEditingNoteId(null);
      setEditContent('');
      await loadAllNotes();
    }
  };

  const handleDeleteNote = async () => {
    if (deleteNoteId) {
      await candidateNotesService.deleteNote(deleteNoteId);
      setDeleteNoteId(null);
      await loadAllNotes();
    }
  };

  const getNoteTypeBadgeColor = (noteType: NoteType) => {
    switch (noteType) {
      case 'precal': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'ci1': return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'ci2': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      case 'ci3': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'global': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <StickyNote className="w-5 h-5" />
          </div>
          Notes & Entretiens
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="personal">Notes Personnelles</TabsTrigger>
            <TabsTrigger value="interviews">Entretiens</TabsTrigger>
          </TabsList>

          {/* Notes personnelles */}
          <TabsContent value="personal" className="space-y-4">
            <Textarea
              placeholder="Ajoutez vos notes personnelles sur ce candidat..."
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSavePersonalNotes}
                disabled={isSavingPersonal || !personalNotes.trim()}
                className="bg-navy hover:bg-navy/90 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSavingPersonal ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </TabsContent>

          {/* Notes d'entretien */}
          <TabsContent value="interviews" className="space-y-6">
            {/* Zone d'ajout */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium">Ajouter une note d'entretien</h3>
              
              <div className="space-y-4">
                <Select value={newNoteType} onValueChange={(value: NoteType) => setNewNoteType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type de note" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="precal">Pré-qualification</SelectItem>
                    <SelectItem value="ci1">Client Interview 1</SelectItem>
                    <SelectItem value="ci2">Client Interview 2</SelectItem>
                    <SelectItem value="ci3">Client Interview 3</SelectItem>
                  </SelectContent>
                </Select>
                
                <Textarea
                  placeholder="Saisissez vos notes d'entretien ici..."
                  className="min-h-[100px]"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                />
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitInterviewNote}
                    disabled={isSubmitting || !newNoteContent.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ajout...
                      </>
                    ) : (
                      <>
                        <FilePlus className="mr-2 h-4 w-4" />
                        Ajouter
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Liste des notes d'entretien */}
            {isLoadingNotes ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : interviewNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune note d'entretien pour ce candidat</p>
              </div>
            ) : (
              <div className="space-y-4">
                {interviewNotes.map((note) => (
                  <div 
                    key={note.id} 
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {note.created_at && format(new Date(note.created_at), 'PPP à HH:mm', { locale: fr })}
                        </span>
                        <Badge className={getNoteTypeBadgeColor(note.note_type)}>
                          {getNoteTypeLabel(note.note_type)}
                        </Badge>
                      </div>
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
                              onClick={() => setDeleteNoteId(note.id || '')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <Select 
                          value={editNoteType} 
                          onValueChange={(value: NoteType) => setEditNoteType(value)}
                        >
                          <SelectTrigger className="w-full mb-2">
                            <SelectValue placeholder="Type de note" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="precal">Pré-qualification</SelectItem>
                            <SelectItem value="ci1">Client Interview 1</SelectItem>
                            <SelectItem value="ci2">Client Interview 2</SelectItem>
                            <SelectItem value="ci3">Client Interview 3</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {note.enhanced_content || note.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteNoteId(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteNote}>Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default UnifiedNotesSection;