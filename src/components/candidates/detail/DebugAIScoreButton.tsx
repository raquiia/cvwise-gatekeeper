
import React from 'react';
import { Button } from '@/components/ui/button';
import { debugAIScoreForCandidate } from '@/utils/debugAIScore';
import { analyzeResume } from '@/services/resumeService';
import { Brain, Loader2 } from 'lucide-react';
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
      
      // Check if we have AI score data from the direct query
      const hasAIScore = result.directQuery?.data && result.directQuery.data.length > 0;
      
      if (!hasAIScore) {
        toast({
          title: "Aucun score IA trouvé",
          description: "Lancement de l'analyse IA du CV...",
        });
        
        // Try to find the candidate's resume_id
        // We need to get this from the candidate data somehow
        // For now, let's try to analyze directly using the analyzeResume function
        // This will need the resume_id which we don't have directly here
        
        toast({
          title: "Information manquante",
          description: "Impossible de trouver l'ID du CV pour ce candidat. Utilisez le bouton 'Lancer l'analyse IA' sur la page du candidat.",
          variant: "destructive",
        });
      } else {
        const scoreData = result.directQuery.data[0];
        toast({
          title: "Score IA trouvé",
          description: `Score: ${scoreData.score}/100. Vérifiez la console pour plus de détails.`,
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
      title="Debug AI Score - Vérifier les données en base"
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
