
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DataMissingAlertProps {
  candidateName: string;
}

const DataMissingAlert: React.FC<DataMissingAlertProps> = ({ candidateName }) => {
  return (
    <Alert className="mb-6 bg-amber-50 border-amber-200">
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-800">Données incomplètes</AlertTitle>
      <AlertDescription className="text-amber-700">
        Certaines informations détaillées pour {candidateName} sont manquantes ou n'ont pas été correctement importées. 
        Vous pouvez compléter les données manuellement en modifiant le profil du candidat.
      </AlertDescription>
    </Alert>
  );
};

export default DataMissingAlert;
