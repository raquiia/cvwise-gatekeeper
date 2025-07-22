
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calculator, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useActiveJob } from '@/context/ActiveJobContext';
import { candidateService } from '@/services/data/candidateService';
import { matchDbService } from '@/services/data/candidate-matching/matchDbService';
import { intelligentCache } from '@/services/cache/intelligentCacheService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ReprocessDataButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [candidateCount, setCandidateCount] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Safe access to ActiveJob context with fallback
  let activeJobOfferId: string | null = null;
  let activeJobOfferTitle: string | null = null;
  
  try {
    const { activeJobOfferId: jobId, activeJobOfferTitle: jobTitle } = useActiveJob();
    activeJobOfferId = jobId;
    activeJobOfferTitle = jobTitle;
  } catch (error) {
    // Context not available, use defaults
    console.warn('ActiveJobProvider not available, using defaults');
  }

  const fetchCandidatesToProcess = async () => {
    try {
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
    }
  };

  const handleIntelligentRefresh = async () => {
    if (!activeJobOfferId) {
      toast({
        title: "Information",
        description: "Aucune offre d'emploi active sélectionnée",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Actualisation intelligente des scores...');
      
      // Recalcul intelligent (utilise le cache quand possible)
      const matches = await matchDbService.calculateMatchesForJobOffer(activeJobOfferId, false);
      
      toast({
        title: "✅ Actualisation terminée",
        description: `${matches.length} candidats traités avec cache intelligent`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'actualisation intelligente:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les scores",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleForceRecalculate = async () => {
    if (!activeJobOfferId) {
      toast({
        title: "Information",
        description: "Aucune offre d'emploi active sélectionnée",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('⚡ Recalcul complet forcé...');
      
      // Vider les caches liés à cette offre
      intelligentCache.invalidatePattern(`*${activeJobOfferId}*`);
      console.log('🗑️ Cache intelligent vidé');
      
      // Force le recalcul complet
      const matches = await matchDbService.forceRecalculateAllScores(activeJobOfferId, false);
      
      toast({
        title: "✅ Recalcul complet terminé",
        description: `${matches.length} candidats recalculés entièrement`,
      });
    } catch (error) {
      console.error('Erreur lors du recalcul forcé:', error);
      toast({
        title: "Erreur",
        description: "Impossible de forcer le recalcul",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const buttonText = activeJobOfferId 
    ? `Actualiser les correspondances${activeJobOfferTitle ? ` pour "${activeJobOfferTitle}"` : ''}` 
    : "Actualiser les scores";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => fetchCandidatesToProcess()}
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
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
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-600" />
            Actualisation des scores de matching
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-4">
              {activeJobOfferId ? (
                <div>
                  <p className="font-medium mb-2">
                    Offre active : {activeJobOfferTitle || 'Sans titre'}
                  </p>
                  
                  {candidateCount !== null && (
                    <p className="text-sm text-gray-600">
                      {candidateCount} candidats seront traités.
                    </p>
                  )}
                  
                  <div className="bg-blue-50 p-3 rounded-lg mt-3">
                    <p className="text-sm text-blue-700 font-medium mb-2">
                      💡 Choisissez le type d'actualisation :
                    </p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• <strong>Intelligente</strong> : Utilise le cache pour optimiser les performances</li>
                      <li>• <strong>Complète</strong> : Recalcule tout depuis zéro (plus lent mais à jour)</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Aucune offre d'emploi active sélectionnée.
                    Sélectionnez une offre d'abord pour calculer les correspondances.
                  </p>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Annuler
          </Button>
          
          {activeJobOfferId && (
            <>
              <Button 
                onClick={handleIntelligentRefresh}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Actualisation intelligente
              </Button>
              
              <Button 
                onClick={handleForceRecalculate}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Recalcul complet
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReprocessDataButton;
