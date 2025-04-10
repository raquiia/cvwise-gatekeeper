
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building } from 'lucide-react';

/**
 * Alert component to show when features are not yet implemented
 */
export const MockDataAlert: React.FC<{ feature: string }> = ({ feature }) => (
  <Alert variant="default" className="mt-4 mb-2 bg-purple-50/80 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800/30">
    <Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
    <AlertDescription className="text-purple-800 dark:text-purple-300">
      La fonctionnalité {feature} sera bientôt disponible.
    </AlertDescription>
  </Alert>
);

export default MockDataAlert;
