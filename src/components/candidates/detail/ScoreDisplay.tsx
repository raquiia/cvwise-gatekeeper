
import React from 'react';
import EnhancedScoreDisplay from './EnhancedScoreDisplay';
import type { CandidateData } from '@/services/data/candidateService';

interface ScoreDisplayProps {
  candidate: CandidateData;
  onRefresh?: () => void;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ candidate, onRefresh }) => {
  return <EnhancedScoreDisplay candidate={candidate} />;
};

export default ScoreDisplay;
