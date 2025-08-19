
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CandidateNote, NoteType, candidateNotesService, getNoteTypeLabel } from '@/services/data/candidateNotesService';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PencilLine, Trash2, FileEdit, FilePlus, Check, Loader2, FileText, ListFilter } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InterviewNotesProps {
  candidateId: string;
}

const noteSchema = z.object({
  content: z.string().min(1, { message: 'Le contenu est requis' }),
  note_type: z.enum(['precal', 'ec1', 'ec2'], {
    required_error: "Veuillez sélectionner un type de note",
  }),
});

type NoteFormValues = z.infer<typeof noteSchema>;

// Fonction pour obtenir la couleur de badge selon le type de note
const getNoteTypeBadgeColor = (noteType: NoteType) => {
  switch (noteType) {
    case 'precal': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'ec1': return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
    case 'ec2': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
    case 'global': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const InterviewNotes: React.FC<InterviewNotesProps> = ({ candidateId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingGlobal, setIsGeneratingGlobal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [editNoteType, setEditNoteType] = useState<NoteType>('precal');
  
  // Formulaire de la nouvelle note
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      content: '',
      note_type: 'precal',
    },
  });

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
  
  const handleSubmitNote = async (values: NoteFormValues) => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour ajouter une note",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const result = await candidateNotesService.addNote({
      candidate_id: candidateId,
      user_id: user.id,
      content: values.content,
      note_type: values.note_type,
    });
    
    if (result) {
      form.reset();
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
  
  const handleGenerateGlobalSummary = async () => {
    setIsGeneratingGlobal(true);
    
    const result = await candidateNotesService.generateGlobalSummary(candidateId);
    
    if (result) {
      await loadNotes();
      // Basculer vers l'onglet global après génération
      setActiveTab('global');
    }
    
    setIsGeneratingGlobal(false);
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

  // Filtrer les notes selon l'onglet actif
  const filteredNotes = notes.filter(note => {
    if (activeTab === 'all') return true;
    return note.note_type === activeTab;
  });

  // Vérifier s'il existe déjà une note globale
  const hasGlobalNote = notes.some(note => note.note_type === 'global');
  
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmitNote)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="note_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de note</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type de note" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="precal">Pré-qualification</SelectItem>
                          <SelectItem value="ec1">Entretien 1er Tour</SelectItem>
                          <SelectItem value="ec2">Entretien 2nd Tour</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenu</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Saisissez vos notes d'entretien ici..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
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
              </form>
            </Form>
          </div>
          
          <Separator />
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            {/* Filtres par type de note */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="precal">Pré-qual</TabsTrigger>
                <TabsTrigger value="ec1">1er Tour</TabsTrigger>
                <TabsTrigger value="ec2">2nd Tour</TabsTrigger>
                <TabsTrigger value="global">Global</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Bouton de génération du compte-rendu global */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={handleGenerateGlobalSummary}
                    disabled={isGeneratingGlobal || (notes.length === 0 || (notes.length === 1 && notes[0]?.note_type === 'global'))}
                  >
                    {isGeneratingGlobal ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Générer un compte-rendu global
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {notes.length === 0 
                    ? "Ajoutez des notes d'entretien avant de générer un compte-rendu global" 
                    : "Génère un compte-rendu global basé sur toutes les notes existantes"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Liste des notes */}
          {isLoadingNotes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune note d'entretien pour ce candidat{activeTab !== 'all' ? ' avec ce type de filtre' : ''}</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {filteredNotes.map((note) => (
                  <div 
                    key={note.id} 
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {note.created_at && format(new Date(note.created_at), 'PPP à HH:mm', { locale: fr })}
                        </span>
                        <Badge className={getNoteTypeBadgeColor(note.note_type)}>
                          {getNoteTypeLabel(note.note_type)}
                        </Badge>
                        {note.business_manager && (
                          <Badge variant="outline" className="text-xs">
                            BM: {note.business_manager}
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        {editingNoteId !== note.id && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleStartEdit(note)}
                              disabled={note.note_type === 'global'} // Désactiver l'édition pour les notes globales
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
                        <Select 
                          value={editNoteType} 
                          onValueChange={(value: NoteType) => setEditNoteType(value as NoteType)}
                          disabled={note.note_type === 'global'} // Désactiver le changement de type pour les notes globales
                        >
                          <SelectTrigger className="w-full mb-2">
                            <SelectValue placeholder="Type de note" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="precal">Pré-qualification</SelectItem>
                            <SelectItem value="ec1">Entretien 1er Tour</SelectItem>
                            <SelectItem value="ec2">Entretien 2nd Tour</SelectItem>
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
                      <>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {/* Afficher le contenu amélioré s'il existe, sinon afficher le contenu original */}
                          {note.enhanced_content || note.content}
                        </div>
                        
                        {!note.enhanced_content && note.note_type !== 'global' && (
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
