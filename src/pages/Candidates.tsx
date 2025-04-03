
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { candidateDataService } from '@/services/data/candidateDataService';
import { CandidateData } from '@/services/data/resumeDataService';
import CandidatesHeader from '@/components/candidates/CandidatesHeader';
import CandidatesFilters from '@/components/candidates/CandidatesFilters';
import CandidatesTable from '@/components/candidates/CandidatesTable';

const Candidates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const data = await candidateDataService.getUserCandidates(user.id);
        setCandidates(data);
      } catch (error) {
        console.error('Error fetching candidates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCandidates();
  }, [user]);
  
  // Filtrer les candidats en fonction des critères de recherche
  const filteredCandidates = candidates.filter(candidate => {
    // Filtre par recherche (nom, poste, compétences)
    const matchesSearch = !searchQuery 
      || candidate.first_name?.toLowerCase().includes(searchQuery.toLowerCase())
      || candidate.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
      || candidate.position?.toLowerCase().includes(searchQuery.toLowerCase())
      || candidate.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filtre par statut
    const matchesStatus = !selectedStatus || candidate.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
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
        />
        
        <CandidatesFilters showFilters={showFilters} />
        
        <CandidatesTable 
          candidates={filteredCandidates}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onViewCandidate={handleViewCandidate}
        />
      </div>
    </Layout>
  );
};

export default Candidates;
