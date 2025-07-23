
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, RefreshCw, Zap } from 'lucide-react';
import { JobOffer } from '@/services/data/job-offers/types';
import { useActiveJob } from '@/context/ActiveJobContext';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MatchingTabs from './MatchingTabs';
import EnhancedCandidateMatchItem from './EnhancedCandidateMatchItem';
import MatchingModeToggle from './MatchingModeToggle';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

interface CandidatesMatchingSectionProps {
  candidateMatches: ExtendedCandidateMatch[];
  jobOffer: JobOffer;
  onViewCandidate: (candidateId: string) => void;
  onRecalculateMatches: (globalMode?: boolean, forceRecalculation?: boolean) => void;
  matchLoading: boolean;
  renderMatchedSkills: (candidateId: string, jobOfferId: string) => React.ReactNode;
  renderMissingSkills: (candidateId: string, jobOfferId: string) => React.ReactNode;
}

const CandidatesMatchingSection: React.FC<CandidatesMatchingSectionProps> = ({
  candidateMatches,
  jobOffer,
  onViewCandidate,
  onRecalculateMatches,
  matchLoading,
  renderMatchedSkills,
  renderMissingSkills
}) => {
  const { activeJobOfferId, setActiveJobOffer } = useActiveJob();
  const [isGlobalMode, setIsGlobalMode] = useState(false);
  
  useEffect(() => {
    if (!activeJobOfferId && jobOffer?.id) {
      console.log('Setting active job offer to:', jobOffer.id);
      setActiveJobOffer(jobOffer.id, jobOffer.title || '')
        .catch(err => {
          console.error('Error setting active job offer:', err);
          toast({
            title: 'Erreur',
            description: 'Impossible de définir cette offre comme offre active',
            variant: 'destructive'
          });
        });
    }
  }, [activeJobOfferId, jobOffer, setActiveJobOffer]);

  const handleModeChange = (globalMode: boolean) => {
    console.log(`[CandidatesMatchingSection] 🔄 Mode change: ${globalMode ? 'GLOBAL' : 'LOCAL'}`);
    setIsGlobalMode(globalMode);
    // Recalculer automatiquement avec le nouveau mode
    onRecalculateMatches(globalMode, false);
  };

  const handleSmartRecalculate = () => {
    onRecalculateMatches(isGlobalMode, false); // Utiliser le cache intelligent
  };

  const handleForceRecalculate = () => {
    onRecalculateMatches(isGlobalMode, true); // Forcer le recalcul complet
  };

  // Calculer les statistiques correctement
  const ownCandidatesCount = candidateMatches.filter(match => match.isOwnCandidate).length;
  const totalCandidatesCount = candidateMatches.length;
  const otherCandidatesCount = totalCandidatesCount - ownCandidatesCount;
  
  // Calculer les statistiques de localisation
  const localCandidatesCount = candidateMatches.filter(match => !match.details?.location?.needsRelocation).length;
  const distantCandidatesCount = candidateMatches.filter(match => match.details?.location?.needsRelocation).length;

  console.log(`[CandidatesMatchingSection] 📊 Current statistics:`);
  console.log(`[CandidatesMatchingSection]    Total: ${totalCandidatesCount}`);
  console.log(`[CandidatesMatchingSection]    Own: ${ownCandidatesCount}`);
  console.log(`[CandidatesMatchingSection]    Other: ${otherCandidatesCount}`);
  console.log(`[CandidatesMatchingSection]    Local: ${localCandidatesCount}`);
  console.log(`[CandidatesMatchingSection]    Distant: ${distantCandidatesCount}`);
  console.log(`[CandidatesMatchingSection]    Mode: ${isGlobalMode ? 'GLOBAL' : 'LOCAL'}`);

  // Filtrer les candidats selon le mode - CORRECTION DE LA LOGIQUE
  const filteredMatches = isGlobalMode 
    ? candidateMatches // En mode global, on affiche tous les candidats
    : candidateMatches.filter(match => match.isOwnCandidate); // En mode local, seulement les nôtres

  console.log(`[CandidatesMatchingSection] 📋 Filtered matches: ${filteredMatches.length}`);

  const renderCandidateList = (matches: ExtendedCandidateMatch[], sortKey: 'local' | 'distant') => {
    if (matches.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {sortKey === 'local' 
              ? "Aucun candidat local trouvé" 
              : "Aucun candidat distant trouvé"
            }
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={handleSmartRecalculate}
            disabled={matchLoading}
          >
            <Zap className="mr-2 h-4 w-4" />
            Calculer les correspondances
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {matches.map((match) => (
          <EnhancedCandidateMatchItem
            key={match.candidateId}
            match={match}
            onViewCandidate={onViewCandidate}
            sortKey={sortKey}
            renderMatchedSkills={renderMatchedSkills}
            renderMissingSkills={renderMissingSkills}
            jobId={jobOffer.id!}
            showOwner={isGlobalMode}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Candidats correspondants
              <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                <Zap className="h-3 w-3" />
                Cache intelligent
              </div>
            </CardTitle>
            <CardDescription>
              {isGlobalMode 
                ? `${filteredMatches.length} candidat${filteredMatches.length !== 1 ? 's' : ''} affiché${filteredMatches.length !== 1 ? 's' : ''} (${ownCandidatesCount} vôtre${ownCandidatesCount !== 1 ? 's' : ''}, ${otherCandidatesCount} autre${otherCandidatesCount !== 1 ? 's' : ''})`
                : `${filteredMatches.length} candidat${filteredMatches.length !== 1 ? 's' : ''} affiché${filteredMatches.length !== 1 ? 's' : ''} (vos candidats uniquement)`
              }
              <span className="text-xs text-muted-foreground ml-2">
                • {localCandidatesCount} locaux • {distantCandidatesCount} distants
              </span>
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                disabled={matchLoading}
              >
                {matchLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calcul en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualiser
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSmartRecalculate}>
                <Zap className="mr-2 h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Actualisation intelligente</div>
                  <div className="text-xs text-muted-foreground">Utilise le cache pour les scores existants</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleForceRecalculate}>
                <RefreshCw className="mr-2 h-4 w-4 text-orange-600" />
                <div>
                  <div className="font-medium">Recalcul complet</div>
                  <div className="text-xs text-muted-foreground">Recalcule tous les scores (plus lent)</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <MatchingModeToggle
          isGlobalMode={isGlobalMode}
          onModeChange={handleModeChange}
          totalCandidates={totalCandidatesCount}
          ownCandidates={ownCandidatesCount}
        />

        {filteredMatches.length > 0 ? (
          <div className="mt-4">
            <MatchingTabs 
              candidateMatches={filteredMatches}
            >
              {renderCandidateList}
            </MatchingTabs>
          </div>
        ) : (
          <div className="text-center py-8 mt-4">
            <p className="text-muted-foreground">
              {isGlobalMode 
                ? "Aucun candidat trouvé dans la base de données globale" 
                : "Aucun candidat correspondant trouvé parmi vos candidats"
              }
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleSmartRecalculate}
              disabled={matchLoading}
            >
              <Zap className="mr-2 h-4 w-4" />
              Calculer les correspondances
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidatesMatchingSection;
