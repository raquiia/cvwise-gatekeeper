import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CandidatesHeader from '@/components/candidates/CandidatesHeader';
import CandidatesTable from '@/components/candidates/CandidatesTable';
import CandidatesCardView from '@/components/candidates/CandidatesCardView';
import CandidatesKanbanView from '@/components/candidates/kanban/CandidatesKanbanView';
import CandidatesAnalyticsView from '@/components/candidates/analytics/CandidatesAnalyticsView';
import CandidatesFilters from '@/components/candidates/CandidatesFilters';
import CandidateStats from '@/components/candidates/CandidateStats';
import ViewSelector from '@/components/candidates/ViewSelector';
import { candidateService } from '@/services/data/candidateService';
import { CandidateData } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS, candidateStatusService } from '@/services/data/candidateStatusService';
import { ActiveJobProvider } from '@/context/ActiveJobContext';
import { Button } from '@/components/ui/button';
import { Filter, Upload, FileText, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

// Helper function to extract status from candidate
const extractCandidateStatus = async (candidate: CandidateData): Promise<string> => {
  let statusValue = 'initial';
  
  try {
    if (candidate.detailed_status && 
        candidate.detailed_status !== '' && 
        candidate.detailed_status !== 'undefined' && 
        candidate.detailed_status !== 'null') {
      
      if (typeof candidate.detailed_status === 'string') {
        const trimmedStatus = candidate.detailed_status.trim();
        if (trimmedStatus !== '' && trimmedStatus !== 'undefined' && trimmedStatus !== 'null') {
          return trimmedStatus;
        }
      }
      
      if (typeof candidate.detailed_status === 'object' && candidate.detailed_status !== null) {
        const statusObj = candidate.detailed_status as Record<string, any>;
        
        if ('value' in statusObj && statusObj.value !== undefined) {
          const extractedValue = String(statusObj.value).trim();
          if (extractedValue !== '' && extractedValue !== 'undefined' && extractedValue !== 'null') {
            return extractedValue;
          }
        }
        
        if ('status' in statusObj && statusObj.status !== undefined) {
          const extractedValue = String(statusObj.status).trim();
          if (extractedValue !== '' && extractedValue !== 'undefined' && extractedValue !== 'null') {
            return extractedValue;
          }
        }
      }
    }
    
    if (candidate.id) {
      console.log(`Fetching status from database for candidate ${candidate.id}`);
      const dbStatus = await candidateStatusService.getCandidateStatus(candidate.id);
      if (dbStatus && dbStatus !== '' && dbStatus !== 'undefined' && dbStatus !== 'null') {
        console.log(`Retrieved status from DB: ${dbStatus}`);
        return dbStatus;
      }
    }
  } catch (err) {
    console.error("Error extracting candidate status:", err);
  }
  
  return statusValue;
};

const CandidatesContent = () => {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentView, setCurrentView] = useState<'table' | 'cards' | 'kanban' | 'analytics'>('table');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCandidates = async () => {
    if (!user?.id) {
      setError("Vous devez être connecté pour voir vos candidats");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching candidates for user:", user.id);
      const data = await candidateService.getUserCandidates();
      console.log("Retrieved candidates:", data);
      
      if (Array.isArray(data)) {
        const sortedCandidates = [...data].sort((a, b) => 
          new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime()
        );
        
        const candidatesWithCorrectStatus = await Promise.all(
          sortedCandidates.map(async (candidate) => {
            const correctStatus = await extractCandidateStatus(candidate);
            return {
              ...candidate,
              detailed_status: correctStatus
            };
          })
        );
        
        setCandidates(candidatesWithCorrectStatus);
        setFilteredCandidates(candidatesWithCorrectStatus);
      } else {
        console.error("Candidates data is not an array:", data);
        setCandidates([]);
        setFilteredCandidates([]);
        setError("Format de données incorrect");
      }
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
      setError(error?.message || "Impossible de récupérer les candidats");
      
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de récupérer les candidats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [user]);

  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    
    let result = [...candidates];
    
    if (selectedStatus) {
      result = result.filter(candidate => {
        const candidateStatus = candidate.detailed_status || 'initial';
        return candidateStatus === selectedStatus;
      });
    }
    
    setFilteredCandidates(result);
  }, [selectedStatus, candidates]);

  // Calculate stats
  const totalCandidates = candidates.length;
  const newThisWeek = candidates.filter(c => {
    const createdDate = new Date(c.created_at || '');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate > weekAgo;
  }).length;
  
  const inProgress = candidates.filter(c => 
    ['contact', 'prequalification', 'ec1', 'ec2', 'presentation_client'].includes(c.detailed_status || '')
  ).length;
  
  const topCandidates = candidates.filter(c => {
    return (c.score || 0) >= 85;
  }).length;

  const handleStatusChange = (status: string | null) => {
    setSelectedStatus(status);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleViewCandidate = (candidateId: string) => {
    navigate(`/candidates/${candidateId}`);
  };

  const handleViewChange = (view: 'table' | 'cards' | 'kanban' | 'analytics') => {
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-4 text-gray-600">Chargement des candidats...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      );
    }

    switch (currentView) {
      case 'table':
        return (
          <CandidatesTable 
            candidates={filteredCandidates}
            selectedStatus={selectedStatus}
            onStatusChange={handleStatusChange}
            onViewCandidate={handleViewCandidate}
            onCandidateDeleted={fetchCandidates}
          />
        );
      case 'cards':
        return (
          <CandidatesCardView
            candidates={filteredCandidates}
            onViewCandidate={handleViewCandidate}
            onCandidateDeleted={fetchCandidates}
          />
        );
      case 'kanban':
        return (
          <CandidatesKanbanView
            candidates={filteredCandidates}
            onViewCandidate={handleViewCandidate}
            onCandidateDeleted={fetchCandidates}
          />
        );
      case 'analytics':
        return (
          <CandidatesAnalyticsView
            candidates={filteredCandidates}
          />
        );
      default:
        return (
          <CandidatesTable 
            candidates={filteredCandidates}
            selectedStatus={selectedStatus}
            onStatusChange={handleStatusChange}
            onViewCandidate={handleViewCandidate}
            onCandidateDeleted={fetchCandidates}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Candidats
            </h1>
            <p className="text-gray-600">
              Gérez vos candidats efficacement
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={showFilters ? "default" : "outline"} 
              className="gap-2"
              onClick={handleToggleFilters}
            >
              <Filter size={16} />
              Filtres
            </Button>
            
            <Link to="/resumes/upload">
              <Button variant="outline" className="gap-2">
                <Upload size={16} />
                Importer
              </Button>
            </Link>
            
            <Link to="/resumes">
              <Button variant="outline" className="gap-2">
                <FileText size={16} />
                CV
              </Button>
            </Link>
            
            <Button className="gap-2">
              <UserPlus size={16} />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <CandidateStats 
          totalCandidates={totalCandidates}
          newThisWeek={newThisWeek}
          inProgress={inProgress}
          topCandidates={topCandidates}
        />

        {/* View Selector */}
        <div className="mb-6 flex justify-center">
          <ViewSelector 
            currentView={currentView}
            onViewChange={handleViewChange}
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6">
            <CandidatesFilters 
              showFilters={true}
              onLocationChange={() => {}}
              onCompanyChange={() => {}}
              onPreviousCompanyChange={() => {}}
              onSkillsChange={() => {}}
              onExperienceChange={() => {}}
              onEducationLevelChange={() => {}}
              onCertificationChange={() => {}}
              onLanguageChange={() => {}}
              onAvailabilityChange={() => {}}
              onSalaryChange={() => {}}
              onContractTypeChange={() => {}}
              onRemotePreferenceChange={() => {}}
              onMobilityChange={() => {}}
              onReset={() => setFilteredCandidates(candidates)}
              onSemanticSearchChange={() => {}}
              onApplyFilters={() => {}}
              onResetFilters={() => {}}
              location=""
              company=""
              previousCompany=""
              experience="all"
              semanticSearch=""
              selectedSkills={[]}
            />
          </div>
        )}
        
        {/* Main Content with different views */}
        <div>
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

const Candidates = () => {
  return (
    <Layout>
      <ActiveJobProvider>
        <CandidatesContent />
      </ActiveJobProvider>
    </Layout>
  );
};

export default Candidates;
