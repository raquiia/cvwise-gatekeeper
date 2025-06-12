
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
      
      // Check with the regular function
      const { data: regularData, error: regularError } = await supabase.rpc('get_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_job_offer_id: null
      });
      
      if (regularError) {
        console.error('❌ [DEBUG] Error in regular function:', regularError);
      } else {
        console.log('📊 [DEBUG] Regular function data:', regularData);
      }
      
      // Check the auth user
      const { data: authData } = await supabase.auth.getUser();
      console.log('👤 [DEBUG] Current user:', authData.user?.id);
      
      // Direct table query (this will respect RLS)
      const { data: directData, error: directError } = await supabase
        .from('ai_candidate_scores')
        .select('*')
        .eq('candidate_id', candidateId);
      
      if (directError) {
        console.error('❌ [DEBUG] Error in direct query:', directError);
      } else {
        console.log('🔗 [DEBUG] Direct query data:', directData);
      }
      
      // Check if data exists and show count
      const dataCount = Array.isArray(regularData) ? regularData.length : 
                       Array.isArray(directData) ? directData.length : 0;
      
      toast({
        title: "Debug terminé",
        description: `Vérifiez la console pour les résultats. Trouvé ${dataCount} scores.`,
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
      Debug AI Score
    </Button>
  );
};

export default DebugAIScoreButton;
