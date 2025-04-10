
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
import CandidateTableRow from './CandidateTableRow';
import { useToast } from '@/hooks/use-toast';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { candidateMatchingService } from '@/services/data/candidateMatchingService';

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
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  
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
  
  // Update candidate list when candidates change or sort criteria changes
  useEffect(() => {
    if (!candidates || candidates.length === 0) {
      setCandidatesWithScores([]);
      return;
    }
    
    // Copy candidates to avoid mutation issues
    const updatedCandidates = [...candidates];
    
    // Sort candidates based on sort criteria
    sortCandidates(updatedCandidates, sortBy);
    
    setCandidatesWithScores(updatedCandidates);
  }, [candidates, sortBy]);
  
  // Function to sort candidates based on sort criteria
  const sortCandidates = (candidatesList: CandidateData[], criteria: 'name' | 'date') => {
    switch(criteria) {
      case 'name':
        candidatesList.sort((a, b) => 
          `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        );
        break;
      case 'date':
        // Sort by updated_at in descending order (newest first)
        candidatesList.sort((a, b) => 
          new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime()
        );
        break;
    }
  };
  
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
  
  const handleSortChange = (criteria: 'name' | 'date') => {
    setSortBy(criteria);
  };
  
  // Debug: Log the candidates data being received
  console.log('CandidatesTable - received candidates:', candidates);
  
  // Check if we have valid candidates data
  const validCandidates = Array.isArray(candidatesWithScores) ? candidatesWithScores : [];
  const candidatesCount = validCandidates.length;
  
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
    <div className="glass rounded-xl overflow-hidden">
      {/* Table Header with Sort Controls */}
      <div className="p-4 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-navy-dark">
            {candidatesCount} candidats
          </span>
          
          <Separator orientation="vertical" className="h-4" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-navy-dark">
                <span>Statut</span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onStatusChange(null)}>
                Tous
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange('active')}>
                <CheckCircle size={14} className="mr-2 text-emerald-500" />
                Actifs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange('qualification')}>
                <AlertTriangle size={14} className="mr-2 text-amber-500" />
                En qualification
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange('inactive')}>
                <XCircle size={14} className="mr-2 text-red-500" />
                Inactifs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                disabled={isLoading}
              >
                <Briefcase size={14} className="mr-1" />
                Activer une offre d'emploi
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
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
                    className={activeJobOfferId === offer.id ? "bg-muted" : ""}
                  >
                    {offer.title}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-navy-dark">
                <ArrowUpDown size={14} className="mr-1" />
                Trier
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSortChange('name')} className={sortBy === 'name' ? "bg-muted" : ""}>
                Par nom
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('date')} className={sortBy === 'date' ? "bg-muted" : ""}>
                Par date de mise à jour
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-navy-dark">
            <SlidersHorizontal size={14} className="mr-1" />
            Colonnes
          </Button>
        </div>
      </div>
      
      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-navy/5">
              <th className="text-left p-4 text-sm font-medium text-navy-dark">Nom</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark">Poste</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark">Entreprise</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark hidden lg:table-cell">Localisation</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark hidden lg:table-cell">Expérience</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark">Compétences</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark hidden md:table-cell">Mise à jour</th>
              <th className="text-center p-4 text-sm font-medium text-navy-dark">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  Chargement des candidats...
                </td>
              </tr>
            ) : validCandidates.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  Aucun candidat trouvé. Importez des CV pour commencer à créer des candidats.
                </td>
              </tr>
            ) : (
              validCandidates.map((candidate) => (
                <CandidateTableRow 
                  key={candidate.id || `temp-${Math.random()}`}
                  candidate={candidate}
                  onViewCandidate={onViewCandidate}
                  onCandidateDeleted={handleCandidateDeleted}
                  scoreIsMatchScore={!!activeJobOfferId}
                  matchDetails={candidate.matchDetails}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidatesTable;
