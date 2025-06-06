
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, ArrowRight, RefreshCw } from 'lucide-react';
import { CandidateMatch } from '@/services/data/candidate-matching/types';
import { JobOffer } from '@/services/data/job-offers/types';
import CandidateMatchItem from './CandidateMatchItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveJob } from '@/context/ActiveJobContext';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface CandidatesMatchingSectionProps {
  candidateMatches: CandidateMatch[];
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
  const [tab, setTab] = useState<'all' | 'top' | 'recent'>('all');
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
  
  // Sort and filter candidates based on the selected tab
  const sortedMatches = [...candidateMatches];
  
  // Sort by score (highest first)
  sortedMatches.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  
  const topMatches = sortedMatches.slice(0, 5);
  const recentMatches = [...sortedMatches].sort((a, b) => {
    const dateA = new Date(a.updated_at || '').getTime();
    const dateB = new Date(b.updated_at || '').getTime();
    return dateB - dateA;
  }).slice(0, 5);
  
  const displayedMatches = tab === 'top' ? topMatches : 
                          tab === 'recent' ? recentMatches : 
                          sortedMatches;

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

        <Tabs defaultValue="all" value={tab} onValueChange={(value) => setTab(value as any)} className="mt-2">
          <TabsList className="grid grid-cols-3 w-[300px]">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="top">Top 5</TabsTrigger>
            <TabsTrigger value="recent">Récents</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        {displayedMatches.length > 0 ? (
          <div className="space-y-4">
            {displayedMatches.map((match) => (
              <CandidateMatchItem
                key={match.id || match.candidate_id}
                match={match}
                onViewCandidate={onViewCandidate}
                jobId={jobOffer.id!}
                renderMatchedSkills={renderMatchedSkills}
                renderMissingSkills={renderMissingSkills}
              />
            ))}
          </div>
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

        {candidateMatches.length > 5 && tab !== 'all' && (
          <Button
            variant="link"
            className="mt-4 mx-auto block"
            onClick={() => setTab('all')}
          >
            Voir tous les candidats
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidatesMatchingSection;
