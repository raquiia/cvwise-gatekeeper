
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw, Bug, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { candidateDataService } from '@/services/data/candidateDataService';
import { CandidateData } from '@/services/data/resumeDataService';
import CandidatesHeader from '@/components/candidates/CandidatesHeader';
import CandidatesFilters from '@/components/candidates/CandidatesFilters';
import CandidatesTable from '@/components/candidates/CandidatesTable';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { semanticMatchingService } from '@/services/semantic/semanticMatchingService';

const Candidates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  const [locationFilter, setLocationFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [previousCompanyFilter, setPreviousCompanyFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const [semanticSearchFilter, setSemanticSearchFilter] = useState('');
  const [activeFilters, setActiveFilters] = useState<{
    location: string;
    company: string;
    previousCompany: string;
    experience: string;
    skills: string[];
    semanticSearch: string;
  }>({
    location: '',
    company: '',
    previousCompany: '',
    experience: '',
    skills: [],
    semanticSearch: ''
  });
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
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
      const data = await candidateDataService.getUserCandidates(user.id);
      console.log("Retrieved candidates:", data);
      
      if (Array.isArray(data)) {
        setCandidates(data);
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
  }, [user, location.key]);
  
  const applyFiltersToCandidate = (candidate: CandidateData) => {
    if (activeFilters.location && (!candidate.location || 
        !candidate.location.toLowerCase().includes(activeFilters.location.toLowerCase()))) {
      return false;
    }
    
    // Filtre par entreprise actuelle
    if (activeFilters.company) {
      const candidateCurrentCompany = candidate.company?.toLowerCase() || '';
      
      if (!candidateCurrentCompany.includes(activeFilters.company.toLowerCase())) {
        return false;
      }
    }
    
    // Filtre par entreprises précédentes
    if (activeFilters.previousCompany) {
      const candidatePreviousCompanies = Array.isArray(candidate.experiences) 
        ? candidate.experiences
            .filter((exp: any) => exp.company !== candidate.company) // Exclure l'entreprise actuelle
            .map((exp: any) => exp.company?.toLowerCase() || '')
        : [];
        
      const hasWorkedFor = candidatePreviousCompanies.some(company => 
        company.includes(activeFilters.previousCompany.toLowerCase())
      );
      
      if (!hasWorkedFor) {
        return false;
      }
    }
    
    if (activeFilters.experience && activeFilters.experience !== 'all') {
      const [minExp, maxExp] = activeFilters.experience.split('-').map(Number);
      
      if (activeFilters.experience === '10+') {
        if (!candidate.years_experience || candidate.years_experience < 10) {
          return false;
        }
      } else if (minExp && maxExp) {
        if (!candidate.years_experience || 
            candidate.years_experience < minExp || 
            candidate.years_experience > maxExp) {
          return false;
        }
      }
    }
    
    if (activeFilters.skills.length > 0) {
      const candidateSkills = Array.isArray(candidate.skills) 
        ? candidate.skills.map(skill => 
            typeof skill === 'string' ? skill.toLowerCase() : '')
        : [];
        
      const hasRequiredSkills = activeFilters.skills.some(requiredSkill => 
        candidateSkills.some(candidateSkill => 
          candidateSkill.includes(requiredSkill.toLowerCase())
        )
      );
      
      if (!hasRequiredSkills) {
        return false;
      }
    }
    
    // Filtre par recherche sémantique
    if (activeFilters.semanticSearch) {
      const candidateText = semanticMatchingService.getCandidateSearchableText(candidate);
      const isMatch = semanticMatchingService.isSemanticMatch({
        query: activeFilters.semanticSearch,
        candidateText
      });
      
      if (!isMatch) {
        return false;
      }
    }
    
    return true;
  };
  
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = !searchQuery 
      || (candidate.first_name && candidate.first_name.toLowerCase().includes(searchQuery.toLowerCase()))
      || (candidate.last_name && candidate.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
      || (candidate.position && candidate.position.toLowerCase().includes(searchQuery.toLowerCase()))
      || (candidate.skills && Array.isArray(candidate.skills) && candidate.skills.some(skill => 
          typeof skill === 'string' && skill.toLowerCase().includes(searchQuery.toLowerCase())
        ));
    
    const matchesStatus = !selectedStatus || candidate.status === selectedStatus;
    
    const matchesAdvancedFilters = applyFiltersToCandidate(candidate);
    
    return matchesSearch && matchesStatus && matchesAdvancedFilters;
  });

  const handleViewCandidate = (candidateId: string) => {
    navigate(`/candidates/${candidateId}`);
  };
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const handleApplyFilters = () => {
    setActiveFilters({
      location: locationFilter,
      company: companyFilter,
      previousCompany: previousCompanyFilter,
      experience: experienceFilter,
      skills: skillsFilter,
      semanticSearch: semanticSearchFilter
    });
    
    toast({
      title: "Filtres appliqués",
      description: `${filteredCandidates.length} candidats correspondent à vos critères`,
    });
  };
  
  const handleResetFilters = () => {
    setLocationFilter('');
    setCompanyFilter('');
    setPreviousCompanyFilter('');
    setExperienceFilter('');
    setSkillsFilter([]);
    setSemanticSearchFilter('');
    setActiveFilters({
      location: '',
      company: '',
      previousCompany: '',
      experience: '',
      skills: [],
      semanticSearch: ''
    });
    
    toast({
      description: "Les filtres ont été réinitialisés",
    });
  };
  
  const handleRefresh = () => {
    fetchCandidates();
  };
  
  const handleCandidateDeleted = () => {
    fetchCandidates();
  };
  
  const toggleDebug = () => {
    setShowDebug(prev => !prev);
  };
  
  const activeFilterCount = Object.values(activeFilters).filter(value => 
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  ).length;
  
  if (loading) {
    return (
      <Layout className="py-8 bg-sand/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-navy" />
            <span className="ml-2">Chargement des candidats...</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        <CandidatesHeader 
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onToggleFilters={handleToggleFilters}
          showFilters={showFilters}
        />
        
        <div className="flex justify-end items-center gap-2 mb-4">
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleResetFilters}
            >
              <Filter size={16} />
              {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''} actif{activeFilterCount > 1 ? 's' : ''}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDebug}
            title="Mode Debug"
          >
            <Bug size={16} />
          </Button>
        </div>
        
        {showDebug && (
          <Accordion type="single" collapsible className="mb-6 bg-slate-50 border rounded-md">
            <AccordionItem value="debug">
              <AccordionTrigger className="px-4">Informations de débogage</AccordionTrigger>
              <AccordionContent className="px-4 space-y-2">
                <div>
                  <p className="font-medium">User ID:</p>
                  <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto">{user?.id || 'Non connecté'}</pre>
                </div>
                <div>
                  <p className="font-medium">Filtres actifs:</p>
                  <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(activeFilters, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="font-medium">Données de candidats:</p>
                  <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(candidates, null, 2)}
                  </pre>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        <CandidatesFilters 
          showFilters={showFilters}
          onLocationChange={setLocationFilter}
          onCompanyChange={setCompanyFilter}
          onPreviousCompanyChange={setPreviousCompanyFilter}
          onExperienceChange={setExperienceFilter}
          onSkillsChange={setSkillsFilter}
          onSemanticSearchChange={setSemanticSearchFilter}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          location={locationFilter}
          company={companyFilter}
          previousCompany={previousCompanyFilter}
          experience={experienceFilter}
          semanticSearch={semanticSearchFilter}
          selectedSkills={skillsFilter}
        />
        
        {error ? (
          <div className="my-8 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="gap-2">
              <RefreshCw size={16} />
              Réessayer
            </Button>
          </div>
        ) : (
          <>
            {candidates.length === 0 ? (
              <div className="my-8 p-6 bg-muted rounded-lg text-center">
                <h3 className="text-lg font-medium mb-2">Aucun candidat trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  Importez des CV et analysez-les pour créer des candidats.
                </p>
                <Button onClick={() => navigate('/resumes/upload')} className="gap-2">
                  Importer un CV
                </Button>
              </div>
            ) : (
              <>
                {filteredCandidates.length === 0 ? (
                  <div className="my-8 p-6 bg-muted rounded-lg text-center">
                    <h3 className="text-lg font-medium mb-2">Aucun candidat ne correspond à vos critères</h3>
                    <p className="text-muted-foreground mb-4">
                      Essayez de modifier vos filtres pour voir plus de résultats.
                    </p>
                    <Button onClick={handleResetFilters} variant="outline" className="gap-2">
                      Réinitialiser les filtres
                    </Button>
                  </div>
                ) : (
                  <CandidatesTable 
                    candidates={filteredCandidates}
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                    onViewCandidate={handleViewCandidate}
                    onCandidateDeleted={handleCandidateDeleted}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Candidates;
