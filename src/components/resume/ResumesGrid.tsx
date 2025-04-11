
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
  const hasExtractedText = (resumeId: string): boolean => {
    return resumesWithExtractedText && typeof resumesWithExtractedText[resumeId] === 'string' && resumesWithExtractedText[resumeId].length > 0;
  };
  
  // Fonction pour déterminer si un CV a été analysé (a un candidat associé)
  const isResumeAnalyzed = (resume: ResumeData): boolean => {
    return resume.parsed || (resume.candidates && resume.candidates.length > 0);
  };
  
  // Fonction pour obtenir la classe CSS de la carte en fonction de l'état d'analyse
  const getCardClassName = (resume: ResumeData): string => {
    if (selectionMode) return 'card-hover-disabled glass flex flex-col h-full';
    
    if (isResumeAnalyzed(resume)) {
      return 'card-hover glass flex flex-col h-full border-l-4 border-green-500 bg-gradient-to-br from-white to-green-50';
    }
    
    if (hasExtractedText(resume.id)) {
      return 'card-hover glass flex flex-col h-full border-l-4 border-blue-500 bg-gradient-to-br from-white to-blue-50';
    }
    
    return 'card-hover glass flex flex-col h-full';
  };
  
  // Fonction pour obtenir l'étiquette d'état du CV
  const getResumeStatusBadge = (resume: ResumeData) => {
    if (isResumeAnalyzed(resume)) {
      return (
        <div className="mt-2 animate-scale">
          <span className="cv-tag cv-tag-analyzed">
            <FileCheck size={12} className="mr-1" />
            Analysé
          </span>
        </div>
      );
    }
    
    if (hasExtractedText(resume.id)) {
      return (
        <div className="mt-2 animate-scale">
          <span className="cv-tag cv-tag-extracted">
            <FileText size={12} className="mr-1" />
            Texte extrait
          </span>
        </div>
      );
    }
    
    return null;
  };
  
  // Fonction pour gérer le clic sur le bouton "Analyser avec IA"
  const handleAnalyzeClick = async (resumeId: string, resumeText: string) => {
    try {
      setCheckingAnalyzed(prev => ({ ...prev, [resumeId]: true }));
      
      // Vérifier si le CV a déjà été analysé
      const result = await checkResumeAlreadyAnalyzed(resumeId);
      
      if (result.analyzed) {
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
  const confirmOverwrite = () => {
    if (resumeToAnalyze) {
      onAnalyzeResume(resumeToAnalyze.id, resumeToAnalyze.text, true);
      setIsOverwriteDialogOpen(false);
      setResumeToAnalyze(null);
    }
  };
  
  // Fonction pour annuler l'écrasement
  const cancelOverwrite = () => {
    setIsOverwriteDialogOpen(false);
    setResumeToAnalyze(null);
  };
  
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Link to="/resumes/upload" className="glass rounded-xl border-2 border-dashed border-navy/20 flex flex-col items-center justify-center p-6 h-64 hover:border-navy/40 transition-colors hover:bg-navy/5 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-navy/10 flex items-center justify-center text-sand mb-4 shadow-md">
            <Plus size={28} className="text-navy" />
          </div>
          <p className="text-navy-dark font-medium mb-2 text-lg">Importer un CV</p>
          <p className="text-sm text-muted-foreground text-center max-w-[200px]">
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
            <div className="p-5 flex-grow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy to-navy-dark flex items-center justify-center text-white shadow-md">
                  {isResumeAnalyzed(resume) ? (
                    <FileCheck size={20} className="text-white" />
                  ) : (
                    <FileText size={20} className="text-white" />
                  )}
                </div>
                
                {!selectionMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-navy/10">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-border rounded-md p-1 animate-scale">
                      <DropdownMenuItem 
                        onClick={() => onDownload(resume.file_path, resume.file_name, resume.id)}
                        disabled={downloading[resume.id]}
                        className="flex items-center py-2 px-3 cursor-pointer hover:bg-navy/5 rounded-sm"
                      >
                        {downloading[resume.id] ? (
                          <Loader2 size={14} className="mr-2 animate-spin text-navy" />
                        ) : (
                          <Download size={14} className="mr-2 text-navy" />
                        )}
                        Télécharger
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onExtractText(resume.id, resume.file_path)}
                        disabled={extracting[resume.id]}
                        className="flex items-center py-2 px-3 cursor-pointer hover:bg-navy/5 rounded-sm"
                      >
                        {extracting[resume.id] ? (
                          <Loader2 size={14} className="mr-2 animate-spin text-navy" />
                        ) : (
                          <FileText size={14} className="mr-2 text-navy" />
                        )}
                        Extraire le texte
                      </DropdownMenuItem>
                      {hasExtractedText(resume.id) && (
                        <DropdownMenuItem 
                          onClick={() => handleAnalyzeClick(resume.id, resumesWithExtractedText[resume.id])}
                          disabled={analyzing[resume.id] || checkingAnalyzed[resume.id]}
                          className="flex items-center py-2 px-3 cursor-pointer hover:bg-navy/5 rounded-sm"
                        >
                          {analyzing[resume.id] || checkingAnalyzed[resume.id] ? (
                            <Loader2 size={14} className="mr-2 animate-spin text-navy" />
                          ) : (
                            <Brain size={14} className="mr-2 text-navy" />
                          )}
                          Analyser avec IA
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="flex items-center py-2 px-3 cursor-pointer hover:bg-red-50 rounded-sm text-red-600"
                        onClick={() => onDelete(resume.id, resume.file_path)}
                      >
                        <Trash2 size={14} className="mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <h3 className="font-medium text-navy-dark break-all line-clamp-1 mb-1 text-lg" title={resume.file_name}>
                {resume.file_name}
              </h3>
              
              {resume.candidates && resume.candidates.length > 0 ? (
                <p className="text-sm text-navy mb-3 flex items-center">
                  <span className="bg-navy/10 h-6 w-6 rounded-full flex items-center justify-center mr-2">
                    <FileCheck size={12} className="text-navy" />
                  </span>
                  Candidat: {resume.candidates[0].first_name} {resume.candidates[0].last_name}
                </p>
              ) : (
                <p className="text-sm text-amber-600 mb-3 flex items-center">
                  <span className="bg-amber-100 h-6 w-6 rounded-full flex items-center justify-center mr-2">
                    <AlertTriangle size={12} className="text-amber-600" />
                  </span>
                  CV importé
                </p>
              )}
              
              <div className="flex items-center text-xs text-muted-foreground mt-4 bg-gray-50 p-2 rounded-md">
                <Calendar size={12} className="mr-1 text-navy/60" />
                Importé le {resume.created_at ? formatDate(resume.created_at) : 'N/A'}
              </div>
              
              <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                <span>Taille: {(resume.file_size / 1024 / 1024).toFixed(2)} MB</span>
                {getResumeStatusBadge(resume)}
              </div>
            </div>
            
            {!selectionMode && (
              <div className="border-t border-border/10 p-4 flex flex-wrap gap-2 justify-between bg-gradient-to-b from-transparent to-gray-50/50">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="text-xs flex-1 btn-hover-effect bg-navy hover:bg-navy-dark"
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
                  className="text-xs flex-1 btn-hover-effect border-navy/30 text-navy hover:bg-navy/5"
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
                      ? "bg-green-50 border-green-200 hover:bg-green-100 text-green-700" 
                      : "bg-blue-500 hover:bg-blue-600 text-white"}`}
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
                  className="text-xs text-red-600 flex-1 btn-hover-effect hover:bg-red-50 border-red-200"
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
        <DialogContent className="max-w-4xl max-h-[80vh] bg-white p-6 rounded-lg shadow-lg animate-scale">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-navy-dark flex items-center">
              <FileText size={18} className="mr-2 text-navy" />
              Texte extrait du CV
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Voici le texte brut extrait du document PDF.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 border rounded-lg p-4 bg-gray-50 overflow-auto max-h-[50vh] shadow-inner">
            {extractedText ? (
              <pre className="whitespace-pre-wrap text-sm font-mono text-navy-dark">{extractedText}</pre>
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
              className="mr-2 bg-navy hover:bg-navy-dark"
            >
              Copier
            </Button>
            <Button variant="outline" onClick={onCloseTextDialog} className="border-navy/30 text-navy hover:bg-navy/5">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Boîte de dialogue pour la confirmation d'écrasement */}
      <AlertDialog open={isOverwriteDialogOpen} onOpenChange={setIsOverwriteDialogOpen}>
        <AlertDialogContent className="bg-white p-6 rounded-lg shadow-lg animate-scale">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-navy-dark">
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
            <AlertDialogCancel onClick={cancelOverwrite} className="border-navy/30 text-navy hover:bg-navy/5">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOverwrite} className="bg-amber-500 hover:bg-amber-600">
              Refaire l'analyse
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ResumesGrid;
