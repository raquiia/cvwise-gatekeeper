
import React from 'react';
import { useImprovedCandidateScore } from '@/hooks/use-improved-candidate-score';
import ScoreBreakdownCard from '@/components/candidates/ScoreBreakdownCard';
import type { CandidateData } from '@/services/data/candidateService';

interface ScoreDisplayProps {
  candidate: CandidateData;
  onRefresh?: () => void;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ candidate, onRefresh }) => {
  const { scoreBreakdown, isLoading, refresh } = useImprovedCandidateScore(candidate);

  const handleRefresh = () => {
    refresh();
    if (onRefresh) {
      onRefresh();
    }
  };

  if (!scoreBreakdown) {
    return <ScoreBreakdownCard scoreBreakdown={null as any} isLoading={true} />;
  }

  return <ScoreBreakdownCard scoreBreakdown={scoreBreakdown} isLoading={isLoading} />;
};

export default ScoreDisplay;
