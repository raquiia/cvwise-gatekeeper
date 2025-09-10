import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { candidateService } from '@/services/data/candidateService';
import { CandidateData } from '@/services/data/candidateService';
import { processCandidateData } from '@/utils/candidateUtils';
import { toast } from '@/hooks/use-toast';
import { getCompleteCandidateData, getGlobalCandidateData } from '@/services/resume/candidateDataService';
import { candidateReferencesService } from '@/services/data/candidateReferencesService';

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
import ModernCandidateHeader from '@/components/candidates/detail/ModernCandidateHeader';
import ModernTabsContainer from '@/components/candidates/detail/ModernTabsContainer';
import ModernTabContent from '@/components/candidates/detail/ModernTabContent';
import ReferencesTab from '@/components/candidates/detail/ReferencesTab';
import { DocumentsTab } from '@/components/candidates/detail/DocumentsTab';
import { RecruitmentProcessHistory } from '@/components/candidates/detail/RecruitmentProcessHistory';
import BackToSearchButton from '@/components/candidates/detail/BackToSearchButton';

const CandidateDetail = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [dataIncompletenessDetected, setDataIncompletenessDetected] = useState(false);
  const [referencesStats, setReferencesStats] = useState({ verified: 0, total: 0, percentage: 0 });

  // Check if there's an active search in the referrer URL
  const referrerSearch = new URLSearchParams(window.location.search);
  const hasActiveSearch = referrerSearch.has('search') || referrerSearch.has('status');
  const searchQuery = referrerSearch.get('search') || '';

  // Stable function that doesn't depend on state
  const fetchCandidateData = useCallback(async () => {
    if (!candidateId) {
      console.error("No candidate ID provided");
      setError("Identifiant de candidat manquant");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 CandidateDetail: Starting data fetch for ID:", candidateId);
      
      let data = null;
      let isOwnCandidate = true;
      
      try {
        // Essayer d'abord d'accéder au candidat comme candidat propre
        console.log("🔑 CandidateDetail: Trying to fetch as own candidate...");
        data = await getCompleteCandidateData(candidateId);
        console.log("✅ CandidateDetail: Successfully fetched as own candidate");
      } catch (ownCandidateError: any) {
        console.log("❌ CandidateDetail: Failed to fetch as own candidate:", ownCandidateError.message);
        
        // Si l'accès échoue, essayer l'accès global
        try {
          console.log("🌍 CandidateDetail: Trying to fetch as global candidate...");
          data = await getGlobalCandidateData(candidateId);
          isOwnCandidate = false;
          console.log("✅ CandidateDetail: Successfully fetched as global candidate");
        } catch (globalError: any) {
          console.log("❌ CandidateDetail: Failed to fetch as global candidate:", globalError.message);
          throw globalError;
        }
      }
      
      if (!data) {
        console.log("Candidate not found:", candidateId);
        setError("Candidat non trouvé");
      } else {
        console.log("🔄 CandidateDetail: Processing candidate data...");
        console.log("🔍 CandidateDetail: Candidate ownership:", {
          isOwnCandidate: data.isOwnCandidate || isOwnCandidate,
          owner_name: data.owner_first_name && data.owner_last_name 
            ? `${data.owner_first_name} ${data.owner_last_name}` 
            : 'Unknown'
        });
        
        // Process the data to ensure arrays and properties are correctly formatted
        const processedData = processCandidateData(data);
        
        console.log("📋 CandidateDetail: Data after processCandidateData:", {
          first_name: processedData.first_name,
          last_name: processedData.last_name,
          address: processedData.address,
          postal_code: processedData.postal_code,
          city: processedData.city,
          country: processedData.country,
          ai_score: processedData.ai_score,
          ai_analyzed_at: processedData.ai_analyzed_at,
          hasAIData: !!(processedData.ai_score || processedData.ai_explanation),
          isOwnCandidate: processedData.isOwnCandidate
        });
        
        // Check data completeness only for own candidates
        const shouldCheckCompleteness = processedData.isOwnCandidate !== false;
        let hasIncompleteData = false;
        
        if (shouldCheckCompleteness) {
          const hasEmptyExperiences = !processedData.experiences || 
            (Array.isArray(processedData.experiences) && processedData.experiences.length === 0);
          const hasEmptyEducation = !processedData.education || 
            (Array.isArray(processedData.education) && processedData.education.length === 0);
          const hasEmptyLanguages = !processedData.languages || 
            (Array.isArray(processedData.languages) && processedData.languages.length === 0);
          
          hasIncompleteData = hasEmptyExperiences || hasEmptyEducation || hasEmptyLanguages;
          
          console.log("Data completeness check:", {
            experiences: !hasEmptyExperiences,
            education: !hasEmptyEducation,
            languages: !hasEmptyLanguages,
            isComplete: !hasIncompleteData,
            hasAIAnalysis: !!(processedData.ai_score || processedData.ai_explanation),
            isOwnCandidate: processedData.isOwnCandidate
          });
        } else {
          console.log("Skipping data completeness check for external candidate");
        }
        
        setDataIncompletenessDetected(hasIncompleteData);
        
        console.log("💾 CandidateDetail: Setting candidate state with processed data");
        setCandidate(processedData);
        
        console.log("🎯 CandidateDetail: Final candidate state set:", {
          first_name: processedData.first_name,
          last_name: processedData.last_name,
          address: processedData.address,
          postal_code: processedData.postal_code,
          city: processedData.city,
          country: processedData.country,
          ai_score: processedData.ai_score,
          ai_analyzed_at: processedData.ai_analyzed_at,
          isOwnCandidate: processedData.isOwnCandidate
        });
      }
    } catch (err: any) {
      console.error("Error loading candidate:", err);
      setError(`Une erreur s'est produite lors du chargement des données: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  // Effect that runs only when candidateId changes
  useEffect(() => {
    fetchCandidateData();
  }, [candidateId, fetchCandidateData]);

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

  // Enhanced refresh function that also refreshes AI scores
  const handleRefreshWithAIScore = useCallback(async () => {
    console.log('🔄 CandidateDetail: Enhanced refresh requested');
    
    // Refresh candidate data
    await fetchCandidateData();
    
    // Force refresh AI scores after a short delay to ensure data is loaded
    if (candidateId) {
      setTimeout(() => {
        console.log('🔄 CandidateDetail: Force refreshing AI scores');
        // This will be handled by the AI scoring hooks in the components
      }, 500);
    }
  }, [fetchCandidateData, candidateId]);

  // Load references stats
  const loadReferencesStats = useCallback(async () => {
    if (!candidateId) return;
    
    try {
      const references = await candidateReferencesService.getReferencesForCandidate(candidateId);
      const verified = references.filter(ref => ref.verified).length;
      const total = references.length;
      const percentage = total > 0 ? Math.round((verified / total) * 100) : 0;
      
      setReferencesStats({ verified, total, percentage });
    } catch (error) {
      console.error('Error loading references stats:', error);
    }
  }, [candidateId]);

  // Handler for references changes
  const handleReferencesChange = useCallback(() => {
    loadReferencesStats();
  }, [loadReferencesStats]);

  // Load references stats when candidate data is loaded
  useEffect(() => {
    if (candidate?.id) {
      loadReferencesStats();
    }
  }, [candidate?.id, loadReferencesStats]);

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
    <Layout className="bg-gradient-to-br from-background via-background to-muted/10 min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Back to Search Button */}
        <div className="flex justify-start">
          <BackToSearchButton
            hasActiveSearch={hasActiveSearch}
            searchQuery={searchQuery}
          />
        </div>
        
        {/* Header modernisé */}
        <ModernCandidateHeader
          candidate={candidate}
          isLoading={loading}
          onRefresh={handleRefreshWithAIScore}
          referencesStats={referencesStats}
          onLoadReferencesStats={loadReferencesStats}
        />
        
        {/* Alerte de données manquantes */}
        {dataIncompletenessDetected && (
          <DataMissingAlert 
            candidateName={`${candidate?.first_name} ${candidate?.last_name}`} 
            resumeId={candidate?.resume_id}
            onReanalysisComplete={handleRefreshWithAIScore}
          />
        )}
        
        {/* Onglets modernisés */}
        <ModernTabsContainer
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {candidate && (
            <>
              <ModernTabContent value="profile" gradient="from-blue-500/5 to-purple-500/5">
                <ProfileTab 
                  candidate={candidate} 
                  isLoading={loading}
                  onRefresh={handleRefreshWithAIScore}
                />
              </ModernTabContent>
              
              <ModernTabContent value="ai-analysis" gradient="from-purple-500/5 to-pink-500/5">
                <AIAnalysisTab 
                  candidate={candidate} 
                  isLoading={loading}
                  onRefresh={handleRefreshWithAIScore}
                />
              </ModernTabContent>
              
              <ModernTabContent value="experience" gradient="from-green-500/5 to-teal-500/5">
                <ExperienceTab candidate={candidate} />
              </ModernTabContent>
              
              <ModernTabContent value="education" gradient="from-orange-500/5 to-red-500/5">
                <EducationTab candidate={candidate} />
              </ModernTabContent>
              
              <ModernTabContent value="notes" gradient="from-yellow-500/5 to-orange-500/5">
                <NotesTab candidate={candidate} onDataUpdate={handleRefreshWithAIScore} />
              </ModernTabContent>
              
              <ModernTabContent value="references" gradient="from-teal-500/5 to-cyan-500/5">
                <ReferencesTab 
                  candidate={candidate} 
                  onRefresh={handleRefreshWithAIScore}
                  onReferencesChange={handleReferencesChange}
                />
              </ModernTabContent>
              
              <ModernTabContent value="documents" gradient="from-indigo-500/5 to-blue-500/5">
                <DocumentsTab candidateId={candidate.id} />
              </ModernTabContent>
              
              <ModernTabContent value="processes" gradient="from-violet-500/5 to-purple-500/5">
                <RecruitmentProcessHistory 
                  candidateId={candidate.id}
                  currentStatus={candidate.detailed_status || ''}
                  onProcessStarted={handleRefreshWithAIScore}
                />
              </ModernTabContent>
              
              <ModernTabContent value="details" gradient="from-gray-500/5 to-slate-500/5">
                <DetailsTab candidate={candidate} />
              </ModernTabContent>
            </>
          )}
        </ModernTabsContainer>
      </div>
    </Layout>
  );
};

export default CandidateDetail;
