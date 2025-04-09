
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const NoMatchesAlert = () => {
  return (
    <Alert className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Aucun candidat correspondant</AlertTitle>
      <AlertDescription>
        Aucun candidat ne correspond à cette offre d'emploi. Assurez-vous d'avoir importé des CV et créé des profils candidats avant de calculer les correspondances.
      </AlertDescription>
    </Alert>
  );
};

export default NoMatchesAlert;
