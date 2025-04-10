
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
import { Table, TableHeader, TableRow, TableHead, TableBody } from '@/components/ui/table';
import { Card } from '@/components/ui/card';

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
    <div className="animate-fade-in transition-all">
      <Card className="overflow-hidden border border-purple-200/30 dark:border-purple-900/20 shadow-xl bg-white/50 dark:bg-navy-dark/30 backdrop-blur-sm rounded-xl">
        {/* Table Header with Sort Controls */}
        <div className="p-4 border-b border-purple-100/50 dark:border-purple-900/30 backdrop-blur-sm flex items-center justify-between bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-navy-dark/90 dark:to-purple-950/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-navy-dark dark:text-sand">
              {candidatesCount} candidats
            </span>
            
            <Separator orientation="vertical" className="h-4" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-purple-700 dark:hover:text-purple-300">
                  <span>Statut</span>
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-purple-100/50 shadow-lg dark:bg-navy-dark/95 dark:border-purple-800/30">
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
                  className="gap-1 border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  disabled={isLoading}
                >
                  <Briefcase size={14} className="mr-1 text-purple-600 dark:text-purple-400" />
                  Activer une offre d'emploi
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
          
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-purple-700 dark:hover:text-purple-300"
                >
                  <ArrowUpDown size={14} className="mr-1" />
                  Trier
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-purple-100/50 shadow-lg dark:bg-navy-dark/95 dark:border-purple-800/30">
                <DropdownMenuItem onClick={() => handleSortChange('name')} className={sortBy === 'name' ? "bg-purple-50 dark:bg-purple-900/20" : ""}>
                  Par nom
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('date')} className={sortBy === 'date' ? "bg-purple-50 dark:bg-purple-900/20" : ""}>
                  Par date de mise à jour
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-purple-700 dark:hover:text-purple-300"
            >
              <SlidersHorizontal size={14} className="mr-1" />
              Colonnes
            </Button>
          </div>
        </div>
        
        {/* Table Body */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-800/40 scrollbar-track-transparent">
          <Table>
            <TableHeader className="bg-gradient-to-r from-purple-50/80 to-white/80 dark:from-purple-900/20 dark:to-navy-dark/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-sm font-medium text-navy-dark dark:text-sand">Nom</TableHead>
                <TableHead className="text-sm font-medium text-navy-dark dark:text-sand">Poste</TableHead>
                <TableHead className="text-sm font-medium text-navy-dark dark:text-sand">Entreprise</TableHead>
                <TableHead className="text-sm font-medium text-navy-dark dark:text-sand hidden lg:table-cell">Localisation</TableHead>
                <TableHead className="text-sm font-medium text-navy-dark dark:text-sand hidden lg:table-cell">Expérience</TableHead>
                <TableHead className="text-sm font-medium text-navy-dark dark:text-sand">Compétences</TableHead>
                <TableHead className="text-sm font-medium text-navy-dark dark:text-sand hidden md:table-cell">Mise à jour</TableHead>
                <TableHead className="text-center text-sm font-medium text-navy-dark dark:text-sand">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-12 h-12 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                      <p className="mt-4 text-purple-700 dark:text-purple-300 font-medium">Chargement des candidats...</p>
                    </div>
                  </td>
                </TableRow>
              ) : validCandidates.length === 0 ? (
                <TableRow>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-20 h-20 text-purple-300 dark:text-purple-700 opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
                        </svg>
                      </div>
                      <p className="mt-4 text-lg font-medium text-purple-700 dark:text-purple-300">Aucun candidat trouvé</p>
                      <p className="mt-2 text-muted-foreground text-center max-w-md">
                        Importez des CV pour commencer à créer des profils de candidats.
                      </p>
                    </div>
                  </td>
                </TableRow>
              ) : (
                validCandidates.map((candidate) => (
                  <CandidateTableRow 
                    key={candidate.id || `temp-${Math.random()}`}
                    candidate={candidate}
                    onViewCandidate={onViewCandidate}
                    onCandidateDeleted={handleCandidateDeleted}
                    hideScore={true}
                    scoreIsMatchScore={!!activeJobOfferId}
                    matchDetails={candidate.matchDetails}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default CandidatesTable;
