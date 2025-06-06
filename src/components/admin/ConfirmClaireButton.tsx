
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, Loader2 } from 'lucide-react';

const ConfirmClaireButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const confirmClaireUser = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('confirm-claire-user');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Succès",
        description: data.message || "Claire Laurent a été confirmée et promue administratrice",
      });
    } catch (error: any) {
      console.error('Erreur lors de la confirmation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de confirmer l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={confirmClaireUser}
      disabled={isLoading}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserCheck className="h-4 w-4" />
      )}
      Confirmer Claire Laurent
    </Button>
  );
};

export default ConfirmClaireButton;
