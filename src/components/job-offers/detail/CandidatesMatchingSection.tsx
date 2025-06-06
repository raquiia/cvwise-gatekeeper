
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, RefreshCw } from 'lucide-react';
import { JobOffer } from '@/services/data/job-offers/types';
import { useActiveJob } from '@/context/ActiveJobContext';
import { toast } from '@/hooks/use-toast';
import MatchingTabs from './MatchingTabs';
import EnhancedCandidateMatchItem from './EnhancedCandidateMatchItem';
import MatchingModeToggle from './MatchingModeToggle';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

interface CandidatesMatchingSectionProps {
  candidateMatches: ExtendedCandidateMatch[];
  jobOffer: JobOffer;
  onViewCandidate: (candidateId: string) => void;
  onRecalculateMatches: (globalMode?: boolean) => void;
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
    setIsGlobalMode(globalMode);
    // Recalculer automatiquement avec le nouveau mode
    onRecalculateMatches(globalMode);
  };

  // Filtrer les candidats selon le mode
  const filteredMatches = isGlobalMode ? candidateMatches : candidateMatches.filter(match => match.isOwnCandidate !== false);
  const ownCandidatesCount = candidateMatches.filter(match => match.isOwnCandidate !== false).length;
  const totalCandidatesCount = candidateMatches.length;

  const renderCandidateList = (matches: ExtendedCandidateMatch[], sortKey: 'local' | 'global' | 'skills') => {
    if (matches.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {isGlobalMode 
              ? "Aucun candidat trouvé dans la base de données globale" 
              : "Aucun candidat correspondant trouvé parmi vos candidats"
            }
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => onRecalculateMatches(isGlobalMode)}
            disabled={matchLoading}
          >
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
            </CardTitle>
            <CardDescription>
              {isGlobalMode 
                ? `${totalCandidatesCount} candidat${totalCandidatesCount !== 1 ? 's' : ''} évalué${totalCandidatesCount !== 1 ? 's' : ''} (${ownCandidatesCount} vôtre${ownCandidatesCount !== 1 ? 's' : ''})`
                : `${ownCandidatesCount} candidat${ownCandidatesCount !== 1 ? 's' : ''} évalué${ownCandidatesCount !== 1 ? 's' : ''}`
              }
            </CardDescription>
          </div>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onRecalculateMatches(isGlobalMode)}
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
                Recalculer
              </>
            )}
          </Button>
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
              onClick={() => onRecalculateMatches(isGlobalMode)}
              disabled={matchLoading}
            >
              Calculer les correspondances
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidatesMatchingSection;
