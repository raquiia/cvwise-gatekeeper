
import React from 'react';
import AIAnalysisDisplay from './AIAnalysisDisplay';
import type { CandidateData } from '@/services/data/candidateService';

interface AIAnalysisTabProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const AIAnalysisTab: React.FC<AIAnalysisTabProps> = ({ candidate, isLoading, onRefresh }) => {
  return (
    <div className="p-8 space-y-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Analyse Intelligence Artificielle
          </h2>
          <p className="text-lg text-muted-foreground">
            Analyse complète du profil de <span className="font-semibold text-navy">{candidate.first_name} {candidate.last_name}</span> 
            générée par l'intelligence artificielle
          </p>
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-border/30 shadow-lg overflow-hidden">
          <AIAnalysisDisplay 
            candidateId={candidate.id!} 
            candidate={candidate}
            onRefresh={onRefresh}
          />
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisTab;
