
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, Loader2 } from 'lucide-react';

const ConfirmClaireButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAlreadyAdmin, setIsAlreadyAdmin] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { toast } = useToast();

  // Vérifier si Claire est déjà admin
  useEffect(() => {
    const checkClaireStatus = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('first_name', 'Claire')
          .eq('last_name', 'Laurent')
          .single();

        if (!error && profiles?.is_admin) {
          setIsAlreadyAdmin(true);
        }
      } catch (error) {
        console.log('Claire not found in profiles or error checking status');
      } finally {
        setCheckingStatus(false);
      }
    };

    checkClaireStatus();
  }, []);

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

      // Marquer comme admin après succès
      setIsAlreadyAdmin(true);
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

  // Ne pas afficher le bouton si Claire est déjà admin ou en cours de vérification
  if (checkingStatus || isAlreadyAdmin) {
    return null;
  }

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
