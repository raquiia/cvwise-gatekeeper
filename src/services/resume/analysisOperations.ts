
import { toast } from '@/hooks/use-toast';

// Cette fonction est conservée mais simplement retourne un message indiquant que la fonctionnalité est désactivée
export const extractResumeText = async (resumeId: string): Promise<{ success: boolean; message: string }> => {
  toast({
    title: "Fonctionnalité désactivée",
    description: "L'extraction de texte a été désactivée temporairement",
    variant: "destructive",
  });
  return { 
    success: false, 
    message: "Fonctionnalité désactivée"
  };
};

// Cette fonction est conservée mais simplement retourne un message indiquant que la fonctionnalité est désactivée
export const analyzeResume = async (resumeId: string): Promise<{ success: boolean; message: string }> => {
  toast({
    title: "Fonctionnalité désactivée",
    description: "L'analyse de CV a été désactivée temporairement",
    variant: "destructive",
  });
  return { 
    success: false, 
    message: "Fonctionnalité désactivée"
  };
};
