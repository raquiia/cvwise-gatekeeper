import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { candidateService } from '@/services/data/candidateService';
import { CandidateData } from '@/services/data/candidateService';
import { ArrowLeft, Briefcase, FileText, Edit, Sparkles } from 'lucide-react';
import { processCandidateData } from '@/utils/candidateUtils';
import { toast } from '@/hooks/use-toast';
import { getCompleteCandidateData } from '@/services/resume/candidateDataService';

// Import the component tabs
import ProfileTab from '@/components/candidates/detail/ProfileTab';
import ExperienceTab from '@/components/candidates/detail/ExperienceTab';
import EducationTab from '@/components/candidates/detail/EducationTab';
import DetailsTab from '@/components/candidates/detail/DetailsTab';
import NotesTab from '@/components/candidates/detail/NotesTab';
import CandidateLoading from '@/components/candidates/detail/CandidateLoading';
import CandidateError from '@/components/candidates/detail/CandidateError';
import DataMissingAlert from '@/components/candidates/detail/DataMissingAlert';
import StatusSelector from '@/components/candidates/detail/StatusSelector';
import ExportProfileButton from '@/components/candidates/detail/ExportProfileButton';

const CandidateDetail = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [dataIncompletenessDetected, setDataIncompletenessDetected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchCandidateData = async () => {
    if (!candidateId) {
      console.error("No candidate ID provided");
      setError("Identifiant de candidat manquant");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching candidate with ID:", candidateId);
      
      // First try using the direct function to get complete candidate data
      let data = null;
      
      try {
        console.log("Attempting to get complete data via bypassing_rls function");
        data = await getCompleteCandidateData(candidateId);
        console.log("Received data from getCompleteCandidateData:", data ? "Success" : "No data");
      } catch (directError: any) {
        console.error("Error with direct function, falling back to standard service:", directError);
        
        // If direct function fails with a specific error, we'll try the regular service
        if (directError.message && (
            directError.message.includes('ambiguous') || 
            directError.message.includes('recursion')
        )) {
          console.log("Detected specific error, trying fallback method");
          data = await candidateService.getCandidateById(candidateId);
          console.log("Fallback method result:", data ? "Success" : "No data");
        } else {
          // Rethrow if it's a different error
          throw directError;
        }
      }
      
      if (!data) {
        console.log("Candidate not found:", candidateId);
        setError("Candidat non trouvé");
      } else {
        console.log("Candidate data retrieved successfully");
        
        // Process the data to ensure arrays and properties are correctly formatted
        const processedData = processCandidateData(data);
        
        // Vérification améliorée des données incomplètes
        // On vérifie chaque section critique pour détecter si des données importantes sont manquantes
        const hasEmptyExperiences = !processedData.experiences || 
          (Array.isArray(processedData.experiences) && processedData.experiences.length === 0);
        const hasEmptyEducation = !processedData.education || 
          (Array.isArray(processedData.education) && processedData.education.length === 0);
        const hasEmptyLanguages = !processedData.languages || 
          (Array.isArray(processedData.languages) && processedData.languages.length === 0);
        
        // Détection plus précise des données incomplètes
        const hasIncompleteData = hasEmptyExperiences || hasEmptyEducation || hasEmptyLanguages;
        
        console.log("Data completeness check:", {
          experiences: !hasEmptyExperiences,
          education: !hasEmptyEducation,
          languages: !hasEmptyLanguages,
          isComplete: !hasIncompleteData
        });
        
        setDataIncompletenessDetected(hasIncompleteData);
        setCandidate(processedData);
      }
    } catch (err: any) {
      console.error("Error loading candidate:", err);
      setError(`Une erreur s'est produite lors du chargement des données: ${err.message}`);
      
      // If we have less than 3 retries and the error contains specific keywords,
      // automatically retry after a short delay
      if (retryCount < 2 && err.message && (
          err.message.includes('ambiguous') || 
          err.message.includes('recursion')
      )) {
        console.log(`Auto-retrying (${retryCount + 1}/3) after error...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchCandidateData();
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidateData();
  }, [candidateId]);

  const handleStatusChange = (newStatus: string) => {
    if (candidate) {
      setCandidate(prevCandidate => ({
        ...prevCandidate!,
        detailed_status: newStatus
      }));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <CandidateLoading />
        </div>
      </Layout>
    );
  }

  if (error || !candidate) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <CandidateError errorMessage={error} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground mb-4 hover:bg-navy/5 transition-all duration-300 group"
            onClick={() => navigate('/candidates')}
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="border-b border-transparent group-hover:border-muted-foreground transition-colors duration-300">Retour aux candidats</span>
          </Button>
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between">
            <div className="relative animate-fade-in">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700">
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
                className="bg-white/80 border-navy/20 hover:border-navy/30 hover:bg-white/90 text-navy transition-all duration-300 group"
              >
                <Briefcase size={16} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span>Match d'emploi</span>
              </Button>
              
              <ExportProfileButton candidate={candidate} />
            </div>
          </div>
        </div>
        
        {dataIncompletenessDetected && (
          <DataMissingAlert 
            candidateName={`${candidate?.first_name} ${candidate?.last_name}`} 
            resumeId={candidate?.resume_id}
            onReanalysisComplete={fetchCandidateData}
          />
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <div className="relative">
            <TabsList className="w-full md:w-auto bg-white/80 backdrop-blur-sm border border-navy/10 px-1 py-1 rounded-lg mb-6 overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-teal-500/5 opacity-70 pointer-events-none"></div>
              <TabsTrigger 
                value="profile" 
                className="px-4 py-2 rounded data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-blue-600/90 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                Profil
              </TabsTrigger>
              <TabsTrigger 
                value="experience" 
                className="px-4 py-2 rounded data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-blue-600/90 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                Expérience
              </TabsTrigger>
              <TabsTrigger 
                value="education" 
                className="px-4 py-2 rounded data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-blue-600/90 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                Formation
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="px-4 py-2 rounded data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-blue-600/90 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                Notes
              </TabsTrigger>
              <TabsTrigger 
                value="details" 
                className="px-4 py-2 rounded data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/90 data-[state=active]:to-blue-600/90 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
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
                className="animate-fade-in rounded-xl relative overflow-hidden bg-white/70 backdrop-blur-sm border border-navy/10 shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
                <ProfileTab 
                  candidate={candidate} 
                  isLoading={loading}
                  onRefresh={fetchCandidateData}
                />
              </TabsContent>
              
              <TabsContent 
                value="experience"
                className="animate-fade-in rounded-xl relative overflow-hidden bg-white/70 backdrop-blur-sm border border-navy/10 shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
                <ExperienceTab candidate={candidate} />
              </TabsContent>
              
              <TabsContent 
                value="education"
                className="animate-fade-in rounded-xl relative overflow-hidden bg-white/70 backdrop-blur-sm border border-navy/10 shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
                <EducationTab candidate={candidate} />
              </TabsContent>
              
              <TabsContent 
                value="notes"
                className="animate-fade-in rounded-xl relative overflow-hidden bg-white/70 backdrop-blur-sm border border-navy/10 shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
                <NotesTab candidate={candidate} onDataUpdate={fetchCandidateData} />
              </TabsContent>
              
              <TabsContent 
                value="details"
                className="animate-fade-in rounded-xl relative overflow-hidden bg-white/70 backdrop-blur-sm border border-navy/10 shadow-md"
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
