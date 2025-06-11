
import React from 'react';
import { Button } from '@/components/ui/button';
import { debugAIScoreForCandidate } from '@/utils/debugAIScore';
import { Search } from 'lucide-react';

interface DebugAIScoreButtonProps {
  candidateId: string;
}

const DebugAIScoreButton: React.FC<DebugAIScoreButtonProps> = ({ candidateId }) => {
  const handleDebug = async () => {
    console.log('🚀 [DEBUG] Starting AI score debug...');
    const result = await debugAIScoreForCandidate(candidateId);
    console.log('🏁 [DEBUG] Debug completed:', result);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDebug}
      className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
      title="Debug AI Score - Vérifier en base de données"
    >
      <Search className="w-4 h-4 mr-2" />
      Debug Score IA
    </Button>
  );
};

export default DebugAIScoreButton;
