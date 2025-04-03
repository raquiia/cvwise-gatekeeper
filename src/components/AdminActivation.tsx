
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function AdminActivation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const activateAdmin = async () => {
    if (!user) {
      toast({
        title: "Non connecté",
        description: "Vous devez être connecté pour activer les privilèges administrateur.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-users/set-default-admin', {
        method: 'POST',
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Succès",
        description: data.message || "Privilèges administrateur activés avec succès!",
        variant: "default"
      });
      
      // Petit délai pour permettre à l'utilisateur de voir le message de succès
      setTimeout(() => {
        window.location.href = '/admin/users';
      }, 1500);
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'activer les privilèges administrateur",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={activateAdmin} 
      disabled={loading}
      variant="outline"
      className="mt-4"
    >
      {loading ? "Activation..." : "Activer privilèges administrateur"}
    </Button>
  );
}
