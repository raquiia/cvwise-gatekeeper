
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Download, Loader2, MoreHorizontal, Calendar, Trash2, Brain, FileCheck } from 'lucide-react';
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
import SelectableCard from './SelectableCard';
import { ResumeData } from '@/services/data/resumeDataService';
import { formatDate } from '@/utils/dateFormatter';

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
  onAnalyzeResume: (resumeId: string, resumeText: string) => void;
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
    if (selectionMode) return 'card-hover-disabled glass flex flex-col';
    
    if (isResumeAnalyzed(resume)) {
      return 'card-hover glass flex flex-col border-l-4 border-green-500 bg-green-50';
    }
    
    if (hasExtractedText(resume.id)) {
      return 'card-hover glass flex flex-col border-l-4 border-blue-500 bg-blue-50';
    }
    
    return 'card-hover glass flex flex-col';
  };
  
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Link to="/resumes/upload" className="glass rounded-xl border-2 border-dashed border-navy/20 flex flex-col items-center justify-center p-6 h-64 hover:border-navy/40 transition-colors">
          <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center text-sand">
            <Plus size={24} className="text-navy" />
          </div>
          <p className="text-navy-dark font-medium mb-1 mt-4">Importer un CV</p>
          <p className="text-sm text-muted-foreground text-center">
            Glissez-déposez ou cliquez pour sélectionner
          </p>
        </Link>
        
        {resumes.map((resume) => (
          <SelectableCard
            key={resume.id}
            selected={selectedResumes.includes(resume.id)}
            onSelect={() => onSelect(resume.id)}
            className={getCardClassName(resume)}
          >
            <div className="p-4 flex-grow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-sand">
                  {isResumeAnalyzed(resume) ? (
                    <FileCheck size={18} className="text-green-500" />
                  ) : (
                    <FileText size={18} />
                  )}
                </div>
                
                {!selectionMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => onDownload(resume.file_path, resume.file_name, resume.id)}
                        disabled={downloading[resume.id]}
                      >
                        {downloading[resume.id] ? (
                          <Loader2 size={14} className="mr-2 animate-spin" />
                        ) : (
                          <Download size={14} className="mr-2" />
                        )}
                        Télécharger
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onExtractText(resume.id, resume.file_path)}
                        disabled={extracting[resume.id]}
                      >
                        {extracting[resume.id] ? (
                          <Loader2 size={14} className="mr-2 animate-spin" />
                        ) : (
                          <FileText size={14} className="mr-2" />
                        )}
                        Extraire le texte
                      </DropdownMenuItem>
                      {hasExtractedText(resume.id) && (
                        <DropdownMenuItem 
                          onClick={() => onAnalyzeResume(resume.id, resumesWithExtractedText[resume.id])}
                          disabled={analyzing[resume.id]}
                        >
                          {analyzing[resume.id] ? (
                            <Loader2 size={14} className="mr-2 animate-spin" />
                          ) : (
                            <Brain size={14} className="mr-2" />
                          )}
                          Analyser avec IA
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => onDelete(resume.id, resume.file_path)}
                      >
                        <Trash2 size={14} className="mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <h3 className="font-medium text-navy-dark break-all line-clamp-1 mb-1" title={resume.file_name}>
                {resume.file_name}
              </h3>
              
              {resume.candidates && resume.candidates.length > 0 ? (
                <p className="text-sm text-navy mb-3">
                  Candidat: {resume.candidates[0].first_name} {resume.candidates[0].last_name}
                </p>
              ) : (
                <p className="text-sm text-amber-600 mb-3 flex items-center">
                  <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v4m0 4h.01M5.07 19H19a2 2 0 0 0 1.75-2.98L13.75 4.99a2 2 0 0 0-3.5 0L3.25 16.02A2 2 0 0 0 5.07 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  CV importé
                </p>
              )}
              
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar size={12} className="mr-1" />
                Importé le {resume.created_at ? formatDate(resume.created_at) : 'N/A'}
              </div>
              
              <div className="text-xs text-muted-foreground mt-1">
                Taille: {(resume.file_size / 1024 / 1024).toFixed(2)} MB
              </div>
              
              {isResumeAnalyzed(resume) && (
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    <FileCheck size={12} className="mr-1" />
                    Analysé
                  </span>
                </div>
              )}
              
              {!isResumeAnalyzed(resume) && hasExtractedText(resume.id) && (
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    <FileText size={12} className="mr-1" />
                    Texte extrait
                  </span>
                </div>
              )}
            </div>
            
            {!selectionMode && (
              <div className="border-t border-border/10 p-3 flex flex-wrap gap-2 justify-between">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="text-xs flex-1"
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
                  className="text-xs flex-1"
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
                    className={`text-xs flex-1 ${isResumeAnalyzed(resume) ? "bg-green-50 border-green-200 hover:bg-green-100" : "bg-blue-500 hover:bg-blue-600"}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onAnalyzeResume(resume.id, resumesWithExtractedText[resume.id]);
                    }}
                    disabled={analyzing[resume.id]}
                  >
                    {analyzing[resume.id] ? (
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
                  className="text-xs text-red-600 flex-1"
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
      
      <Dialog open={isTextDialogOpen} onOpenChange={onCloseTextDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Texte extrait du CV</DialogTitle>
            <DialogDescription>
              Voici le texte brut extrait du document PDF.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 border rounded p-3 bg-gray-50 overflow-auto max-h-[50vh]">
            {extractedText ? (
              <pre className="whitespace-pre-wrap text-sm font-mono">{extractedText}</pre>
            ) : (
              <p className="text-center text-muted-foreground">Aucun texte extrait</p>
            )}
          </div>
          
          <DialogFooter>
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
              className="mr-2"
            >
              Copier
            </Button>
            <Button variant="outline" onClick={onCloseTextDialog}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResumesGrid;
