
import React, { createContext, useContext, ReactNode } from 'react';
import { useCandidatesData } from '@/hooks/use-candidates-data';
import { CandidateData } from '@/services/data/candidateService';

interface CandidateDataContextType {
  candidates: CandidateData[];
  loading: boolean;
  error: string | null;
  refreshCandidates: () => Promise<void>;
  onCandidateUpdated: () => Promise<void>;
}

const CandidateDataContext = createContext<CandidateDataContextType | undefined>(undefined);

export const CandidateDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { candidates, loading, error, refreshCandidates } = useCandidatesData();

  const onCandidateUpdated = async () => {
    console.log('🔄 Candidate updated - triggering global refresh');
    await refreshCandidates();
  };

  return (
    <CandidateDataContext.Provider value={{
      candidates,
      loading,
      error,
      refreshCandidates,
      onCandidateUpdated
    }}>
      {children}
    </CandidateDataContext.Provider>
  );
};

export const useCandidateData = () => {
  const context = useContext(CandidateDataContext);
  if (context === undefined) {
    throw new Error('useCandidateData must be used within a CandidateDataProvider');
  }
  return context;
};
