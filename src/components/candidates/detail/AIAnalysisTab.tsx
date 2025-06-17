
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
    <div className="p-6 space-y-6 bg-gradient-to-br from-background/80 via-background to-muted/20 min-h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Analyse Intelligence Artificielle
          </h2>
          <p className="text-muted-foreground">
            Analyse complète du profil de {candidate.first_name} {candidate.last_name} 
            généré par l'intelligence artificielle
          </p>
        </div>
        
        <AIAnalysisDisplay 
          candidateId={candidate.id!} 
          candidate={candidate}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );
};

export default AIAnalysisTab;
