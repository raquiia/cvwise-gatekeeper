
import React, { useEffect, useState } from 'react';
import { ArrowUpDown, SlidersHorizontal, ChevronDown, CheckCircle, XCircle, AlertTriangle, Briefcase, RefreshCw, Calculator } from 'lucide-react';
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
import { useOptimizedScoring } from '@/hooks/use-optimized-scoring';
import { useActiveJob } from '@/context/ActiveJobContext';
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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  
  const { 
    activeJobOfferId, 
    activeJobOfferTitle, 
    setActiveJobOffer,
    isLoading: jobLoading 
  } = useActiveJob();
  
  const { 
    isJobSpecific,
    invalidateScores,
    preCalculateJobScores,
    recalculateAllScores,
    isRecalculating
  } = useOptimizedScoring();
  
  // Fetch job offers on component mount
  useEffect(() => {
    const fetchJobOffers = async () => {
      try {
        const offers = await jobOfferService.getUserJobOffers();
        setJobOffers(offers);
      } catch (error) {
        console.error("Error fetching job offers:", error);
      }
    };
    
    fetchJobOffers();
  }, []);
  
  // Handle changing the active job offer
  const handleJobOfferChange = async (jobOfferId: string | null) => {
    try {
      if (jobOfferId) {
        console.log("Activating job offer:", jobOfferId);
        const selectedOffer = jobOffers.find(offer => offer.id === jobOfferId);
        await setActiveJobOffer(jobOfferId, selectedOffer?.title);
        
        toast({
          title: "Offre d'emploi activée",
          description: `Les scores sont maintenant relatifs à "${selectedOffer?.title || 'cette offre'}". Calcul en cours...`,
        });
        
        // Pre-calculate scores for better performance
        setTimeout(() => {
          preCalculateJobScores();
        }, 500);
      } else {
        await setActiveJobOffer(null);
        
        toast({
          title: "Mode de scoring standard",
          description: "Les scores affichent maintenant la complétude des profils",
        });
      }
      
      // Force refresh of all scores
      invalidateScores();
    } catch (error) {
      console.error("Error activating job offer:", error);
      toast({
        title: "Erreur d'activation",
        description: "Impossible d'activer cette offre d'emploi",
        variant: "destructive"
      });
    }
  };
  
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
    if (selectedCandidates.size === candidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(candidates.map(c => c.id!).filter(Boolean)));
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Enhanced Job Offer Selection */}
      <div className="flex justify-between items-center">
        {/* Context indicator */}
        <div className="flex items-center gap-3">
          {isJobSpecific ? (
            <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">
              <Briefcase size={12} className="mr-1" />
              Scores contextuels : {activeJobOfferTitle}
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              Scores généraux de profil
            </Badge>
          )}
          
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={invalidateScores}
            className="h-8 w-8 p-0"
            title="Actualiser les scores (cache)"
          >
            <RefreshCw size={14} />
          </Button>
          
          {/* Recalculate button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={recalculateAllScores}
            disabled={isRecalculating}
            className="h-8 px-2 text-xs"
            title={isJobSpecific ? "Recalculer tous les scores pour cette offre" : "Recalculer tous les scores généraux"}
          >
            {isRecalculating ? (
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-1" />
            ) : (
              <Calculator size={14} className="mr-1" />
            )}
            Recalculer
          </Button>
          
          {/* Pre-calculate button for job scores */}
          {isJobSpecific && (
            <Button
              variant="ghost"
              size="sm"
              onClick={preCalculateJobScores}
              className="h-8 px-2 text-xs"
              title="Pré-calculer les scores en arrière-plan"
            >
              Pré-calculer
            </Button>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              disabled={jobLoading}
            >
              <Briefcase size={14} className="mr-1 text-purple-600 dark:text-purple-400" />
              {activeJobOfferId ? (activeJobOfferTitle || "Offre active") : "Sélectionner une offre d'emploi"}
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-purple-100/50 shadow-lg dark:bg-navy-dark/95 dark:border-purple-800/30 min-w-[300px]">
            <DropdownMenuItem 
              onClick={() => handleJobOfferChange(null)}
              className={!activeJobOfferId ? "bg-purple-50 dark:bg-purple-900/20" : ""}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${!activeJobOfferId ? 'bg-purple-600' : 'bg-transparent border border-gray-300'}`} />
                Score général (sans contexte)
              </div>
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
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${activeJobOfferId === offer.id ? 'bg-purple-600' : 'bg-transparent border border-gray-300'}`} />
                    <div className="flex-1">
                      <div className="font-medium">{offer.title}</div>
                      <div className="text-xs text-muted-foreground">{offer.company}</div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'table' ? (
        <ModernTableView
          candidates={candidates}
          selectedCandidates={selectedCandidates}
          onSelectCandidate={handleSelectCandidate}
          onSelectAll={handleSelectAll}
          onViewCandidate={onViewCandidate}
          onCandidateDeleted={handleCandidateDeleted}
        />
      ) : (
        <ModernCandidatesTable
          candidates={candidates}
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
