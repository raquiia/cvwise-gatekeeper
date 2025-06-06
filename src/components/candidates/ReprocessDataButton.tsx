
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import { useActiveJob } from '@/context/ActiveJobContext';
import { candidateService } from '@/services/data/candidateService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from '@/components/ui/label';

const ReprocessDataButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [onlyNewCandidates, setOnlyNewCandidates] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [candidateCount, setCandidateCount] = useState<number | null>(null);
  const { toast } = useToast();
  const { activeJobOfferId, activeJobOfferTitle } = useActiveJob();
  const { recalculateAllScores, isGlobalRecalculating } = useAIScoring();

  const fetchCandidatesToProcess = async () => {
    try {
      setIsFetching(true);
      const candidates = await candidateService.getUserCandidates();
      const candidateIds = candidates.map(c => c.id!).filter(Boolean);
      setCandidateCount(candidateIds.length);
      return candidateIds;
    } catch (error) {
      console.error("Erreur lors de la récupération des candidats:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la liste des candidats",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsFetching(false);
    }
  };

  const handleRecalculateScores = async () => {
    const candidateIds = await fetchCandidatesToProcess();
    if (candidateIds.length === 0) return;

    try {
      setIsOpen(false);
      await recalculateAllScores(candidateIds, onlyNewCandidates);
    } catch (error) {
      console.error("Erreur lors du recalcul des scores:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du recalcul des scores",
        variant: "destructive",
      });
    }
  };

  const buttonText = activeJobOfferId 
    ? `Calculer les correspondances${activeJobOfferTitle ? ` pour "${activeJobOfferTitle}"` : ''}` 
    : "Recalculer les scores AI";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => fetchCandidatesToProcess()}
          disabled={isGlobalRecalculating}
        >
          {isGlobalRecalculating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : activeJobOfferId ? (
            <Calculator className="h-4 w-4" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {buttonText}
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {activeJobOfferId 
              ? `Calculer les correspondances avec l'offre` 
              : "Recalculer les scores AI"}
          </DialogTitle>
          <DialogDescription>
            {isFetching ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Préparation des données...</span>
              </div>
            ) : (
              <>
                <p className="mb-2">
                  {activeJobOfferId 
                    ? `Cette opération va ${onlyNewCandidates ? "calculer les scores de correspondance uniquement pour les nouveaux candidats sans score" : "recalculer les scores de correspondance pour tous les candidats"} avec l'offre${activeJobOfferTitle ? ` "${activeJobOfferTitle}"` : ''}.`
                    : `Cette opération va ${onlyNewCandidates ? "calculer les scores uniquement pour les candidats sans score" : "recalculer les scores pour tous les candidats"}.`}
                </p>
                {candidateCount !== null && (
                  <p className="font-medium mt-2">
                    {candidateCount} candidats disponibles au total.
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox 
                    id="onlyNew" 
                    checked={onlyNewCandidates} 
                    onCheckedChange={(checked) => setOnlyNewCandidates(checked === true)}
                  />
                  <Label htmlFor="onlyNew" className="font-normal">
                    Traiter uniquement les candidats sans score existant
                  </Label>
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleRecalculateScores} 
            disabled={isFetching || candidateCount === 0}
          >
            {onlyNewCandidates ? "Calculer les nouveaux scores" : "Tout recalculer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReprocessDataButton;
