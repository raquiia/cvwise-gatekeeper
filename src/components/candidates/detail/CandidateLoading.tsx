
import React from 'react';
import { Loader2 } from 'lucide-react';

const CandidateLoading: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-navy" />
      <span className="ml-2">Chargement du profil...</span>
    </div>
  );
};

export default CandidateLoading;
