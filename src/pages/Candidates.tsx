
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
import { useMediaQuery } from '@/hooks/use-media-query';
import { semanticMatchingService } from '@/services/semantic/semanticMatchingService';

const Candidates = () => {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateData[]>([]);
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
      const data = await candidateDataService.getUserCandidates();
      console.log("Retrieved candidates:", data);
      
      if (Array.isArray(data)) {
        // Sort candidates by updated_at in descending order (newest first)
        const sortedCandidates = [...data].sort((a, b) => 
          new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime()
        );
        setCandidates(sortedCandidates);
        setFilteredCandidates(sortedCandidates); // Initialize filtered candidates with all candidates
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

  // Filter candidates when status is changed
  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    
    let result = [...candidates];
    
    // Filter by status
    if (selectedStatus) {
      result = result.filter(candidate => candidate.status === selectedStatus);
    }
    
    setFilteredCandidates(result);
  }, [selectedStatus, candidates]);

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
  
  // Implement the actual filtering logic
  const handleApplyFilters = () => {
    console.log("Applying filters:", { location, company, previousCompany, experience, selectedSkills, semanticSearch });
    
    if (!candidates || candidates.length === 0) return;
    
    let result = [...candidates];
    
    // Filter by status (applied separately through the status filter)
    if (selectedStatus) {
      result = result.filter(candidate => candidate.status === selectedStatus);
    }
    
    // Filter by location
    if (location) {
      result = result.filter(candidate => {
        const candidateLocation = candidate.location || '';
        return candidateLocation.toLowerCase().includes(location.toLowerCase());
      });
    }
    
    // Filter by current company
    if (company) {
      result = result.filter(candidate => {
        const candidateCompany = candidate.company || '';
        return candidateCompany.toLowerCase().includes(company.toLowerCase());
      });
    }
    
    // Filter by previous company
    if (previousCompany) {
      result = result.filter(candidate => {
        // Check in experiences array for previous companies
        const experiences = Array.isArray(candidate.experiences) ? candidate.experiences : [];
        return experiences.some(exp => {
          const companyName = typeof exp === 'object' && exp ? exp.company || '' : '';
          return companyName.toLowerCase().includes(previousCompany.toLowerCase());
        });
      });
    }
    
    // Filter by experience level
    if (experience !== 'all') {
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
    }
    
    // Filter by skills
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
    
    // Apply semantic search if provided
    if (semanticSearch) {
      result = result.filter(candidate => {
        // Get the searchable text from the candidate
        const candidateText = semanticMatchingService.getCandidateSearchableText(candidate);
        
        // Check if there's a semantic match between the query and candidate text
        return semanticMatchingService.isSemanticMatch({
          query: semanticSearch,
          candidateText,
          threshold: 0.5
        });
      });
    }
    
    // Update the filtered candidates
    setFilteredCandidates(result);
    
    // Show feedback to the user
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
    
    // Reset to original candidates list filtered only by status
    if (selectedStatus) {
      setFilteredCandidates(candidates.filter(candidate => candidate.status === selectedStatus));
    } else {
      setFilteredCandidates(candidates);
    }
    
    toast({
      title: "Filtres réinitialisés",
      description: "Tous les filtres ont été réinitialisés.",
    });
  };

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
          
          {/* Filters displayed above candidate list when showFilters is true */}
          {showFilters && (
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
          
          {/* Main content - candidates table */}
          <div className="transition-all duration-300 mx-auto">
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
    </Layout>
  );
};

export default Candidates;
