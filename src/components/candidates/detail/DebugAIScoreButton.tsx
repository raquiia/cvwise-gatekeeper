
import React from 'react';
import { Button } from '@/components/ui/button';
import { debugAIScoreForCandidate } from '@/utils/debugAIScore';
import { analyzeResume } from '@/services/resumeService';
import { Search, Brain, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DebugAIScoreButtonProps {
  candidateId: string;
}

const DebugAIScoreButton: React.FC<DebugAIScoreButtonProps> = ({ candidateId }) => {
  const [isDebugging, setIsDebugging] = React.useState(false);

  const handleDebug = async () => {
    console.log('🚀 [DEBUG] Starting AI score debug...');
    setIsDebugging(true);
    
    try {
      const result = await debugAIScoreForCandidate(candidateId);
      console.log('🏁 [DEBUG] Debug completed:', result);
      
      // Si pas de score trouvé, proposer d'analyser le CV
      if (!result.hasAIScore && result.candidateData?.resume_id) {
        toast({
          title: "Aucun score IA trouvé",
          description: "Lancement de l'analyse IA du CV...",
        });
        
        const analysisResult = await analyzeResume(result.candidateData.resume_id);
        
        if (analysisResult.success) {
          toast({
            title: "Analyse IA terminée",
            description: "Le CV a été analysé avec succès. Actualisez la page pour voir les résultats.",
          });
        } else {
          toast({
            title: "Erreur d'analyse",
            description: analysisResult.message || "Impossible d'analyser le CV",
            variant: "destructive",
          });
        }
      } else if (result.hasAIScore) {
        toast({
          title: "Score IA trouvé",
          description: `Score: ${result.aiScore}/100. Vérifiez la console pour plus de détails.`,
        });
      } else {
        toast({
          title: "Aucun CV associé",
          description: "Ce candidat n'a pas de CV à analyser.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] Error during debug:', error);
      toast({
        title: "Erreur de debug",
        description: error.message || "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDebug}
      disabled={isDebugging}
      className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
      title="Debug AI Score - Vérifier et analyser si nécessaire"
    >
      {isDebugging ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Brain className="w-4 h-4 mr-2" />
      )}
      {isDebugging ? 'Analyse en cours...' : 'Debug & Analyser IA'}
    </Button>
  );
};

export default DebugAIScoreButton;
