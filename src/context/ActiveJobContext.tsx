
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { candidateMatchingService } from '@/services/data/candidate-matching/candidateMatchingService';

interface ActiveJobContextType {
  activeJobOfferId: string | null;
  activeJobOfferTitle: string | null;
  setActiveJobOffer: (jobOfferId: string | null, jobTitle?: string) => Promise<void>;
  isLoading: boolean;
  clearActiveJob: () => void;
}

const ActiveJobContext = createContext<ActiveJobContextType | undefined>(undefined);

const STORAGE_KEY = 'active_job_offer';

interface ActiveJobProviderProps {
  children: ReactNode;
}

export const ActiveJobProvider: React.FC<ActiveJobProviderProps> = ({ children }) => {
  const [activeJobOfferId, setActiveJobOfferId] = useState<string | null>(null);
  const [activeJobOfferTitle, setActiveJobOfferTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load active job from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { jobOfferId, jobTitle } = JSON.parse(stored);
        setActiveJobOfferId(jobOfferId);
        setActiveJobOfferTitle(jobTitle);
        // Sync with the matching service
        candidateMatchingService.setActiveJobOffer(jobOfferId);
      } catch (error) {
        console.error('Error loading active job from storage:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const setActiveJobOffer = async (jobOfferId: string | null, jobTitle?: string) => {
    setIsLoading(true);
    try {
      // Set in the matching service
      await candidateMatchingService.setActiveJobOffer(jobOfferId);
      
      // Update local state
      setActiveJobOfferId(jobOfferId);
      setActiveJobOfferTitle(jobTitle || null);
      
      // Persist to localStorage
      if (jobOfferId) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          jobOfferId,
          jobTitle: jobTitle || null,
          timestamp: Date.now()
        }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error setting active job offer:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearActiveJob = () => {
    setActiveJobOfferId(null);
    setActiveJobOfferTitle(null);
    localStorage.removeItem(STORAGE_KEY);
    candidateMatchingService.setActiveJobOffer(null);
  };

  const value: ActiveJobContextType = {
    activeJobOfferId,
    activeJobOfferTitle,
    setActiveJobOffer,
    isLoading,
    clearActiveJob
  };

  return (
    <ActiveJobContext.Provider value={value}>
      {children}
    </ActiveJobContext.Provider>
  );
};

export const useActiveJob = (): ActiveJobContextType => {
  const context = useContext(ActiveJobContext);
  if (context === undefined) {
    throw new Error('useActiveJob must be used within an ActiveJobProvider');
  }
  return context;
};
