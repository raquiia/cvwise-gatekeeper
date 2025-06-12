
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DebugAIScoreButtonProps {
  candidateId: string;
}

const DebugAIScoreButton: React.FC<DebugAIScoreButtonProps> = ({ candidateId }) => {
  const handleDebug = async () => {
    try {
      console.log('🐛 [DEBUG] Starting AI score debug for candidate:', candidateId);
      
      // Check the auth user
      const { data: authData } = await supabase.auth.getUser();
      console.log('👤 [DEBUG] Current user:', authData.user?.id);
      
      // Direct table query for candidate with AI data
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('ai_score, ai_explanation, ai_strengths, ai_weaknesses, ai_recommendations, ai_analyzed_at')
        .eq('id', candidateId);
      
      if (candidateError) {
        console.error('❌ [DEBUG] Error in candidate query:', candidateError);
      } else {
        console.log('🔗 [DEBUG] Candidate AI data:', candidateData);
      }
      
      // Check using RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_candidate_by_id_bypassing_rls', {
        candidate_id_param: candidateId
      });
      
      if (rpcError) {
        console.error('❌ [DEBUG] Error in RPC function:', rpcError);
      } else {
        console.log('🔗 [DEBUG] RPC function data:', rpcData?.[0] ? {
          ai_score: rpcData[0].ai_score,
          ai_explanation: rpcData[0].ai_explanation ? 'Present' : 'Missing',
          ai_analyzed_at: rpcData[0].ai_analyzed_at
        } : 'No data');
      }
      
      const hasAIData = candidateData?.[0]?.ai_score !== null;
      
      toast({
        title: "Debug terminé",
        description: `Vérifiez la console pour les résultats. AI Data: ${hasAIData ? 'Présent' : 'Absent'}`,
      });
      
    } catch (error: any) {
      console.error('❌ [DEBUG] Exception:', error);
      toast({
        title: "Erreur de debug",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleDebug} 
      variant="outline" 
      size="sm"
      className="text-xs"
    >
      <Bug className="w-3 h-3 mr-1" />
      Debug AI Data
    </Button>
  );
};

export default DebugAIScoreButton;
