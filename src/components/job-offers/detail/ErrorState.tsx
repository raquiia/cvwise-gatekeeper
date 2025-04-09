
import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: string | null;
  onBackClick: () => void;
}

const ErrorState = ({ error, onBackClick }: ErrorStateProps) => {
  return (
    <div className="container mx-auto px-4">
      <div className="bg-red-50 p-6 rounded-lg">
        <h1 className="text-2xl font-bold text-red-700 mb-2">Erreur</h1>
        <p className="text-red-600">{error || "Offre d'emploi non trouvée."}</p>
        <Button 
          onClick={onBackClick} 
          variant="outline" 
          className="mt-4"
        >
          Retour aux offres d'emploi
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
