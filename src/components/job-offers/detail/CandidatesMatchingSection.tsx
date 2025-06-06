
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, RefreshCw } from 'lucide-react';
import { JobOffer } from '@/services/data/job-offers/types';
import { useActiveJob } from '@/context/ActiveJobContext';
import { toast } from '@/hooks/use-toast';
import MatchingTabs from './MatchingTabs';
import EnhancedCandidateMatchItem from './EnhancedCandidateMatchItem';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

interface CandidatesMatchingSectionProps {
  candidateMatches: ExtendedCandidateMatch[];
  jobOffer: JobOffer;
  onViewCandidate: (candidateId: string) => void;
  onRecalculateMatches: () => void;
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

  const renderCandidateList = (matches: ExtendedCandidateMatch[], sortKey: 'local' | 'global' | 'skills') => {
    if (matches.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Aucun candidat correspondant trouvé</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={onRecalculateMatches}
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
              {candidateMatches.length} candidat{candidateMatches.length !== 1 ? 's' : ''} évalué{candidateMatches.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button 
            variant="outline"
            size="sm"
            onClick={onRecalculateMatches}
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
        {candidateMatches.length > 0 ? (
          <MatchingTabs 
            candidateMatches={candidateMatches}
          >
            {renderCandidateList}
          </MatchingTabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun candidat correspondant trouvé</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={onRecalculateMatches}
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
