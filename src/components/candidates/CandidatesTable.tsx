
import React, { useEffect, useState } from 'react';
import { ArrowUpDown, SlidersHorizontal, ChevronDown, CheckCircle, XCircle, AlertTriangle, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CandidateData } from '@/services/data/candidateService';
import ModernCandidatesTable from './ModernCandidatesTable';
import { useToast } from '@/hooks/use-toast';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { candidateMatchingService } from '@/services/data/candidateMatchingService';
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
  const [activeJobOfferId, setActiveJobOfferId] = useState<string | null>(null);
  const [candidatesWithScores, setCandidatesWithScores] = useState<CandidateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch job offers on component mount
  useEffect(() => {
    const fetchJobOffers = async () => {
      try {
        const offers = await jobOfferService.getUserJobOffers();
        setJobOffers(offers);
        
        // Check if there's an active job offer
        const currentActiveId = candidateMatchingService.getActiveJobOfferId();
        if (currentActiveId) {
          setActiveJobOfferId(currentActiveId);
        }
      } catch (error) {
        console.error("Error fetching job offers:", error);
      }
    };
    
    fetchJobOffers();
  }, []);
  
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
          setActiveJobOfferId(jobOfferId);
          
          toast({
            title: "Offre d'emploi activée",
            description: "Les scores des candidats sont maintenant relatifs à cette offre d'emploi",
          });
        } else {
          throw new Error("Failed to activate job offer");
        }
      } else {
        await candidateMatchingService.setActiveJobOffer(null);
        setActiveJobOfferId(null);
        
        toast({
          title: "Mode de scoring standard",
          description: "Les scores des candidats sont maintenant basés sur leur qualité générale",
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
  
  const getActiveJobOfferName = () => {
    if (!activeJobOfferId || !jobOffers || jobOffers.length === 0) return null;
    const activeOffer = jobOffers.find(offer => offer.id === activeJobOfferId);
    return activeOffer ? activeOffer.title : null;
  };
  
  return (
    <div className="space-y-6">
      {/* Job Offer Selection */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              disabled={isLoading}
            >
              <Briefcase size={14} className="mr-1 text-purple-600 dark:text-purple-400" />
              {activeJobOfferId ? getActiveJobOfferName() || "Offre active" : "Activer une offre d'emploi"}
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-purple-100/50 shadow-lg dark:bg-navy-dark/95 dark:border-purple-800/30">
            <DropdownMenuItem onClick={() => handleJobOfferChange(null)}>
              Liste standard (sans contexte)
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

      {/* Modern Table Component */}
      <ModernCandidatesTable
        candidates={validCandidates}
        selectedStatus={selectedStatus}
        onStatusChange={onStatusChange}
        onViewCandidate={onViewCandidate}
        onCandidateDeleted={handleCandidateDeleted}
      />
    </div>
  );
};

export default CandidatesTable;
