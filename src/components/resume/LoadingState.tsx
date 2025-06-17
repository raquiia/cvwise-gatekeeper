
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 size={40} className="text-primary animate-spin mb-4" />
      <p className="text-foreground font-medium">Chargement des CV...</p>
      <p className="text-sm text-muted-foreground mt-2">
        Si le chargement persiste trop longtemps, 
        <button className="p-0 h-auto text-sm ml-1 text-primary underline hover:text-primary/80 transition-colors" onClick={() => window.location.reload()}>
          essayez de rafraîchir la page
        </button>
      </p>
    </div>
  );
};

export default LoadingState;
