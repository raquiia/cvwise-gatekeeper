
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calculator, FileSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const ReprocessDataButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [candidateCount, setCandidateCount] = useState<number | null>(null);
  const { toast } = useToast();
  const { activeJobOfferId, activeJobOfferTitle } = useActiveJob();

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

  const handleAnalyzeResumes = () => {
    setIsOpen(false);
    toast({
      title: "Information",
      description: "Les scores IA sont maintenant calculés automatiquement lors de l'analyse des CV. Rendez-vous dans la section 'CV' pour analyser vos documents.",
    });
  };

  const buttonText = activeJobOfferId 
    ? `Calculer les correspondances${activeJobOfferTitle ? ` pour "${activeJobOfferTitle}"` : ''}` 
    : "Calculer les scores AI";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => fetchCandidatesToProcess()}
        >
          {activeJobOfferId ? (
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
            <FileSearch className="h-5 w-5 text-purple-600" />
            Calcul des scores IA
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-3">
              <p>
                Les scores IA sont maintenant calculés automatiquement lors de l'analyse des CV avec OpenAI.
              </p>
              
              {candidateCount !== null && (
                <p className="font-medium">
                  {candidateCount} candidats disponibles au total.
                </p>
              )}
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-2">
                  💡 Pour obtenir des scores IA :
                </p>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Rendez-vous dans la section "CV"</li>
                  <li>• Analysez ou ré-analysez vos CV</li>
                  <li>• Les scores seront calculés automatiquement</li>
                  {activeJobOfferId && (
                    <li>• Les scores de correspondance seront mis à jour</li>
                  )}
                </ul>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fermer
          </Button>
          <Button onClick={handleAnalyzeResumes} className="bg-purple-600 hover:bg-purple-700">
            Aller aux CV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReprocessDataButton;
