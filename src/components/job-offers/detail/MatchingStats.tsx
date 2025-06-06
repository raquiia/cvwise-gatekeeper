
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Users } from 'lucide-react';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

interface MatchingStatsProps {
  candidateMatches: ExtendedCandidateMatch[];
}

const MatchingStats = ({ candidateMatches }: MatchingStatsProps) => {
  // Calculer les statistiques à partir des ExtendedCandidateMatch
  const totalCandidates = candidateMatches.length;
  const averageScore = totalCandidates > 0 
    ? Math.round(candidateMatches.reduce((sum, match) => sum + (match.score || 0), 0) / totalCandidates)
    : 0;
  const bestScore = totalCandidates > 0 
    ? Math.max(...candidateMatches.map(match => match.score || 0))
    : 0;
  
  // Calculer les candidats excellents (score >= 80)
  const excellentCandidates = candidateMatches.filter(match => (match.score || 0) >= 80).length;
  const excellentPercentage = totalCandidates > 0 ? Math.round((excellentCandidates / totalCandidates) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Statistiques de matching
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métriques principales */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Candidats matchés</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {totalCandidates}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Score moyen</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {averageScore}%
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Meilleur score</span>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              {bestScore}%
            </Badge>
          </div>
        </div>
        
        <Separator />
        
        {/* Distribution des scores */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>Distribution des scores</span>
            {excellentCandidates > 0 && (
              <Badge variant="outline" className="text-xs">
                {excellentCandidates} excellent{excellentCandidates > 1 ? 's' : ''}
              </Badge>
            )}
          </h3>
          {totalCandidates > 0 ? (
            <div className="space-y-3">
              {[
                { label: '90-100%', min: 90, max: 100, color: 'bg-emerald-500' },
                { label: '75-89%', min: 75, max: 89, color: 'bg-green-500' },
                { label: '50-74%', min: 50, max: 74, color: 'bg-yellow-500' },
                { label: '25-49%', min: 25, max: 49, color: 'bg-orange-500' },
                { label: '0-24%', min: 0, max: 24, color: 'bg-red-500' },
              ].map((range) => {
                const count = candidateMatches.filter(m => {
                  const score = m.score || 0;
                  return score >= range.min && score <= range.max;
                }).length;
                const percentage = totalCandidates > 0 
                  ? Math.round((count / totalCandidates) * 100) 
                  : 0;
                
                return (
                  <div key={range.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{range.label}</span>
                      <span className="text-muted-foreground">
                        {count} candidat{count !== 1 ? 's' : ''} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${range.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 italic py-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun candidat correspondant</p>
              <p className="text-xs">Lancez un recalcul pour voir les résultats</p>
            </div>
          )}
        </div>
        
        {/* Indicateur de qualité */}
        {totalCandidates > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">Qualité du matching</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pertinence générale</span>
                  <span className="font-medium">{averageScore >= 70 ? 'Excellente' : averageScore >= 50 ? 'Bonne' : 'À améliorer'}</span>
                </div>
                <Progress value={averageScore} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {excellentPercentage}% des candidats ont un score excellent (≥80%)
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchingStats;
