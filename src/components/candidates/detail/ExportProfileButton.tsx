
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { candidateNotesService } from '@/services/data/candidateNotesService';
import { generateCandidateProfilePdf } from '@/services/pdf/candidateProfilePdfService';
import { useToast } from '@/hooks/use-toast';

interface ExportProfileButtonProps {
  candidate: CandidateData;
}

const ExportProfileButton: React.FC<ExportProfileButtonProps> = ({ candidate }) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Récupérer les notes du candidat
      const notes = await candidateNotesService.getNotesForCandidate(candidate.id || '');
      
      // Générer et télécharger le PDF
      await generateCandidateProfilePdf(candidate, notes);
      
      toast({
        title: "Exportation réussie",
        description: "Le profil du candidat a été exporté en PDF.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur d'exportation",
        description: `Impossible d'exporter le profil: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Génération du PDF...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Exporter en PDF
        </>
      )}
    </Button>
  );
};

export default ExportProfileButton;
