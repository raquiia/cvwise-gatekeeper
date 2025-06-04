
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { candidateDataReprocessingService } from '@/services/data/candidateDataReprocessingService';
import { RefreshCw } from 'lucide-react';

const ReprocessDataButton: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReprocessAll = async () => {
    setIsProcessing(true);
    try {
      console.log('🚀 Début du retraitement de tous les candidats...');
      
      const result = await candidateDataReprocessingService.reprocessAllUserCandidates();
      
      toast({
        title: "Retraitement terminé",
        description: `${result.updated} candidat(s) mis à jour sur ${result.total}`,
      });
      
      // Rafraîchir la page pour voir les changements
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      console.error('Erreur lors du retraitement:', error);
      toast({
        title: "Erreur",
        description: error.message || "Échec du retraitement",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleReprocessAll}
      disabled={isProcessing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
      {isProcessing ? 'Retraitement...' : 'Retraiter les données'}
    </Button>
  );
};

export default ReprocessDataButton;
