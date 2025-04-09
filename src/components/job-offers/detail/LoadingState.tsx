
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = () => {
  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
        <span className="ml-2">Chargement des données...</span>
      </div>
    </div>
  );
};

export default LoadingState;
