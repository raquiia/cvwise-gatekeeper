
import React from 'react';
import { CandidateData } from '@/services/data/candidateService';
import CandidateAIScoreCard from '../CandidateAIScoreCard';

interface AIAnalysisDisplayProps {
  candidateId: string;
  candidate?: CandidateData;
  onAnalyze?: () => void;
  onRefresh?: () => void;
}

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({ 
  candidateId, 
  candidate,
  onAnalyze,
  onRefresh 
}) => {
  console.log('🔍 [AIAnalysisDisplay] Rendering with candidate data:', {
    candidateId,
    hasCandidate: !!candidate,
    aiScore: candidate?.ai_score,
    aiAnalyzedAt: candidate?.ai_analyzed_at
  });

  if (!candidate) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-500">Chargement des données du candidat...</p>
      </div>
    );
  }

  return (
    <CandidateAIScoreCard 
      candidate={candidate} 
      compact={false}
      onRefresh={onRefresh}
    />
  );
};

export default AIAnalysisDisplay;
