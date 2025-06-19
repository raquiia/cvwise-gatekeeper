import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { candidateService } from '@/services/data/candidateService';
import { CandidateData } from '@/services/data/candidateService';
import { ArrowLeft, Briefcase, Edit, Sparkles, Brain } from 'lucide-react';
import { processCandidateData } from '@/utils/candidateUtils';
import { toast } from '@/hooks/use-toast';
import { getCompleteCandidateData } from '@/services/resume/candidateDataService';
import { aiDataMigrationService } from '@/services/data/aiDataMigrationService';
import { useAuth } from '@/context/AuthContext';

// Import the component tabs
import ProfileTab from '@/components/candidates/detail/ProfileTab';
import ExperienceTab from '@/components/candidates/detail/ExperienceTab';
import EducationTab from '@/components/candidates/detail/EducationTab';
import DetailsTab from '@/components/candidates/detail/DetailsTab';
import NotesTab from '@/components/candidates/detail/NotesTab';
import AIAnalysisTab from '@/components/candidates/detail/AIAnalysisTab';
import CandidateLoading from '@/components/candidates/detail/CandidateLoading';
import CandidateError from '@/components/candidates/detail/CandidateError';
import DataMissingAlert from '@/components/candidates/detail/DataMissingAlert';
import StatusSelector from '@/components/candidates/detail/StatusSelector';
import ExportProfileButton from '@/components/candidates/detail/ExportProfileButton';
import DebugAIScoreButton from '@/components/candidates/detail/DebugAIScoreButton';

const CandidateDetail = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [dataIncompletenessDetected, setDataIncompletenessDetected] = useState(false);

  // Stable function that doesn't depend on changing state
  const fetchCandidateData = useCallback(async (currentCandidateId: string, currentUser: any) => {
    if (!currentCandidateId) {
      console.error("❌ CandidateDetail: No candidate ID provided");
      setError("Identifiant de candidat manquant");
      setLoading(false);
      return;
    }

    if (!currentUser) {
      console.log("❌ CandidateDetail: User not authenticated");
      setError("Vous devez être connecté pour voir ce candidat");
      setLoading(false);
      return;
    }

    try {
      console.log("🔄 CandidateDetail: Starting data fetch for ID:", currentCandidateId);
      console.log("🔐 Current user:", { id: currentUser.id, email: currentUser.email });
      
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Le chargement prend trop de temps')), 30000)
      );
      
      const dataPromise = getCompleteCandidateData(currentCandidateId);
      
      const data = await Promise.race([dataPromise, timeoutPromise]) as CandidateData | null;
      
      if (!data) {
        console.log("📭 CandidateDetail: Candidate not found:", currentCandidateId);
        setError("Candidat non trouvé ou vous n'avez pas accès à ce candidat");
      } else {
        console.log("✅ CandidateDetail: Processing candidate data...");
        
        // Process the data to ensure arrays and properties are correctly formatted
        const processedData = processCandidateData(data);
        
        console.log("📋 CandidateDetail: Data processed successfully:", {
          id: processedData.id,
          first_name: processedData.first_name,
          last_name: processedData.last_name,
          hasAIData: !!(processedData.ai_score || processedData.ai_explanation)
        });
        
        // Check data completeness
        const hasEmptyExperiences = !processedData.experiences || 
          (Array.isArray(processedData.experiences) && processedData.experiences.length === 0);
        const hasEmptyEducation = !processedData.education || 
          (Array.isArray(processedData.education) && processedData.education.length === 0);
        const hasEmptyLanguages = !processedData.languages || 
          (Array.isArray(processedData.languages) && processedData.languages.length === 0);
        
        const hasIncompleteData = hasEmptyExperiences || hasEmptyEducation || hasEmptyLanguages;
        
        console.log("🔍 CandidateDetail: Data completeness check:", {
          experiences: !hasEmptyExperiences,
          education: !hasEmptyEducation,
          languages: !hasEmptyLanguages,
          isComplete: !hasIncompleteData
        });
        
        setDataIncompletenessDetected(hasIncompleteData);
        setCandidate(processedData);
        
        console.log("🎯 CandidateDetail: Successfully set candidate state");
      }
    } catch (err: any) {
      console.error("❌ CandidateDetail: Error loading candidate:", err);
      
      // Improve error message based on the error type
      if (err.message?.includes('Timeout')) {
        setError("Le chargement prend trop de temps. Veuillez réessayer.");
      } else if (err.message?.includes('not authorized') || err.message?.includes('Access denied')) {
        setError("Vous n'avez pas accès à ce candidat ou votre session a expiré.");
      } else if (err.message?.includes('not found')) {
        setError("Ce candidat n'existe pas ou n'est plus disponible.");
      } else if (err.message?.includes('not authenticated')) {
        setError("Votre session a expiré. Veuillez vous reconnecter.");
      } else {
        setError(`Erreur lors du chargement: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Separate authentication check effect
  useEffect(() => {
    console.log("🔐 CandidateDetail: Auth check - loading:", authLoading, "user:", !!user);
    
    if (!authLoading && !user) {
      console.log("❌ CandidateDetail: User not authenticated, redirecting");
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour voir les détails du candidat",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  // Separate data fetching effect
  useEffect(() => {
    console.log("🔄 CandidateDetail: Data fetch effect triggered", {
      authLoading,
      hasUser: !!user,
      candidateId
    });
    
    // Only fetch when auth is ready, user is authenticated, and we have a candidate ID
    if (!authLoading && user && candidateId) {
      console.log("✅ CandidateDetail: Conditions met, starting fetch");
      fetchCandidateData(candidateId, user);
    } else {
      console.log("⏳ CandidateDetail: Waiting for auth or missing candidateId");
    }
  }, [authLoading, user, candidateId, fetchCandidateData]);

  // Stable status change handler
  const handleStatusChange = useCallback((newStatus: string) => {
    setCandidate(prevCandidate => {
      if (prevCandidate) {
        return {
          ...prevCandidate,
          detailed_status: newStatus
        };
      }
      return prevCandidate;
    });
  }, []);

  // Enhanced refresh function
  const handleRefreshWithAIScore = useCallback(async () => {
    console.log('🔄 CandidateDetail: Enhanced refresh requested');
    
    if (candidateId && user) {
      await fetchCandidateData(candidateId, user);
    }
  }, [candidateId, user, fetchCandidateData]);

  // Show loading while checking authentication
  if (authLoading) {
    console.log("🔄 CandidateDetail: Showing auth loading state");
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <CandidateLoading />
        </div>
      </Layout>
    );
  }

  // Don't render if user is not authenticated (redirect is handled in useEffect)
  if (!user) {
    console.log("❌ CandidateDetail: No user, not rendering");
    return null;
  }

  if (loading) {
    console.log("🔄 CandidateDetail: Showing candidate loading state");
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <CandidateLoading />
        </div>
      </Layout>
    );
  }

  if (error || !candidate) {
    console.log("❌ CandidateDetail: Showing error state:", error);
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <CandidateError errorMessage={error} />
        </div>
      </Layout>
    );
  }

  console.log("✅ CandidateDetail: Rendering candidate details");

  return (
    <Layout className="bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground mb-4 hover:bg-accent/50 transition-all duration-300 group"
            onClick={() => navigate('/candidates')}
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="border-b border-transparent group-hover:border-muted-foreground transition-colors duration-300">Retour aux candidats</span>
          </Button>
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between">
            <div className="relative animate-fade-in">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400">
                {candidate?.first_name} {candidate?.last_name}
              </h1>
              <div className="absolute -bottom-1 left-0 w-1/4 h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
              <StatusSelector 
                candidateId={candidate.id || ''} 
                onStatusChange={handleStatusChange} 
              />
              
              <Button 
                variant="outline"
                onClick={() => navigate(`/candidates/${candidateId}/job-match`)}
                className="btn-modern text-foreground border-border/60 hover:border-primary/30 hover:bg-accent/80 transition-all duration-300 group"
              >
                <Briefcase size={16} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span>Match d'emploi</span>
              </Button>
              
              <DebugAIScoreButton candidateId={candidate.id || ''} />
              
              <ExportProfileButton candidate={candidate} />
            </div>
          </div>
        </div>
        
        {dataIncompletenessDetected && (
          <DataMissingAlert 
            candidateName={`${candidate?.first_name} ${candidate?.last_name}`} 
            resumeId={candidate?.resume_id}
            onReanalysisComplete={handleRefreshWithAIScore}
          />
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <div className="relative">
            <TabsList className="w-full md:w-auto glass-card px-1 py-1 rounded-xl mb-6 overflow-hidden shadow-lg border-border/50">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-teal-500/5 opacity-70 pointer-events-none"></div>
              <TabsTrigger 
                value="profile" 
                className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-blue-600/90 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 text-foreground hover:bg-accent/50"
              >
                Profil
              </TabsTrigger>
              <TabsTrigger 
                value="ai-analysis" 
                className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-blue-600/90 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 text-foreground hover:bg-accent/50"
              >
                <Brain size={16} className="mr-2" />
                Analyse IA
              </TabsTrigger>
              <TabsTrigger 
                value="experience" 
                className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-blue-600/90 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 text-foreground hover:bg-accent/50"
              >
                Expérience
              </TabsTrigger>
              <TabsTrigger 
                value="education" 
                className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-blue-600/90 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 text-foreground hover:bg-accent/50"
              >
                Formation
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-blue-600/90 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 text-foreground hover:bg-accent/50"
              >
                Notes
              </TabsTrigger>
              <TabsTrigger 
                value="details" 
                className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-blue-600/90 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 text-foreground hover:bg-accent/50"
              >
                Détails
              </TabsTrigger>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500 opacity-30"></div>
            </TabsList>
          </div>
          
          {candidate && (
            <>
              <TabsContent 
                value="profile"
                className="animate-fade-in rounded-xl relative overflow-hidden glass-card shadow-lg border-border/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
                <ProfileTab 
                  candidate={candidate} 
                  isLoading={loading}
                  onRefresh={handleRefreshWithAIScore}
                />
              </TabsContent>
              
              <TabsContent 
                value="ai-analysis"
                className="animate-fade-in rounded-xl relative overflow-hidden glass-card shadow-lg border-border/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
                <AIAnalysisTab 
                  candidate={candidate} 
                  isLoading={loading}
                  onRefresh={handleRefreshWithAIScore}
                />
              </TabsContent>
              
              <TabsContent 
                value="experience"
                className="animate-fade-in rounded-xl relative overflow-hidden glass-card shadow-lg border-border/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
                <ExperienceTab candidate={candidate} />
              </TabsContent>
              
              <TabsContent 
                value="education"
                className="animate-fade-in rounded-xl relative overflow-hidden glass-card shadow-lg border-border/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
                <EducationTab candidate={candidate} />
              </TabsContent>
              
              <TabsContent 
                value="notes"
                className="animate-fade-in rounded-xl relative overflow-hidden glass-card shadow-lg border-border/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
                <NotesTab candidate={candidate} onDataUpdate={handleRefreshWithAIScore} />
              </TabsContent>
              
              <TabsContent 
                value="details"
                className="animate-fade-in rounded-xl relative overflow-hidden glass-card shadow-lg border-border/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
                <DetailsTab candidate={candidate} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default CandidateDetail;
