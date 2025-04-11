
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

/**
 * Alert component to show when using mock data for candidate matches
 * Note: This component is no longer used as we now use real data
 */
export const MockDataAlert: React.FC = () => (
  <Alert variant="warning" className="mt-4 mb-2">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      Chargement des données réelles en cours...
    </AlertDescription>
  </Alert>
);

export default MockDataAlert;
