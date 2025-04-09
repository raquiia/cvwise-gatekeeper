
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CandidatesHeader from '@/components/candidates/CandidatesHeader';
import CandidatesTable from '@/components/candidates/CandidatesTable';
import CandidatesFilters from '@/components/candidates/CandidatesFilters';
import MockDataAlert from '@/components/candidates/MockDataAlert';
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

  // Filter candidates based on selected status
  const filteredCandidates = selectedStatus
    ? candidates.filter(candidate => candidate.status === selectedStatus)
    : candidates;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <CandidatesHeader 
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onToggleFilters={handleToggleFilters}
          showFilters={showFilters}
        />
        
        <div className="flex flex-col md:flex-row gap-6 my-6">
          <div className="w-full md:w-72">
            <CandidatesFilters 
              showFilters={showFilters}
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
              onReset={() => {}}
            />
          </div>
          
          <div className="flex-1">
            <MockDataAlert />
            
            <CandidatesTable 
              candidates={filteredCandidates}
              selectedStatus={selectedStatus}
              onStatusChange={handleStatusChange}
              onViewCandidate={handleViewCandidate}
              onCandidateDeleted={fetchCandidates}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Candidates;
