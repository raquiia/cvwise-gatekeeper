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
import SearchBreadcrumb from '@/components/candidates/SearchBreadcrumb';
import { candidateService } from '@/services/data/candidateService';
import { CandidateData } from '@/services/data/candidateService';
import { semanticMatchingService } from '@/services/semantic/semanticMatchingService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/use-debounce';
import { useURLFilters } from '@/hooks/use-url-filters';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS, candidateStatusService } from '@/services/data/candidateStatusService';
import { Button } from '@/components/ui/button';
import { Filter, Upload, FileText, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReprocessDataButton from '@/components/candidates/ReprocessDataButton';

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
  const [showFilters, setShowFilters] = useState(false);
  const [currentView, setCurrentView] = useState<'table' | 'cards' | 'kanban' | 'analytics'>('table');
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  
  // Use URL filters hook instead of local state
  const { 
    filters, 
    updateSemanticSearch, 
    updateSelectedStatus, 
    clearFilters, 
    hasActiveFilters 
  } = useURLFilters();
  
  // Debounce the semantic search
  const debouncedSemanticQuery = useDebounce(filters.semanticSearch, 500);
  
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
      } else {
        console.error("Candidates data is not an array:", data);
        setCandidates([]);
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

  // Effect to filter candidates (status + semantic search)
  useEffect(() => {
    if (!candidates || candidates.length === 0) {
      setFilteredCandidates([]);
      return;
    }
    
    let result = [...candidates];
    
    // Filter by status
    if (filters.selectedStatus) {
      result = result.filter(candidate => {
        const candidateStatus = candidate.detailed_status || 'initial';
        return candidateStatus === filters.selectedStatus;
      });
    }
    
    // Semantic filter
    if (debouncedSemanticQuery.trim()) {
      setIsSemanticSearching(true);
      console.log(`🔍 Recherche sémantique pour: "${debouncedSemanticQuery}"`);
      
      const semanticResults = result.filter(candidate => {
        const candidateText = semanticMatchingService.getCandidateSearchableText(candidate);
        const isMatch = semanticMatchingService.isSemanticMatch({
          query: debouncedSemanticQuery,
          candidateText: candidateText,
          threshold: 0.3
        });
        
        if (isMatch) {
          console.log(`✅ Match trouvé pour ${candidate.first_name} ${candidate.last_name}`);
        }
        
        return isMatch;
      });
      
      result = semanticResults;
      console.log(`🎯 ${result.length} candidats trouvés pour "${debouncedSemanticQuery}"`);
      setIsSemanticSearching(false);
    }
    
    setFilteredCandidates(result);
  }, [filters.selectedStatus, candidates, debouncedSemanticQuery]);

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
    updateSelectedStatus(status);
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

  // Handler for semantic search
  const handleSemanticSearchChange = (query: string) => {
    updateSemanticSearch(query);
  };

  // Handler to reset filters
  const handleResetFilters = () => {
    clearFilters();
  };

  // Fonction corrigée pour gérer la suppression
  const handleCandidateDeleted = async (candidateId: string) => {
    console.log('Candidate deleted, refreshing list...');
    // Recharger la liste des candidats
    await fetchCandidates();
  };

  const handleCandidateDeletedRefresh = async () => {
    console.log('Candidate deleted, refreshing list...');
    await fetchCandidates();
  };

  const renderCurrentView = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-4 text-muted-foreground">Chargement des candidats...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive backdrop-blur-sm">
          {error}
        </div>
      );
    }

    // Message informatif quand aucun résultat pour la recherche sémantique
    if (debouncedSemanticQuery.trim() && filteredCandidates.length === 0 && candidates.length > 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
            <Filter className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucun candidat trouvé
          </h3>
          <p className="text-muted-foreground mb-4">
            Aucun candidat ne correspond à votre recherche "{debouncedSemanticQuery}"
          </p>
          <Button 
            variant="outline" 
            onClick={() => updateSemanticSearch('')}
          >
            Effacer la recherche
          </Button>
        </div>
      );
    }

    switch (currentView) {
      case 'table':
        return (
          <CandidatesTable 
            candidates={filteredCandidates}
            selectedStatus={filters.selectedStatus}
            onStatusChange={handleStatusChange}
            onViewCandidate={handleViewCandidate}
            onCandidateDeleted={handleCandidateDeleted}
          />
        );
      case 'cards':
        return (
          <CandidatesCardView
            candidates={filteredCandidates}
            onViewCandidate={handleViewCandidate}
            onCandidateDeleted={handleCandidateDeletedRefresh}
          />
        );
      case 'kanban':
        return (
          <CandidatesKanbanView
            candidates={filteredCandidates}
            onViewCandidate={handleViewCandidate}
            onCandidateDeleted={handleCandidateDeletedRefresh}
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
            selectedStatus={filters.selectedStatus}
            onStatusChange={handleStatusChange}
            onViewCandidate={handleViewCandidate}
            onCandidateDeleted={handleCandidateDeleted}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Modern Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Candidats
            </h1>
            <p className="text-muted-foreground text-lg">
              Gérez vos talents avec l'intelligence artificielle
            </p>
            {debouncedSemanticQuery.trim() && (
              <p className="text-sm text-blue-600 mt-1">
                {isSemanticSearching ? (
                  <>Recherche en cours...</>
                ) : (
                  <>{filteredCandidates.length} résultat{filteredCandidates.length > 1 ? 's' : ''} pour "{debouncedSemanticQuery}"</>
                )}
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant={showFilters ? "default" : "outline"} 
              className="gap-2 bg-white/80 dark:bg-card/80 backdrop-blur-sm border-border/50 hover:bg-accent/80 transition-all duration-200"
              onClick={handleToggleFilters}
            >
              <Filter size={16} />
              Filtres
            </Button>
            
            <Link to="/resumes/upload">
              <Button variant="outline" className="gap-2 bg-white/80 dark:bg-card/80 backdrop-blur-sm border-border/50 hover:bg-accent/80 transition-all duration-200">
                <Upload size={16} />
                Importer
              </Button>
            </Link>
            
            <Link to="/resumes">
              <Button variant="outline" className="gap-2 bg-white/80 dark:bg-card/80 backdrop-blur-sm border-border/50 hover:bg-accent/80 transition-all duration-200">
                <FileText size={16} />
                CV
              </Button>
            </Link>
            
            <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
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

        {/* Search Breadcrumb */}
        <SearchBreadcrumb
          semanticSearch={filters.semanticSearch}
          selectedStatus={filters.selectedStatus}
          onClearFilters={clearFilters}
          resultsCount={filteredCandidates.length}
        />

        {/* Status Filter Header */}
        <CandidatesHeader
          onStatusChange={handleStatusChange}
          selectedStatus={filters.selectedStatus}
          candidateCount={totalCandidates}
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
            <div className="bg-card/70 dark:bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-6">
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
                onSemanticSearchChange={handleSemanticSearchChange}
                onApplyFilters={() => {}}
                onResetFilters={handleResetFilters}
                location=""
                company=""
                previousCompany=""
                experience="all"
                semanticSearch={filters.semanticSearch}
                selectedSkills={[]}
              />
            </div>
          </div>
        )}
        
        {/* Main Content with different views */}
        <div className="bg-card/50 dark:bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

const Candidates = () => {
  return (
    <Layout>
      <CandidatesContent />
    </Layout>
  );
};

export default Candidates;
