
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ errorMessage, onRetry }) => {
  return (
    <div className="glass rounded-xl p-8 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="h-10 w-10 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-navy-dark mb-2">Une erreur est survenue</h2>
      <p className="text-muted-foreground mb-6">
        {errorMessage}
      </p>
      <Button onClick={onRetry} className="button-primary flex items-center">
        <RefreshCw size={16} className="mr-2" />
        Réessayer
      </Button>
    </div>
  );
};

export default ErrorState;
