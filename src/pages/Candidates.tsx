
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CandidatesHeader from '@/components/candidates/CandidatesHeader';
import CandidatesTable from '@/components/candidates/CandidatesTable';
import CandidatesFilters from '@/components/candidates/CandidatesFilters';
import CandidateStats from '@/components/candidates/CandidateStats';
import ViewSelector from '@/components/candidates/ViewSelector';
import CandidatesCardView from '@/components/candidates/CandidatesCardView';
import EnhancedSearch from '@/components/candidates/EnhancedSearch';
import CandidatesKanbanView from '@/components/candidates/kanban/CandidatesKanbanView';
import CandidatesAnalyticsView from '@/components/candidates/analytics/CandidatesAnalyticsView';
import { candidateService } from '@/services/data/candidateService';
import { CandidateData } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useMediaQuery } from '@/hooks/use-media-query';
import { semanticMatchingService } from '@/services/semantic/semanticMatchingService';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS, candidateStatusService } from '@/services/data/candidateStatusService';
import { ActiveJobProvider } from '@/context/ActiveJobContext';
import { Button } from '@/components/ui/button';
import { Filter, Upload, FileText, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

// Helper function to extract status from candidate - Enhanced version
const extractCandidateStatus = async (candidate: CandidateData): Promise<string> => {
  // Default status if extraction fails
  let statusValue = 'initial';
  
  try {
    // First, try to get the status from detailed_status field
    if (candidate.detailed_status && 
        candidate.detailed_status !== '' && 
        candidate.detailed_status !== 'undefined' && 
        candidate.detailed_status !== 'null') {
      
      // If it's directly a string and not empty
      if (typeof candidate.detailed_status === 'string') {
        const trimmedStatus = candidate.detailed_status.trim();
        if (trimmedStatus !== '' && trimmedStatus !== 'undefined' && trimmedStatus !== 'null') {
          return trimmedStatus;
        }
      }
      
      // If it's an object, try to extract the value
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
    
    // If detailed_status is empty or invalid, try to get it from the database
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
  
  // Add missing state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentView, setCurrentView] = useState<'table' | 'cards' | 'kanban' | 'analytics'>('table');
  
  const [location, setLocation] = useState('');
  const [company, setCompany] = useState('');
  const [previousCompany, setPreviousCompany] = useState('');
  const [experience, setExperience] = useState('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [semanticSearch, setSemanticSearch] = useState('');
  
  const isDesktop = useMediaQuery("(min-width: 1024px)");
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
        
        // Log status distribution after fetch
        console.log('📊 Status distribution after fetch:');
        const statusCount = sortedCandidates.reduce((acc, candidate) => {
          const status = candidate.detailed_status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        Object.entries(statusCount).forEach(([status, count]) => {
          console.log(`   ${status}: ${count} candidate(s)`);
        });
        
        setCandidates(sortedCandidates);
        setFilteredCandidates(sortedCandidates);
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

  // Enhanced function to handle candidate updates with forced refresh
  const handleCandidateUpdated = async () => {
    console.log('Candidate updated, forcing complete data refresh...');
    // Force a complete data refresh to get the latest status updates
    await fetchCandidates();
  };

  useEffect(() => {
    fetchCandidates();
  }, [user]);

  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    
    let result = [...candidates];
    
    if (selectedStatus) {
      // Filter candidates by selected status
      result = result.filter(candidate => {
        const candidateStatus = candidate.detailed_status || 'initial';
        
        console.log(`Candidate ${candidate.id} status: ${candidateStatus}, selected: ${selectedStatus}, match: ${candidateStatus === selectedStatus}`);
        
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
    // This would normally use the scoring system
    return (c.score || 0) >= 85;
  }).length;

  const handleStatusChange = (status: string | null) => {
    setSelectedStatus(status);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleViewCandidate = (candidateId: string) => {
    navigate(`/candidates/${candidateId}`);
  };
  
  const handleLocationChange = (value: string) => {
    setLocation(value);
  };
  
  const handleCompanyChange = (value: string) => {
    setCompany(value);
  };
  
  const handlePreviousCompanyChange = (value: string) => {
    setPreviousCompany(value);
  };
  
  const handleExperienceChange = (value: string) => {
    setExperience(value);
  };
  
  const handleSkillsChange = (skills: string[]) => {
    setSelectedSkills(skills);
  };
  
  const handleSemanticSearchChange = (query: string) => {
    setSemanticSearch(query);
  };
  
  const handleApplyFilters = () => {
    console.log("Applying filters:", { location, company, previousCompany, experience, selectedSkills, semanticSearch });
    
    if (!candidates || candidates.length === 0) return;
    
    let result = [...candidates];
    
    if (selectedStatus) {
      result = result.filter(candidate => {
        const candidateStatus = candidate.detailed_status || 'initial';
        return candidateStatus === selectedStatus;
      });
    }
    
    if (location) {
      result = result.filter(candidate => {
        const candidateLocation = candidate.location || '';
        return candidateLocation.toLowerCase().includes(location.toLowerCase());
      });
    }
    
    if (company) {
      result = result.filter(candidate => {
        const candidateCompany = candidate.company || '';
        return candidateCompany.toLowerCase().includes(company.toLowerCase());
      });
    }
    
    if (previousCompany) {
      result = result.filter(candidate => {
        const experiences = Array.isArray(candidate.experiences) ? candidate.experiences : [];
        return experiences.some(exp => {
          const companyName = typeof exp === 'object' && exp ? exp.company || '' : '';
          return companyName.toLowerCase().includes(previousCompany.toLowerCase());
        });
      });
    }
    
    const expRanges = {
      '1-3': { min: 1, max: 3 },
      '4-6': { min: 4, max: 6 },
      '7-10': { min: 7, max: 10 },
      '10+': { min: 10, max: 100 }
    };
    
    const selectedRange = expRanges[experience as keyof typeof expRanges];
    if (selectedRange) {
      result = result.filter(candidate => {
        const yearsExp = Number(candidate.years_experience) || 0;
        return yearsExp >= selectedRange.min && yearsExp <= selectedRange.max;
      });
    }
    
    if (selectedSkills.length > 0) {
      result = result.filter(candidate => {
        const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
        return selectedSkills.every(skill => 
          candidateSkills.some(candidateSkill => 
            candidateSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(candidateSkill.toLowerCase())
          )
        );
      });
    }
    
    if (semanticSearch) {
      result = result.filter(candidate => {
        const candidateText = semanticMatchingService.getCandidateSearchableText(candidate);
        return semanticMatchingService.isSemanticMatch({
          query: semanticSearch,
          candidateText,
          threshold: 0.5
        });
      });
    }
    
    setFilteredCandidates(result);
    
    toast({
      title: `${result.length} candidats trouvés`,
      description: result.length > 0 
        ? "Les filtres ont été appliqués avec succès." 
        : "Aucun candidat ne correspond à vos critères de recherche.",
      variant: result.length > 0 ? "default" : "destructive",
    });
  };
  
  const handleResetFilters = () => {
    setLocation('');
    setCompany('');
    setPreviousCompany('');
    setExperience('all');
    setSelectedSkills([]);
    setSemanticSearch('');
    
    if (selectedStatus) {
      setFilteredCandidates(candidates.filter(candidate => {
        const candidateStatus = candidate.detailed_status || 'initial';
        return candidateStatus === selectedStatus;
      }));
    } else {
      setFilteredCandidates(candidates);
    }
    
    toast({
      title: "Filtres réinitialisés",
      description: "Tous les filtres ont été réinitialisés.",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/30 dark:from-navy-dark/40 dark:via-navy-dark/60 dark:to-purple-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-600/10 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-navy-dark dark:text-sand mb-2 bg-gradient-to-r from-purple-700 to-indigo-600 dark:from-purple-400 dark:to-indigo-300 bg-clip-text text-transparent">
              Candidats
            </h1>
            <p className="text-muted-foreground text-lg">
              Gérez efficacement vos profils de candidats
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="w-full md:w-96">
              <EnhancedSearch
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                recentSearches={['React Developer', 'Paris', 'Senior']}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={showFilters ? "default" : "outline"} 
                className={`gap-2 ${showFilters ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200/50 hover:bg-purple-50'}`}
                onClick={handleToggleFilters}
              >
                <Filter size={16} />
                <span className="hidden sm:inline">Filtres</span>
              </Button>
              
              <Link to="/resumes/upload">
                <Button variant="outline" className="gap-2 border-purple-200/50 hover:bg-purple-50">
                  <Upload size={16} />
                  <span className="hidden sm:inline">Importer</span>
                </Button>
              </Link>
              
              <Link to="/resumes">
                <Button variant="outline" className="gap-2 border-purple-200/50 hover:bg-purple-50">
                  <FileText size={16} />
                  <span className="hidden sm:inline">CV</span>
                </Button>
              </Link>
              
              <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                <UserPlus size={16} />
                <span className="hidden sm:inline">Ajouter</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Only show for non-analytics views */}
        {currentView !== 'analytics' && (
          <CandidateStats 
            totalCandidates={totalCandidates}
            newThisWeek={newThisWeek}
            inProgress={inProgress}
            topCandidates={topCandidates}
          />
        )}

        {/* View Selector and Filters - Only show for non-analytics views */}
        {currentView !== 'analytics' && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <ViewSelector currentView={currentView} onViewChange={setCurrentView} />
            
            {showFilters && (
              <div className="lg:ml-auto">
                <span className="text-sm text-muted-foreground">
                  {filteredCandidates.length} candidat{filteredCandidates.length > 1 ? 's' : ''} affiché{filteredCandidates.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* View Selector for Analytics */}
        {currentView === 'analytics' && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <ViewSelector currentView={currentView} onViewChange={setCurrentView} />
          </div>
        )}
        
        {/* Filters - Only show for non-analytics views */}
        {showFilters && currentView !== 'analytics' && (
          <div className="mb-6 animate-in fade-in duration-300">
            <CandidatesFilters 
              showFilters={true}
              onLocationChange={handleLocationChange}
              onCompanyChange={handleCompanyChange}
              onPreviousCompanyChange={handlePreviousCompanyChange}
              onSkillsChange={handleSkillsChange}
              onExperienceChange={handleExperienceChange}
              onEducationLevelChange={() => {}}
              onCertificationChange={() => {}}
              onLanguageChange={() => {}}
              onAvailabilityChange={() => {}}
              onSalaryChange={() => {}}
              onContractTypeChange={() => {}}
              onRemotePreferenceChange={() => {}}
              onMobilityChange={() => {}}
              onReset={handleResetFilters}
              onSemanticSearchChange={handleSemanticSearchChange}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
              location={location}
              company={company}
              previousCompany={previousCompany}
              experience={experience}
              semanticSearch={semanticSearch}
              selectedSkills={selectedSkills}
            />
          </div>
        )}
        
        {/* Main Content */}
        <div className="transition-all duration-300">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <p className="ml-4 text-purple-700 dark:text-purple-300 font-medium">Chargement des candidats...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4 text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : currentView === 'cards' ? (
            <CandidatesCardView 
              candidates={filteredCandidates}
              onViewCandidate={handleViewCandidate}
              onCandidateDeleted={handleCandidateUpdated}
            />
          ) : currentView === 'kanban' ? (
            <CandidatesKanbanView 
              candidates={filteredCandidates}
              onViewCandidate={handleViewCandidate}
              onCandidateDeleted={handleCandidateUpdated}
              onCandidateUpdated={handleCandidateUpdated}
            />
          ) : currentView === 'analytics' ? (
            <CandidatesAnalyticsView 
              candidates={candidates}
            />
          ) : (
            <CandidatesTable 
              candidates={filteredCandidates}
              selectedStatus={selectedStatus}
              onStatusChange={handleStatusChange}
              onViewCandidate={handleViewCandidate}
              onCandidateDeleted={handleCandidateUpdated}
            />
          )}
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
