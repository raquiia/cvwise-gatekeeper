import React, { useState, useEffect } from 'react';
import { 
  Upload, Search, FileText, Eye, Download, 
  Trash2, Plus, Calendar, ChevronDown, MoreHorizontal, Loader2, 
  AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getUserResumes, deleteResume, ResumeData, uploadResume, downloadResume } from '@/services/resumeService';
import { supabase } from '@/integrations/supabase/client';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/utils/dateFormatter';
import { resumeStorageService } from '@/services/storage/resumeStorageService';

type Resume = ResumeData;

const DebugUploadButton = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  
  const handleTestUpload = async () => {
    setUploading(true);
    try {
      const testContent = "This is a test CV file";
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test-cv.txt', { type: 'text/plain' });
      
      toast({
        title: "Test en cours",
        description: "Tentative de téléchargement d'un fichier test...",
      });
      
      const result = await uploadResume(testFile, userId);
      
      if (result) {
        toast({
          title: "Test réussi",
          description: "Le test de téléchargement a réussi. ID: " + result.id,
        });
      } else {
        throw new Error("Le test de téléchargement a échoué");
      }
    } catch (error: any) {
      console.error('Test upload failed:', error);
      toast({
        title: "Test échoué",
        description: error.message || "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="ml-2" 
      onClick={handleTestUpload}
      disabled={uploading}
    >
      {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
      Tester Upload
    </Button>
  );
};

const Resumes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
        const loadPromise = new Promise<void>(async (resolve, reject) => {
          try {
            await ensureResumesBucketExists().catch(err => console.warn('Bucket initialization warning:', err));
            
            const data = await getUserResumes(user.id);
            setResumes(data || []);
            resolve();
          } catch (error: any) {
            console.error('Error loading resumes:', error);
            reject(new Error(error?.message || 'Une erreur est survenue lors du chargement des CV'));
          }
        });
        
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Timeout lors du chargement des CV"));
          }, 8000);
        });
        
        await Promise.race([loadPromise, timeoutPromise]);
      } catch (error: any) {
        console.error('Error during initialization or loading:', error);
        setErrorMessage(error.message || "Une erreur est survenue lors du chargement des CV");
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
  
  const handleAnalyzeResume = async (resumeId: string) => {
    try {
      toast({
        title: "Analyse en cours",
        description: "L'analyse du CV a démarré...",
      });
      
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { resumeId }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: "Analyse terminée",
          description: "Le CV a été analysé avec succès",
        });
        
        await loadResumes();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      toast({
        title: "Échec de l'analyse",
        description: error.message || "Une erreur s'est produite lors de l'analyse du CV",
        variant: "destructive",
      });
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
  
  const handleRetry = () => {
    loadResumes();
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-navy-dark mb-1">CV</h1>
            <p className="text-muted-foreground">
              Gérez tous les CV importés dans le système
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Rechercher un CV..."
                className="input-field pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex">
              <Link to="/resumes/upload">
                <Button className="button-primary">
                  <Upload size={18} className="mr-2" />
                  Importer un CV
                </Button>
              </Link>
              
              {user && <DebugUploadButton userId={user.id} />}
            </div>
          </div>
        </div>
        
        <div className="glass rounded-lg p-3 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center">
            <span className="text-sm font-medium text-navy-dark mr-2">Filtres:</span>
          </div>
          
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 text-sm">
                  <Calendar size={16} className="mr-1" />
                  <span>Date</span>
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Aujourd'hui</DropdownMenuItem>
                <DropdownMenuItem>Cette semaine</DropdownMenuItem>
                <DropdownMenuItem>Ce mois-ci</DropdownMenuItem>
                <DropdownMenuItem>Tous</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 text-sm">
                  <span>Statut</span>
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
                  Tous
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('analyzed')}>
                  Analysés
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('pending')}>
                  En attente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="ml-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 text-muted-foreground"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus(null);
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={40} className="text-navy animate-spin mb-4" />
            <p className="text-navy-dark font-medium">Chargement des CV...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Si le chargement persiste trop longtemps, 
              <Button variant="link" className="p-0 h-auto text-sm" onClick={() => window.location.reload()}>
                essayez de rafraîchir la page
              </Button>
            </p>
          </div>
        )}
        
        {!isLoading && errorMessage && (
          <div className="glass rounded-xl p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-navy-dark mb-2">Une erreur est survenue</h2>
            <p className="text-muted-foreground mb-6">
              {errorMessage}
            </p>
            <Button onClick={handleRetry} className="button-primary flex items-center">
              <RefreshCw size={16} className="mr-2" />
              Réessayer
            </Button>
          </div>
        )}
        
        {!isLoading && !errorMessage && resumes.length === 0 && (
          <div className="glass rounded-xl p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-navy/10 flex items-center justify-center mb-4">
              <FileText size={32} className="text-navy" />
            </div>
            <h2 className="text-xl font-semibold text-navy-dark mb-2">Aucun CV trouvé</h2>
            <p className="text-muted-foreground mb-6">
              Vous n'avez pas encore importé de CV dans le système.
            </p>
            <Link to="/resumes/upload">
              <Button className="button-primary">
                <Upload size={18} className="mr-2" />
                Importer un CV
              </Button>
            </Link>
          </div>
        )}
        
        {!isLoading && !errorMessage && resumes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link to="/resumes/upload" className="glass rounded-xl border-2 border-dashed border-navy/20 flex flex-col items-center justify-center p-6 h-64 hover:border-navy/40 transition-colors">
              <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center text-sand">
                <Plus size={24} className="text-navy" />
              </div>
              <p className="text-navy-dark font-medium mb-1">Importer un CV</p>
              <p className="text-sm text-muted-foreground text-center">
                Glissez-déposez ou cliquez pour sélectionner
              </p>
            </Link>
            
            {filteredResumes.map((resume) => (
              <div 
                key={resume.id} 
                className="glass rounded-xl overflow-hidden card-hover flex flex-col"
              >
                <div className="p-4 flex-grow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-sand">
                      <FileText size={18} />
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleDownloadResume(resume.file_path, resume.file_name, resume.id)}
                          disabled={downloading[resume.id]}
                        >
                          {downloading[resume.id] ? (
                            <Loader2 size={14} className="mr-2 animate-spin" />
                          ) : (
                            <Download size={14} className="mr-2" />
                          )}
                          Télécharger
                        </DropdownMenuItem>
                        {!resume.parsed && (
                          <DropdownMenuItem onClick={() => handleAnalyzeResume(resume.id)}>
                            <Eye size={14} className="mr-2" />
                            Analyser
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteResume(resume.id, resume.file_path)}
                        >
                          <Trash2 size={14} className="mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="font-medium text-navy-dark break-all line-clamp-1 mb-1" title={resume.file_name}>
                    {resume.file_name}
                  </h3>
                  
                  {resume.candidates && resume.candidates.length > 0 ? (
                    <p className="text-sm text-muted-foreground mb-3">
                      Candidat: {resume.candidates[0].first_name} {resume.candidates[0].last_name}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600 mb-3 flex items-center">
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none">
                        <path d="M12 9v4m0 4h.01M5.07 19H19a2 2 0 0 0 1.75-2.98L13.75 4.99a2 2 0 0 0-3.5 0L3.25 16.02A2 2 0 0 0 5.07 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      En attente d'analyse
                    </p>
                  )}
                  
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar size={12} className="mr-1" />
                    Importé le {resume.created_at ? formatDate(resume.created_at) : 'N/A'}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    Taille: {(resume.file_size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                
                <div className="border-t border-border/10 p-3 flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => resume.parsed ? 
                      navigate(`/candidates/${resume.candidates?.[0]?.id}`) :
                      handleAnalyzeResume(resume.id)
                    }
                  >
                    <Eye size={14} className="mr-1" />
                    {resume.parsed ? "Voir candidat" : "Analyser"}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleDownloadResume(resume.file_path, resume.file_name, resume.id)}
                    disabled={downloading[resume.id]}
                  >
                    {downloading[resume.id] ? (
                      <Loader2 size={14} className="mr-1 animate-spin" />
                    ) : (
                      <Download size={14} className="mr-1" />
                    )}
                    Télécharger
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Resumes;
