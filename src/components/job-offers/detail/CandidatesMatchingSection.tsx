
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, ArrowRight, RefreshCw } from 'lucide-react';
import { JobOffer } from '@/services/data/job-offers/types';
import CandidateMatchItem from './CandidateMatchItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveJob } from '@/context/ActiveJobContext';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
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
  sortedMatches.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  const topMatches = sortedMatches.slice(0, 5);
  const recentMatches = [...sortedMatches].slice(0, 5);
  
  const displayedMatches = tab === 'top' ? topMatches : 
                          tab === 'recent' ? recentMatches : 
                          sortedMatches;

  // Convert ExtendedCandidateMatch to the format expected by CandidateMatchItem
  const convertToMatchItemFormat = (match: ExtendedCandidateMatch) => ({
    id: match.candidateId,
    candidate_id: match.candidateId,
    job_offer_id: jobOffer.id || '',
    match_score: match.score,
    skills_match_score: match.match?.skills_match_score || 0,
    experience_match_score: match.match?.experience_match_score || 0,
    education_match_score: match.match?.education_match_score || 0,
    location_match_score: match.match?.location_match_score || 0,
    match_details: match.match?.match_details || match.details,
    calculated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    first_name: match.firstName,
    last_name: match.lastName,
    position: match.position,
    company: match.company,
    candidateId: match.candidateId,
    firstName: match.firstName,
    lastName: match.lastName,
    score: match.score,
    details: match.details,
    candidate: match.candidate,
    match: match.match
  });

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
                key={match.candidateId}
                match={convertToMatchItemFormat(match)}
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
