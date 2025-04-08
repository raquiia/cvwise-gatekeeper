
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { 
  getUserResumes, 
  deleteResume, 
  downloadResume, 
  extractResumeText,
  analyzeResume,
  ResumeData 
} from '@/services/resumeService';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import ResumesHeader from '@/components/resume/ResumesHeader';
import ResumesFilters from '@/components/resume/ResumesFilters';
import SelectionBar from '@/components/resume/SelectionBar';
import ResumesGrid from '@/components/resume/ResumesGrid';
import NoResumesState from '@/components/resume/NoResumesState';
import ErrorState from '@/components/resume/ErrorState';
import LoadingState from '@/components/resume/LoadingState';

const Resumes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [extracting, setExtracting] = useState<Record<string, boolean>>({});
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [resumesWithExtractedText, setResumesWithExtractedText] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    const initAndLoad = async () => {
      if (!user) {
        setErrorMessage("Vous devez être connecté pour voir vos CV");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setErrorMessage(null);
      
      try {
        await ensureResumesBucketExists();
        
        const data = await getUserResumes(user.id);
        setResumes(data || []);
      } catch (error: any) {
        console.error('Error loading resumes:', error);
        setErrorMessage(error?.message || 'Une erreur est survenue lors du chargement des CV');
      } finally {
        setIsLoading(false);
      }
    };
    
    initAndLoad();
  }, [user]);
  
  const loadResumes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      console.log('Loading resumes for user:', user.id);
      const data = await getUserResumes(user.id);
      setResumes(data || []);
    } catch (error: any) {
      console.error('Error loading resumes:', error);
      setErrorMessage(error?.message || 'Une erreur est survenue lors du chargement des CV');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadResume = async (filePath: string, fileName: string, resumeId: string) => {
    try {
      console.log('Downloading file:', filePath);
      setDownloading(prev => ({ ...prev, [resumeId]: true }));
      
      toast({
        title: "Téléchargement en cours",
        description: "Veuillez patienter pendant le téléchargement du fichier...",
      });
      
      const success = await downloadResume(filePath, fileName);
      
      if (success) {
        toast({
          title: "Téléchargement réussi",
          description: `Le fichier "${fileName}" a été téléchargé avec succès`,
        });
      } else {
        throw new Error("Erreur lors du téléchargement du fichier");
      }
    } catch (error: any) {
      console.error('Error downloading resume:', error);
      toast({
        title: "Échec du téléchargement",
        description: error.message || "Une erreur s'est produite lors du téléchargement du CV",
        variant: "destructive",
      });
    } finally {
      setDownloading(prev => ({ ...prev, [resumeId]: false }));
    }
  };

  const handleDeleteResume = async (resumeId: string, filePath: string) => {
    try {
      const success = await deleteResume(resumeId, filePath);
      
      if (success) {
        toast({
          title: "CV supprimé",
          description: "Le CV a été supprimé avec succès",
        });
        
        setResumes(prev => prev.filter(resume => resume.id !== resumeId));
        
        // Supprimer également le texte extrait s'il existe
        if (resumesWithExtractedText[resumeId]) {
          setResumesWithExtractedText(prev => {
            const newState = { ...prev };
            delete newState[resumeId];
            return newState;
          });
        }
      } else {
        throw new Error("Échec de la suppression du CV");
      }
    } catch (error: any) {
      console.error('Error deleting resume:', error);
      toast({
        title: "Échec de la suppression",
        description: error.message || "Une erreur s'est produite lors de la suppression du CV",
        variant: "destructive",
      });
    }
  };

  const handleExtractText = async (resumeId: string, filePath: string) => {
    try {
      console.log('Extracting text from resume:', resumeId);
      setExtracting(prev => ({ ...prev, [resumeId]: true }));
      
      toast({
        title: "Extraction en cours",
        description: "Veuillez patienter pendant l'extraction du texte..."
      });
      
      const result = await extractResumeText(resumeId, filePath);
      
      if (result.success && result.text) {
        setExtractedText(result.text);
        setIsTextDialogOpen(true);
        
        // Stocker le texte extrait pour l'utiliser plus tard
        setResumesWithExtractedText(prev => ({
          ...prev,
          [resumeId]: result.text || ''
        }));
        
        toast({
          title: "Extraction réussie",
          description: "Le texte a été extrait avec succès. Vous pouvez maintenant analyser ce CV avec l'IA.",
        });
      } else {
        throw new Error(result.message || "Erreur lors de l'extraction du texte");
      }
    } catch (error: any) {
      console.error('Error extracting resume text:', error);
      toast({
        title: "Échec de l'extraction",
        description: error.message || "Une erreur s'est produite lors de l'extraction du texte",
        variant: "destructive",
      });
    } finally {
      setExtracting(prev => ({ ...prev, [resumeId]: false }));
    }
  };
  
  const handleAnalyzeResume = async (resumeId: string, resumeText: string) => {
    try {
      console.log('Analyzing resume with AI:', resumeId);
      setAnalyzing(prev => ({ ...prev, [resumeId]: true }));
      
      toast({
        title: "Analyse en cours",
        description: "Veuillez patienter pendant l'analyse du CV avec l'IA..."
      });
      
      const result = await analyzeResume(resumeId, resumeText);
      
      if (result.success) {
        toast({
          title: "Analyse réussie",
          description: "Le CV a été analysé avec succès et un candidat a été créé"
        });
        
        // Recharger les CV pour afficher le candidat associé
        await loadResumes();
        
        // Rediriger vers la page du candidat si un ID est retourné
        if (result.candidateId) {
          navigate(`/candidates/${result.candidateId}`);
        }
      } else {
        throw new Error(result.message || "Erreur lors de l'analyse du CV");
      }
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      toast({
        title: "Échec de l'analyse",
        description: error.message || "Une erreur s'est produite lors de l'analyse du CV",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(prev => ({ ...prev, [resumeId]: false }));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedResumes.length === 0) return;
    
    setIsProcessingBatch(true);
    setOpenDeleteDialog(false);
    
    try {
      toast({
        title: "Suppression en cours",
        description: `Suppression de ${selectedResumes.length} CV démarrée...`,
      });
      
      let successCount = 0;
      const resumesToDelete = resumes.filter(resume => selectedResumes.includes(resume.id));
      
      for (const resume of resumesToDelete) {
        try {
          const success = await deleteResume(resume.id, resume.file_path);
          if (success) {
            successCount++;
          }
        } catch (error) {
          console.error(`Error deleting resume ${resume.id}:`, error);
        }
      }
      
      toast({
        title: "Suppression terminée",
        description: `${successCount} sur ${selectedResumes.length} CV ont été supprimés avec succès`,
      });
      
      setResumes(prev => prev.filter(resume => !selectedResumes.includes(resume.id)));
      setSelectedResumes([]);
      setSelectionMode(false);
    } catch (error: any) {
      console.error('Error in batch deletion:', error);
      toast({
        title: "Échec de la suppression groupée",
        description: error.message || "Une erreur s'est produite lors de la suppression des CV",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const toggleResumeSelection = (resumeId: string) => {
    setSelectedResumes(prev => {
      if (prev.includes(resumeId)) {
        return prev.filter(id => id !== resumeId);
      } else {
        return [...prev, resumeId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedResumes.length === filteredResumes.length) {
      setSelectedResumes([]);
    } else {
      setSelectedResumes(filteredResumes.map(resume => resume.id));
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedResumes([]);
  };

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = !searchQuery 
      || (resume.candidates?.[0]?.first_name && resume.candidates[0].first_name.toLowerCase().includes(searchQuery.toLowerCase()))
      || (resume.candidates?.[0]?.last_name && resume.candidates[0].last_name.toLowerCase().includes(searchQuery.toLowerCase()))
      || resume.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !selectedStatus || 
      (selectedStatus === 'analyzed' && resume.parsed) || 
      (selectedStatus === 'pending' && !resume.parsed);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        <ResumesHeader userId={user?.id} />
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Rechercher un CV..."
            className="input-field pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <ResumesFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          resumesCount={resumes.length}
          onEnableSelection={() => setSelectionMode(true)}
          selectionMode={selectionMode}
        />
        
        {selectionMode && (
          <>
            <SelectionBar
              selectedCount={selectedResumes.length}
              totalCount={filteredResumes.length}
              onToggleSelectAll={toggleSelectAll}
              isAllSelected={selectedResumes.length === filteredResumes.length && filteredResumes.length > 0}
            />
            
            <div className="flex gap-2 mb-6">
              <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    disabled={selectedResumes.length === 0 || isProcessingBatch}
                  >
                    {isProcessingBatch ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Trash2 size={16} className="mr-2" />
                    )}
                    Supprimer ({selectedResumes.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmation de suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer {selectedResumes.length} CV ? Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700">
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button 
                variant="outline"
                onClick={cancelSelection}
              >
                Annuler
              </Button>
            </div>
          </>
        )}
        
        {isLoading && <LoadingState />}
        
        {!isLoading && errorMessage && <ErrorState errorMessage={errorMessage} onRetry={loadResumes} />}
        
        {!isLoading && !errorMessage && resumes.length === 0 && <NoResumesState />}
        
        {!isLoading && !errorMessage && resumes.length > 0 && (
          <ResumesGrid
            resumes={filteredResumes}
            selectedResumes={selectedResumes}
            selectionMode={selectionMode}
            downloading={downloading}
            extracting={extracting}
            analyzing={analyzing}
            extractedText={extractedText}
            isTextDialogOpen={isTextDialogOpen}
            onSelect={toggleResumeSelection}
            onDownload={handleDownloadResume}
            onDelete={handleDeleteResume}
            onExtractText={handleExtractText}
            onAnalyzeResume={handleAnalyzeResume}
            onCloseTextDialog={() => setIsTextDialogOpen(false)}
            resumesWithExtractedText={resumesWithExtractedText}
          />
        )}
      </div>
    </Layout>
  );
};

export default Resumes;
