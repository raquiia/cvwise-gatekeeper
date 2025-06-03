
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calculator, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { persistentScoringService } from '@/services/scoring/persistentScoringService';

interface ScoreRecalculationButtonProps {
  variant?: 'default' | 'ghost';
  size?: 'sm' | 'default';
  className?: string;
}

export const ScoreRecalculationButton: React.FC<ScoreRecalculationButtonProps> = ({
  variant = 'ghost',
  size = 'sm',
  className = ''
}) => {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();

  const handleMassRecalculation = async () => {
    if (isRecalculating) return;
    
    setIsRecalculating(true);
    
    try {
      toast({
        title: "Recalcul en cours",
        description: "Recalcul de tous les scores généraux en cours...",
      });
      
      const result = await persistentScoringService.massRecalculateAllGeneralScores();
      
      toast({
        title: "Recalcul terminé",
        description: `${result.success} scores recalculés avec succès, ${result.failed} échecs`,
      });
      
      // Refresh the page to show updated scores
      window.location.reload();
    } catch (error) {
      console.error('Error during mass recalculation:', error);
      toast({
        title: "Erreur de recalcul",
        description: "Une erreur est survenue lors du recalcul des scores",
        variant: "destructive"
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleMassRecalculation}
      disabled={isRecalculating}
      className={className}
      title="Recalculer tous les scores généraux"
    >
      {isRecalculating ? (
        <RefreshCw size={14} className="mr-1 animate-spin" />
      ) : (
        <Calculator size={14} className="mr-1" />
      )}
      {isRecalculating ? 'Recalcul...' : 'Recalculer scores'}
    </Button>
  );
};
