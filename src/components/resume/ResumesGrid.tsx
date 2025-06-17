import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Download, Loader2, MoreHorizontal, Calendar, Trash2, Brain, FileCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SelectableCard from './SelectableCard';
import { ResumeData } from '@/services/data/resumeDataService';
import { formatDate } from '@/utils/dateFormatter';
import { checkResumeAlreadyAnalyzed } from '@/services/resume/analysisOperations';

interface ResumesGridProps {
  resumes: ResumeData[];
  selectedResumes: string[];
  selectionMode: boolean;
  downloading: Record<string, boolean>;
  extracting: Record<string, boolean>;
  analyzing: Record<string, boolean>;
  extractedText: string | null;
  isTextDialogOpen: boolean;
  onSelect: (resumeId: string) => void;
  onDownload: (filePath: string, fileName: string, resumeId: string) => void;
  onDelete: (resumeId: string, filePath: string) => void;
  onExtractText: (resumeId: string, filePath: string) => void;
  onAnalyzeResume: (resumeId: string, resumeText: string, overwriteExisting?: boolean) => void;
  onCloseTextDialog: () => void;
  resumesWithExtractedText: Record<string, string>;
}

const ResumesGrid: React.FC<ResumesGridProps> = ({
  resumes,
  selectedResumes,
  selectionMode,
  downloading,
  extracting,
  analyzing,
  extractedText,
  isTextDialogOpen,
  onSelect,
  onDownload,
  onDelete,
  onExtractText,
  onAnalyzeResume,
  onCloseTextDialog,
  resumesWithExtractedText
}) => {
  const { toast } = useToast();
  const [resumeToAnalyze, setResumeToAnalyze] = useState<{id: string, text: string} | null>(null);
  const [isOverwriteDialogOpen, setIsOverwriteDialogOpen] = useState(false);
  const [checkingAnalyzed, setCheckingAnalyzed] = useState<Record<string, boolean>>({});
  
  // Fonction d'aide pour vérifier si le texte a été extrait pour un CV spécifique
  function hasExtractedText(resumeId: string): boolean {
    return resumesWithExtractedText && typeof resumesWithExtractedText[resumeId] === 'string' && resumesWithExtractedText[resumeId].length > 0;
  }
  
  // Fonction pour déterminer si un CV a été analysé (a un candidat associé)
  function isResumeAnalyzed(resume: ResumeData): boolean {
    return resume.parsed || (resume.candidates && resume.candidates.length > 0);
  }
  
  // Fonction pour obtenir la classe CSS de la carte en fonction de l'état d'analyse
  function getCardClassName(resume: ResumeData): string {
    if (selectionMode) return 'card-hover-disabled glass-card flex flex-col h-full';
    
    if (isResumeAnalyzed(resume)) {
      return 'card-hover glass-card flex flex-col h-full border-l-4 border-green-500 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-green-50/10 dark:to-green-950/10';
    }
    
    if (hasExtractedText(resume.id)) {
      return 'card-hover glass-card flex flex-col h-full border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-blue-50/10 dark:to-blue-950/10';
    }
    
    return 'card-hover glass-card flex flex-col h-full shadow-md hover:shadow-lg transition-all duration-300';
  }
  
  // Fonction pour obtenir l'étiquette d'état du CV
  function getResumeStatusBadge(resume: ResumeData) {
    if (isResumeAnalyzed(resume)) {
      return (
        <div className="mt-2 animate-scale">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 group-hover:scale-105 transition-all">
            <FileCheck size={12} className="mr-1" />
            Analysé
          </span>
        </div>
      );
    }
    
    if (hasExtractedText(resume.id)) {
      return (
        <div className="mt-2 animate-scale">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 group-hover:scale-105 transition-all">
            <FileText size={12} className="mr-1" />
            Texte extrait
          </span>
        </div>
      );
    }
    
    return null;
  }
  
  // Fonction pour gérer le clic sur le bouton "Analyser avec IA"
  const handleAnalyzeClick = async (resumeId: string, resumeText: string) => {
    try {
      setCheckingAnalyzed(prev => ({ ...prev, [resumeId]: true }));
      
      // Vérifier si le CV a déjà été analysé
      const alreadyAnalyzed = await checkResumeAlreadyAnalyzed(resumeId);
      
      if (alreadyAnalyzed) {
        // Si déjà analysé, demander confirmation pour écraser
        setResumeToAnalyze({ id: resumeId, text: resumeText });
        setIsOverwriteDialogOpen(true);
      } else {
        // Si pas encore analysé, procéder normalement
        onAnalyzeResume(resumeId, resumeText);
      }
    } catch (error) {
      console.error('Error checking if resume was analyzed:', error);
      // En cas d'erreur, procéder quand même à l'analyse
      onAnalyzeResume(resumeId, resumeText);
    } finally {
      setCheckingAnalyzed(prev => ({ ...prev, [resumeId]: false }));
    }
  };
  
  // Fonction pour confirmer l'écrasement des données existantes
  function confirmOverwrite() {
    if (resumeToAnalyze) {
      onAnalyzeResume(resumeToAnalyze.id, resumeToAnalyze.text, true);
      setIsOverwriteDialogOpen(false);
      setResumeToAnalyze(null);
    }
  }
  
  // Fonction pour annuler l'écrasement
  function cancelOverwrite() {
    setIsOverwriteDialogOpen(false);
    setResumeToAnalyze(null);
  }
  
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Link to="/resumes/upload" className="glass-card rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center p-6 h-64 hover:border-primary/40 transition-colors hover:bg-accent/20 animate-fade-in group">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
            <Plus size={28} className="text-primary-foreground" />
          </div>
          <p className="text-foreground font-medium mb-2 text-lg group-hover:text-foreground/80 transition-colors">Importer un CV</p>
          <p className="text-sm text-muted-foreground text-center max-w-[200px] group-hover:text-muted-foreground/70 transition-colors">
            Glissez-déposez ou cliquez pour sélectionner
          </p>
        </Link>
        
        {resumes.map((resume, index) => (
          <SelectableCard
            key={resume.id}
            selected={selectedResumes.includes(resume.id)}
            onSelect={() => onSelect(resume.id)}
            className={getCardClassName(resume)}
            style={{
              animationDelay: `${index * 0.05}s`
            }}
          >
            <div className="p-5 flex-grow group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-primary-foreground shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  {isResumeAnalyzed(resume) ? (
                    <FileCheck size={20} className="text-primary-foreground" />
                  ) : (
                    <FileText size={20} className="text-primary-foreground" />
                  )}
                </div>
                
                {!selectionMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent transition-colors">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 glass-card shadow-lg border border-border rounded-md p-1 animate-scale">
                      <DropdownMenuItem 
                        onClick={() => onDownload(resume.file_path, resume.file_name, resume.id)}
                        disabled={downloading[resume.id]}
                        className="flex items-center py-2 px-3 cursor-pointer hover:bg-accent rounded-sm transition-colors"
                      >
                        {downloading[resume.id] ? (
                          <Loader2 size={14} className="mr-2 animate-spin text-primary" />
                        ) : (
                          <Download size={14} className="mr-2 text-primary" />
                        )}
                        Télécharger
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onExtractText(resume.id, resume.file_path)}
                        disabled={extracting[resume.id]}
                        className="flex items-center py-2 px-3 cursor-pointer hover:bg-accent rounded-sm transition-colors"
                      >
                        {extracting[resume.id] ? (
                          <Loader2 size={14} className="mr-2 animate-spin text-primary" />
                        ) : (
                          <FileText size={14} className="mr-2 text-primary" />
                        )}
                        Extraire le texte
                      </DropdownMenuItem>
                      {hasExtractedText(resume.id) && (
                        <DropdownMenuItem 
                          onClick={() => handleAnalyzeClick(resume.id, resumesWithExtractedText[resume.id])}
                          disabled={analyzing[resume.id] || checkingAnalyzed[resume.id]}
                          className="flex items-center py-2 px-3 cursor-pointer hover:bg-accent rounded-sm transition-colors"
                        >
                          {analyzing[resume.id] || checkingAnalyzed[resume.id] ? (
                            <Loader2 size={14} className="mr-2 animate-spin text-primary" />
                          ) : (
                            <Brain size={14} className="mr-2 text-primary" />
                          )}
                          Analyser avec IA
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="flex items-center py-2 px-3 cursor-pointer hover:bg-destructive/10 rounded-sm text-destructive transition-colors"
                        onClick={() => onDelete(resume.id, resume.file_path)}
                      >
                        <Trash2 size={14} className="mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <h3 className="font-medium text-foreground break-all line-clamp-1 mb-1 text-lg group-hover:text-foreground/80 transition-colors" title={resume.file_name}>
                {resume.file_name}
              </h3>
              
              {resume.candidates && resume.candidates.length > 0 ? (
                <p className="text-sm text-foreground mb-3 flex items-center">
                  <span className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center mr-2 group-hover:bg-primary/20 transition-colors">
                    <FileCheck size={12} className="text-primary" />
                  </span>
                  Candidat: {resume.candidates[0].first_name} {resume.candidates[0].last_name}
                </p>
              ) : (
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-3 flex items-center">
                  <span className="bg-amber-100 dark:bg-amber-900/30 h-6 w-6 rounded-full flex items-center justify-center mr-2 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                    <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
                  </span>
                  CV importé
                </p>
              )}
              
              <div className="flex items-center text-xs text-muted-foreground mt-4 bg-muted/50 p-2 rounded-md group-hover:bg-muted/70 transition-colors">
                <Calendar size={12} className="mr-1 text-primary/60" />
                Importé le {resume.created_at ? formatDate(resume.created_at) : 'N/A'}
              </div>
              
              <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                <span>Taille: {(resume.file_size / 1024 / 1024).toFixed(2)} MB</span>
                {getResumeStatusBadge(resume)}
              </div>
            </div>
            
            {!selectionMode && (
              <div className="border-t border-border/20 p-4 flex flex-wrap gap-2 justify-between bg-gradient-to-b from-transparent to-muted/20 group-hover:to-muted/30 transition-colors">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="text-xs flex-1 btn-hover-effect bg-primary hover:bg-primary/90 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    onDownload(resume.file_path, resume.file_name, resume.id);
                  }}
                  disabled={downloading[resume.id]}
                >
                  {downloading[resume.id] ? (
                    <Loader2 size={14} className="mr-1 animate-spin" />
                  ) : (
                    <Download size={14} className="mr-1" />
                  )}
                  Télécharger
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs flex-1 btn-hover-effect border-border text-foreground hover:bg-accent transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    onExtractText(resume.id, resume.file_path);
                  }}
                  disabled={extracting[resume.id]}
                >
                  {extracting[resume.id] ? (
                    <Loader2 size={14} className="mr-1 animate-spin" />
                  ) : (
                    <FileText size={14} className="mr-1" />
                  )}
                  Extraire texte
                </Button>
                
                {hasExtractedText(resume.id) && (
                  <Button 
                    variant={isResumeAnalyzed(resume) ? "outline" : "default"}
                    size="sm"
                    className={`text-xs flex-1 btn-hover-effect ${isResumeAnalyzed(resume) 
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 transition-colors" 
                      : "bg-blue-500 hover:bg-blue-600 text-white transition-colors"}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleAnalyzeClick(resume.id, resumesWithExtractedText[resume.id]);
                    }}
                    disabled={analyzing[resume.id] || checkingAnalyzed[resume.id]}
                  >
                    {analyzing[resume.id] || checkingAnalyzed[resume.id] ? (
                      <Loader2 size={14} className="mr-1 animate-spin" />
                    ) : (
                      <Brain size={14} className="mr-1" />
                    )}
                    Analyser IA
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs text-destructive flex-1 btn-hover-effect hover:bg-destructive/10 border-destructive/20 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(resume.id, resume.file_path);
                  }}
                >
                  <Trash2 size={14} className="mr-1" />
                  Supprimer
                </Button>
              </div>
            )}
          </SelectableCard>
        ))}
      </div>
      
      {/* Boîte de dialogue pour le texte extrait */}
      <Dialog open={isTextDialogOpen} onOpenChange={onCloseTextDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] glass-card p-6 rounded-lg shadow-lg animate-scale">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center">
              <FileText size={18} className="mr-2 text-primary" />
              Texte extrait du CV
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Voici le texte brut extrait du document PDF.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 border border-border rounded-lg p-4 bg-muted/30 overflow-auto max-h-[50vh] shadow-inner">
            {extractedText ? (
              <pre className="whitespace-pre-wrap text-sm font-mono text-foreground">{extractedText}</pre>
            ) : (
              <p className="text-center text-muted-foreground py-10">Aucun texte extrait</p>
            )}
          </div>
          
          <DialogFooter className="mt-4 flex gap-2">
            <Button 
              onClick={() => {
                if (extractedText) {
                  navigator.clipboard.writeText(extractedText);
                  toast({
                    title: "Texte copié",
                    description: "Le texte a été copié dans le presse-papier",
                  });
                }
              }}
              className="mr-2 bg-primary hover:bg-primary/90 transition-colors"
            >
              Copier
            </Button>
            <Button variant="outline" onClick={onCloseTextDialog} className="border-border text-foreground hover:bg-accent transition-colors">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Boîte de dialogue pour la confirmation d'écrasement */}
      <AlertDialog open={isOverwriteDialogOpen} onOpenChange={setIsOverwriteDialogOpen}>
        <AlertDialogContent className="glass-card p-6 rounded-lg shadow-lg animate-scale">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                CV déjà analysé
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Ce CV a déjà été analysé et un candidat a été créé. Souhaitez-vous refaire l'analyse et écraser les données existantes du candidat ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-2">
            <AlertDialogCancel onClick={cancelOverwrite} className="border-border text-foreground hover:bg-accent transition-colors">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOverwrite} className="bg-amber-500 hover:bg-amber-600 transition-colors">
              Refaire l'analyse
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ResumesGrid;
