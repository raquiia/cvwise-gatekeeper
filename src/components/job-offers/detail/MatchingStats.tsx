
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Target, CheckCircle } from 'lucide-react';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

interface MatchingStatsProps {
  candidateMatches: ExtendedCandidateMatch[];
}

const MatchingStats: React.FC<MatchingStatsProps> = ({ candidateMatches }) => {
  // Calculs des statistiques
  const totalCandidates = candidateMatches.length;
  const excellentMatches = candidateMatches.filter(m => m.score >= 70).length;
  const goodMatches = candidateMatches.filter(m => m.score >= 50 && m.score < 70).length;
  const averageScore = totalCandidates > 0 
    ? Math.round(candidateMatches.reduce((sum, m) => sum + m.score, 0) / totalCandidates) 
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Statistiques des Correspondances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score moyen */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            <span className="font-medium">Score moyen</span>
          </div>
          <Badge variant="secondary" className={`${getScoreColor(averageScore)} font-bold`}>
            {averageScore}%
          </Badge>
        </div>

        {/* Total candidats */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Total candidats</span>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {totalCandidates}
          </Badge>
        </div>

        {/* Excellentes correspondances */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="font-medium">Excellents (≥70%)</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {excellentMatches}
          </Badge>
        </div>

        {/* Bonnes correspondances */}
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-600" />
            <span className="font-medium">Bons (50-69%)</span>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {goodMatches}
          </Badge>
        </div>

        {/* Message d'encouragement */}
        {totalCandidates === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">Aucun candidat trouvé.</p>
            <p className="text-xs mt-1">Vérifiez que vous avez des candidats dans votre base.</p>
          </div>
        )}

        {totalCandidates > 0 && excellentMatches === 0 && (
          <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg">
            <p className="text-sm font-medium">Aucune correspondance excellente trouvée</p>
            <p className="text-xs mt-1">Considérez ajuster les critères de l'offre</p>
          </div>
        )}

        {excellentMatches > 0 && (
          <div className="text-center py-4 text-green-600 bg-green-50 rounded-lg">
            <p className="text-sm font-medium">🎯 {excellentMatches} candidat{excellentMatches > 1 ? 's' : ''} avec un excellent score !</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchingStats;
