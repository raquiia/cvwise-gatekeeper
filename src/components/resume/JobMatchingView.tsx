
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { resumeAnalysisService } from '@/services/analysis/resumeAnalysisService';
import { MatchResult } from '@/services/analysis/matchingUtils';
import { CandidateData } from '@/services/data/resumeDataService';
import MatchScoreCard from './MatchScoreCard';
import SkillsComparison from './SkillsComparison';
import SimilarCandidates from './SimilarCandidates';
import { Button } from '@/components/ui/button';

interface JobMatchingViewProps {
  candidateId: string;
  jobPositionId: string;
}

const JobMatchingView: React.FC<JobMatchingViewProps> = ({ 
  candidateId, 
  jobPositionId 
}) => {
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [similarCandidates, setSimilarCandidates] = useState<(CandidateData & { similarityScore: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch match result
        const result = await resumeAnalysisService.compareToJobPosition(candidateId, jobPositionId);
        setMatchResult(result);
        
        // Fetch similar candidates
        const similar = await resumeAnalysisService.findSimilarProfiles(candidateId, 5);
        setSimilarCandidates(similar);
      } catch (error: any) {
        console.error('Error loading match data:', error);
        setError(error.message || "Une erreur s'est produite lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [candidateId, jobPositionId]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 size={40} className="animate-spin text-navy mb-4" />
        <p className="text-navy-dark">Analyse en cours...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
          <AlertCircle size={24} className="text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-navy-dark mb-2">
          Erreur lors de l'analyse
        </h3>
        <p className="text-muted-foreground mb-4">
          {error}
        </p>
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }
  
  if (!matchResult) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
          <AlertCircle size={24} className="text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-navy-dark mb-2">
          Aucun résultat d'analyse
        </h3>
        <p className="text-muted-foreground mb-4">
          L'analyse n'a pas pu générer de résultats pour cette comparaison.
        </p>
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MatchScoreCard matchResult={matchResult} />
        <SkillsComparison 
          matchedSkills={matchResult.details.matchedSkills}
          missingSkills={matchResult.details.missingSkills}
        />
      </div>
      
      <SimilarCandidates candidates={similarCandidates} />
    </div>
  );
};

export default JobMatchingView;
