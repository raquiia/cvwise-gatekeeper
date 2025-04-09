
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

/**
 * Alert component to show when using mock data for candidate matches
 */
export const MockDataAlert: React.FC = () => (
  <Alert variant="warning" className="mt-4 mb-2">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      Utilisation de données de démonstration. Les correspondances réelles seront calculées lorsque le service sera disponible.
    </AlertDescription>
  </Alert>
);

export default MockDataAlert;
