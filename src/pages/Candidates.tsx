
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw, Bug } from 'lucide-react';
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

const Candidates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Function to fetch candidates that we can call multiple times
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
    // This effect should run when the component mounts and when the location changes
  }, [user, location.key]);
  
  // Filtrer les candidats en fonction des critères de recherche
  const filteredCandidates = candidates.filter(candidate => {
    // Filtre par recherche (nom, poste, compétences)
    const matchesSearch = !searchQuery 
      || (candidate.first_name && candidate.first_name.toLowerCase().includes(searchQuery.toLowerCase()))
      || (candidate.last_name && candidate.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
      || (candidate.position && candidate.position.toLowerCase().includes(searchQuery.toLowerCase()))
      || (candidate.skills && Array.isArray(candidate.skills) && candidate.skills.some(skill => 
          typeof skill === 'string' && skill.toLowerCase().includes(searchQuery.toLowerCase())
        ));
    
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
  
  const handleRefresh = () => {
    fetchCandidates();
  };
  
  const toggleDebug = () => {
    setShowDebug(prev => !prev);
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
        <div className="flex justify-between items-center">
          <CandidatesHeader 
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onToggleFilters={handleToggleFilters}
          />
          
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
                  <p className="font-medium">Données de candidats:</p>
                  <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(candidates, null, 2)}
                  </pre>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        <CandidatesFilters showFilters={showFilters} />
        
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
              <CandidatesTable 
                candidates={filteredCandidates}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                onViewCandidate={handleViewCandidate}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Candidates;
