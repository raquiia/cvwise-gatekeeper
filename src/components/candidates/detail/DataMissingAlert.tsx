
import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { analyzeResume } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DataMissingAlertProps {
  candidateName: string;
  resumeId?: string;
  onReanalysisComplete?: () => void;
}

const DataMissingAlert: React.FC<DataMissingAlertProps> = ({ 
  candidateName, 
  resumeId,
  onReanalysisComplete 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRelaunchAnalysis = async () => {
    if (!resumeId) {
      toast({
        title: "Erreur",
        description: "Impossible de relancer l'analyse : aucun CV associé à ce candidat",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // 1. Récupérer les données du CV (dont le texte déjà extrait)
      toast({
        title: "Récupération des données",
        description: "Récupération des données du CV en cours..."
      });
      
      const { data: resumeData, error: resumeError } = await supabase
        .rpc('get_resume_by_id', { p_resume_id: resumeId });
      
      if (resumeError || !resumeData || resumeData.length === 0) {
        throw new Error(resumeError?.message || "Impossible de récupérer les données du CV");
      }
      
      // Pour un accès plus facile
      const resumeInfo = resumeData[0];
      
      // 2. Récupérer le texte brut du CV depuis la base de données
      const { data: textData, error: textError } = await supabase
        .from('resume_texts')
        .select('text')
        .eq('resume_id', resumeId)
        .single();
      
      if (textError) {
        console.log("Texte du CV non trouvé en base, tentative d'accès au fichier");
        // Si le texte n'est pas en base, on peut le récupérer via le fichier original
        // Noter que cette partie devrait idéalement être gérée par une fonction edge
        const { data: fileData, error: fileError } = await supabase.storage
          .from('resumes')
          .download(resumeInfo.file_path);
        
        if (fileError || !fileData) {
          throw new Error("Impossible de récupérer le fichier du CV");
        }
        
        // Utiliser le texte brut du fichier (version simplifiée)
        const text = await fileData.text();
        
        // 3. Analyse du CV par l'IA avec le texte récupéré
        toast({
          title: "Analyse en cours",
          description: "L'IA analyse le CV pour extraire les informations..."
        });
        
        const analysisResult = await analyzeResume(resumeId, text, true);
        
        if (!analysisResult.success) {
          throw new Error(analysisResult.message || "Échec de l'analyse du CV");
        }
      } else {
        // Utiliser le texte déjà stocké en base
        const text = textData.text;
        
        if (!text) {
          throw new Error("Le texte du CV est vide");
        }
        
        // 3. Analyse du CV par l'IA avec le texte récupéré de la base
        toast({
          title: "Analyse en cours",
          description: "L'IA analyse le CV pour extraire les informations..."
        });
        
        const analysisResult = await analyzeResume(resumeId, text, true);
        
        if (!analysisResult.success) {
          throw new Error(analysisResult.message || "Échec de l'analyse du CV");
        }
      }
      
      // 4. Notification de succès
      toast({
        title: "Analyse terminée",
        description: "Les données du candidat ont été mises à jour avec succès"
      });
      
      // 5. Rafraîchir la page pour voir les nouvelles données
      if (onReanalysisComplete) {
        onReanalysisComplete();
      } else {
        window.location.reload();
      }
      
    } catch (error: any) {
      console.error("Erreur lors de la réanalyse:", error);
      toast({
        title: "Échec de l'analyse",
        description: error.message || "Une erreur est survenue lors de l'analyse du CV",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Alert className="mb-6 bg-amber-50 border-amber-200">
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      <div className="flex justify-between items-start w-full">
        <div>
          <AlertTitle className="text-amber-800">Données incomplètes</AlertTitle>
          <AlertDescription className="text-amber-700">
            Certaines informations détaillées pour {candidateName} sont manquantes ou n'ont pas été correctement importées. 
            Vous pouvez compléter les données manuellement en modifiant le profil du candidat.
          </AlertDescription>
        </div>
        {resumeId && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200 hover:text-amber-900"
            onClick={handleRelaunchAnalysis}
            disabled={isAnalyzing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isAnalyzing ? "Analyse en cours..." : "Relancer l'analyse IA"}
          </Button>
        )}
      </div>
    </Alert>
  );
};

export default DataMissingAlert;
