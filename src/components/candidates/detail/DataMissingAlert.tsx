
import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { analyzeResume, extractResumeText } from '@/services/resume/analysisOperations';
import { toast } from '@/hooks/use-toast';

interface DataMissingAlertProps {
  candidateName: string;
  resumeId: string | undefined;
  onReanalysisComplete: () => void;
}

const DataMissingAlert: React.FC<DataMissingAlertProps> = ({ 
  candidateName, 
  resumeId,
  onReanalysisComplete
}) => {
  const [loading, setLoading] = useState(false);
  
  const handleReanalyze = async () => {
    if (!resumeId) {
      toast({
        title: "Erreur",
        description: "Impossible de retrouver le CV original pour ré-analyser ce candidat",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Extraire le texte du CV
      console.log("Commencer l'extraction de texte pour CV ID:", resumeId);
      const textResult = await extractResumeText(resumeId);
      
      if (!textResult.success || !textResult.text) {
        throw new Error(textResult.message || "Impossible d'extraire le texte du CV");
      }
      
      console.log("Texte extrait avec succès, longueur:", textResult.text.length);
      console.log("Échantillon du texte extrait:", textResult.text.substring(0, 500) + "...");
      
      // 2. Ré-analyser le CV en forçant l'écrasement des données existantes
      console.log("Commencer l'analyse du CV avec le texte extrait");
      const analysisResult = await analyzeResume(resumeId, textResult.text, true);
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.message || "Échec de l'analyse");
      }
      
      console.log("Analyse terminée avec succès, candidateId:", analysisResult.candidateId);
      
      toast({
        title: "Analyse terminée",
        description: `Le profil de ${candidateName} a été ré-analysé avec succès`,
      });
      
      // 3. Rafraîchir les données après une courte pause pour laisser le temps à la base de données de se mettre à jour
      setTimeout(() => {
        onReanalysisComplete();
      }, 2000);
      
    } catch (error: any) {
      console.error("Error during reanalysis:", error);
      toast({
        title: "Échec de la ré-analyse",
        description: error.message || "Une erreur est survenue lors de la ré-analyse du CV",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Alert variant="warning" className="mb-6">
      <AlertTriangle className="h-5 w-5 text-amber-500" />
      <AlertTitle className="text-amber-600">Données incomplètes</AlertTitle>
      <AlertDescription className="mt-1">
        <p className="mb-3">
          Le profil de <strong>{candidateName}</strong> semble incomplet. 
          Certaines informations comme l'expérience professionnelle ou la formation 
          n'ont pas été correctement extraites.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReanalyze}
          disabled={loading}
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Ré-analyse en cours...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Ré-analyser le CV
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default DataMissingAlert;
