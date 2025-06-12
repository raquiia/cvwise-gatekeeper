
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
      
      // Vérifier si on a des données de score IA directement
      const hasDirectData = result.directQuery?.data && result.directQuery.data.length > 0;
      const hasRpcData = result.rpcQuery?.data && result.rpcQuery.data.length > 0;
      
      if (hasDirectData || hasRpcData) {
        const scoreData = hasDirectData ? result.directQuery.data[0] : result.rpcQuery.data[0];
        toast({
          title: "Score IA trouvé",
          description: `Score: ${scoreData.score}/100. Vérifiez la console pour plus de détails.`,
        });
      } else {
        // Pas de score trouvé, proposer d'analyser le CV
        // Récupérer les infos du candidat depuis result
        const candidateInfo = result.directQuery?.data?.[0] || result.rpcQuery?.data?.[0];
        
        toast({
          title: "Aucun score IA trouvé",
          description: "Lancement de l'analyse IA du CV...",
        });
        
        // Pour tester, on va essayer d'analyser le CV si on a un resume_id
        // Dans un vrai cas, il faudrait récupérer le resume_id du candidat
        console.log('⚠️ [DEBUG] No AI score found, would need resume_id to analyze');
        toast({
          title: "Information manquante",
          description: "ID du CV nécessaire pour lancer l'analyse. Utilisez le bouton d'analyse principal.",
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
      title="Debug AI Score - Vérifier les données en base de données"
    >
      {isDebugging ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Brain className="w-4 h-4 mr-2" />
      )}
      {isDebugging ? 'Debug en cours...' : 'Debug Score IA'}
    </Button>
  );
};

export default DebugAIScoreButton;
