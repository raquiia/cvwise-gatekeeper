
import React, { useEffect, useState } from 'react';
import { ArrowUpDown, SlidersHorizontal, ChevronDown, CheckCircle, XCircle, AlertTriangle, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CandidateData } from '@/services/data/candidateService';
import ModernCandidatesTable from './ModernCandidatesTable';
import ModernTableView from './ModernTableView';
import { useToast } from '@/hooks/use-toast';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { candidateMatchingService } from '@/services/data/candidateMatchingService';
import { useContextualScoring } from '@/hooks/use-contextual-scoring';
import { CANDIDATE_STATUS_LABELS, CANDIDATE_STATUSES } from '@/services/data/candidateStatusService';

interface CandidatesTableProps {
  candidates: CandidateData[];
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({
  candidates,
  selectedStatus,
  onStatusChange,
  onViewCandidate,
  onCandidateDeleted
}) => {
  const { toast } = useToast();
  const [jobOffers, setJobOffers] = useState<any[]>([]);
  const [candidatesWithScores, setCandidatesWithScores] = useState<CandidateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  
  const { 
    activeJobOfferId, 
    activeJobOfferTitle, 
    updateActiveJobOffer, 
    isJobSpecific 
  } = useContextualScoring();
  
  // Fetch job offers on component mount
  useEffect(() => {
    const fetchJobOffers = async () => {
      try {
        const offers = await jobOfferService.getUserJobOffers();
        setJobOffers(offers);
        
        // Check if there's an active job offer
        const currentActiveId = candidateMatchingService.getActiveJobOfferId();
        if (currentActiveId) {
          const activeOffer = offers.find(offer => offer.id === currentActiveId);
          updateActiveJobOffer(currentActiveId, activeOffer?.title);
        }
      } catch (error) {
        console.error("Error fetching job offers:", error);
      }
    };
    
    fetchJobOffers();
  }, [updateActiveJobOffer]);
  
  // Update candidate list when candidates change
  useEffect(() => {
    if (!candidates || candidates.length === 0) {
      setCandidatesWithScores([]);
      return;
    }
    
    // Copy candidates to avoid mutation issues
    const updatedCandidates = [...candidates];
    
    // Log candidates to ensure detailed_status is present
    console.log("Candidates with detailed status:", updatedCandidates.map(c => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      detailed_status: c.detailed_status
    })));
    
    setCandidatesWithScores(updatedCandidates);
  }, [candidates]);
  
  // Handle changing the active job offer
  const handleJobOfferChange = async (jobOfferId: string | null) => {
    setIsLoading(true);
    try {
      if (jobOfferId) {
        console.log("Activating job offer:", jobOfferId);
        const success = await candidateMatchingService.setActiveJobOffer(jobOfferId);
        
        if (success) {
          const selectedOffer = jobOffers.find(offer => offer.id === jobOfferId);
          updateActiveJobOffer(jobOfferId, selectedOffer?.title);
          
          toast({
            title: "Offre d'emploi activée",
            description: `Les scores sont maintenant relatifs à "${selectedOffer?.title || 'cette offre'}"`,
          });
        } else {
          throw new Error("Failed to activate job offer");
        }
      } else {
        await candidateMatchingService.setActiveJobOffer(null);
        updateActiveJobOffer(null);
        
        toast({
          title: "Mode de scoring standard",
          description: "Les scores affichent maintenant la complétude des profils",
        });
      }
    } catch (error) {
      console.error("Error activating job offer:", error);
      toast({
        title: "Erreur d'activation",
        description: "Impossible d'activer cette offre d'emploi",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Debug: Log the candidates data being received
  console.log('CandidatesTable - received candidates:', candidates);
  
  // Check if we have valid candidates data
  const validCandidates = Array.isArray(candidatesWithScores) ? candidatesWithScores : [];
  
  const handleCandidateDeleted = () => {
    console.log('Candidate deleted, notifying parent component');
    toast({
      title: "Candidat supprimé",
      description: "Le candidat et le CV associé ont été supprimés avec succès",
    });
    
    if (onCandidateDeleted) {
      onCandidateDeleted();
    }
  };

  const handleSelectCandidate = (candidateId: string, selected: boolean) => {
    const newSelected = new Set(selectedCandidates);
    if (selected) {
      newSelected.add(candidateId);
    } else {
      newSelected.delete(candidateId);
    }
    setSelectedCandidates(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCandidates.size === candidatesWithScores.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(candidatesWithScores.map(c => c.id!).filter(Boolean)));
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Job Offer Selection */}
      <div className="flex justify-between items-center">
        {/* Context indicator */}
        <div className="flex items-center gap-2">
          {isJobSpecific ? (
            <Badge variant="default" className="bg-purple-100 text-purple-800">
              <Briefcase size={12} className="mr-1" />
              Scores contextuels activés
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              Scores généraux
            </Badge>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              disabled={isLoading}
            >
              <Briefcase size={14} className="mr-1 text-purple-600 dark:text-purple-400" />
              {activeJobOfferId ? (activeJobOfferTitle || "Offre active") : "Sélectionner une offre d'emploi"}
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-purple-100/50 shadow-lg dark:bg-navy-dark/95 dark:border-purple-800/30">
            <DropdownMenuItem onClick={() => handleJobOfferChange(null)}>
              Score général (sans contexte)
            </DropdownMenuItem>
            
            <Separator className="my-1" />
            
            {jobOffers.length === 0 ? (
              <DropdownMenuItem disabled>
                Aucune offre d'emploi disponible
              </DropdownMenuItem>
            ) : (
              jobOffers.map(offer => (
                <DropdownMenuItem 
                  key={offer.id} 
                  onClick={() => handleJobOfferChange(offer.id)}
                  className={activeJobOfferId === offer.id ? "bg-purple-50 dark:bg-purple-900/20" : ""}
                >
                  {offer.title}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'table' ? (
        <ModernTableView
          candidates={validCandidates}
          selectedCandidates={selectedCandidates}
          onSelectCandidate={handleSelectCandidate}
          onSelectAll={handleSelectAll}
          onViewCandidate={onViewCandidate}
          onCandidateDeleted={handleCandidateDeleted}
        />
      ) : (
        <ModernCandidatesTable
          candidates={validCandidates}
          selectedStatus={selectedStatus}
          onStatusChange={onStatusChange}
          onViewCandidate={onViewCandidate}
          onCandidateDeleted={handleCandidateDeleted}
        />
      )}
    </div>
  );
};

export default CandidatesTable;
