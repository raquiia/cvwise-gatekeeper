
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Analyse un CV pour extraire des informations et créer un candidat
 */
export const analyzeResume = async (resumeId: string): Promise<{ success: boolean; message?: string; candidateId?: string }> => {
  try {
    console.log(`Démarrage de l'analyse pour le CV ID: ${resumeId}`);
    toast({
      title: "Analyse en cours",
      description: "L'extraction des informations du CV peut prendre jusqu'à 30 secondes...",
    });
    
    // Call the Supabase function with the extractDetails flag explicitly set to true
    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: { 
        resumeId,
        extractDetails: true,  // Extraction complète des détails du CV
        fullExtraction: true,  // Indicateur supplémentaire pour forcer l'extraction complète
        forceCompletion: true, // Forcer la génération de données même si l'extraction échoue
        includeRawText: true   // Récupérer le texte brut extrait
      }
    });
    
    if (error) {
      console.error('Erreur lors de l\'appel de la fonction analyze-resume:', error);
      toast({
        title: "Erreur d'analyse",
        description: error.message || "Une erreur s'est produite lors de l'analyse du CV",
        variant: "destructive",
      });
      throw error;
    }
    
    console.log('Réponse de l\'analyse:', data);
    
    // Afficher le texte brut extrait dans une popup temporaire
    if (data.rawText) {
      toast({
        title: "Texte brut extrait du CV",
        description: "Texte brut extrait du CV disponible",
        duration: 30000, // 30 secondes d'affichage
      });
      
      // Affichage dans la console pour le débogage
      console.log("Texte brut extrait:", data.rawText);
    }
    
    if (data.success) {
      toast({
        title: "Analyse terminée",
        description: "Le CV a été analysé avec succès",
        variant: "default",
      });
      return { 
        success: true, 
        candidateId: data.candidate?.id 
      };
    } else {
      toast({
        title: "Analyse incomplète",
        description: data.message || "L'analyse a rencontré des difficultés. Vérifiez le candidat créé.",
        variant: "default",
      });
      return { 
        success: false, 
        message: data.message || "Une erreur inconnue s'est produite" 
      };
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'analyse du CV:', error);
    toast({
      title: "Échec de l'analyse",
      description: error.message || "Une erreur s'est produite lors de l'analyse du CV",
      variant: "destructive",
    });
    return { 
      success: false, 
      message: error.message || "Une erreur s'est produite lors de l'analyse du CV" 
    };
  }
};
