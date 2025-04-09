
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

interface MatchingStatsProps {
  candidateMatches: ExtendedCandidateMatch[];
}

const MatchingStats = ({ candidateMatches }: MatchingStatsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Statistiques de matching</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Candidats matchés</span>
            <span className="text-sm font-medium">{candidateMatches.length}</span>
          </div>
          
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Score moyen</span>
            <span className="text-sm font-medium">
              {candidateMatches.length > 0 
                ? Math.round(candidateMatches.reduce((sum, match) => sum + (match.match?.match_score || match.score), 0) / candidateMatches.length)
                : 0}%
            </span>
          </div>
          
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Meilleur score</span>
            <span className="text-sm font-medium">
              {candidateMatches.length > 0 
                ? Math.max(...candidateMatches.map(match => match.match?.match_score || match.score))
                : 0}%
            </span>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="font-semibold mb-2">Distribution des scores</h3>
          {candidateMatches.length > 0 ? (
            <div className="space-y-3">
              
              {[
                { label: '90-100%', min: 90, max: 100 },
                { label: '75-89%', min: 75, max: 89 },
                { label: '50-74%', min: 50, max: 74 },
                { label: '25-49%', min: 25, max: 49 },
                { label: '0-24%', min: 0, max: 24 },
              ].map((range) => {
                const count = candidateMatches.filter(m => {
                  const score = m.match?.match_score || m.score;
                  return score >= range.min && score <= range.max;
                }).length;
                const percentage = candidateMatches.length > 0 
                  ? Math.round((count / candidateMatches.length) * 100) 
                  : 0;
                
                return (
                  <div key={range.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{range.label}</span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 italic py-4">
              Aucun candidat matchant disponible
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchingStats;
