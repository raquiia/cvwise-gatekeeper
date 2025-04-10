
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CandidatesHeader from '@/components/candidates/CandidatesHeader';
import CandidatesTable from '@/components/candidates/CandidatesTable';
import CandidatesFilters from '@/components/candidates/CandidatesFilters';
import { candidateDataService } from '@/services/data/candidateDataService';
import { CandidateData } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const Candidates = () => {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [location, setLocation] = useState('');
  const [company, setCompany] = useState('');
  const [previousCompany, setPreviousCompany] = useState('');
  const [experience, setExperience] = useState('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [semanticSearch, setSemanticSearch] = useState('');
  
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
      const data = await candidateDataService.getUserCandidates();
      console.log("Retrieved candidates:", data);
      
      if (Array.isArray(data)) {
        // Sort candidates by updated_at in descending order (newest first)
        const sortedCandidates = [...data].sort((a, b) => 
          new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime()
        );
        setCandidates(sortedCandidates);
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
    // Apply filters to candidate data
    console.log("Applying filters:", { location, company, previousCompany, experience, selectedSkills, semanticSearch });
    // TODO: Implement actual filtering logic
  };
  
  const handleResetFilters = () => {
    setLocation('');
    setCompany('');
    setPreviousCompany('');
    setExperience('all');
    setSelectedSkills([]);
    setSemanticSearch('');
  };

  // Filter candidates based on selected status
  const filteredCandidates = selectedStatus
    ? candidates.filter(candidate => candidate.status === selectedStatus)
    : candidates;

  return (
    <Layout>
      <div className="relative min-h-screen overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-white/20 dark:from-purple-950/20 dark:to-navy-dark/0 pointer-events-none"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-purple-200/20 dark:bg-purple-900/10 rounded-full filter blur-3xl opacity-70 transform translate-x-1/2 -translate-y-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/20 dark:bg-blue-900/10 rounded-full filter blur-3xl opacity-70 transform -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <CandidatesHeader 
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onToggleFilters={handleToggleFilters}
            showFilters={showFilters}
          />
          
          <div className="flex flex-col md:flex-row gap-6 my-6">
            <div className={`w-full md:w-72 transition-all duration-300 ${showFilters ? 'opacity-100 max-h-[2000px]' : 'opacity-0 md:opacity-100 max-h-0 md:max-h-[2000px] overflow-hidden md:overflow-visible'}`}>
              <div className="sticky top-24">
                <CandidatesFilters 
                  showFilters={showFilters}
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
            </div>
            
            <div className="flex-1 transition-all duration-300">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-12 h-12 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                  <p className="ml-4 text-purple-700 dark:text-purple-300 font-medium">Chargement des candidats...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4 text-red-700 dark:text-red-300">
                  {error}
                </div>
              ) : (
                <CandidatesTable 
                  candidates={filteredCandidates}
                  selectedStatus={selectedStatus}
                  onStatusChange={handleStatusChange}
                  onViewCandidate={handleViewCandidate}
                  onCandidateDeleted={fetchCandidates}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Candidates;
