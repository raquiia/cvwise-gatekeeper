
import React from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyMatchesPlaceholderProps {
  onRecalculateMatches: () => void;
  matchLoading: boolean;
}

const EmptyMatchesPlaceholder = ({ 
  onRecalculateMatches, 
  matchLoading 
}: EmptyMatchesPlaceholderProps) => {
  return (
    <div className="text-center p-8 bg-muted rounded-lg">
      <h3 className="text-lg font-medium">Aucun candidat correspondant</h3>
      <p className="text-muted-foreground mt-2">
        Il n'y a actuellement aucun candidat qui corresponde à cette offre d'emploi.
      </p>
      <Button onClick={onRecalculateMatches} className="mt-4 gap-2">
        {matchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />}
        Recalculer les correspondances
      </Button>
    </div>
  );
};

export default EmptyMatchesPlaceholder;
