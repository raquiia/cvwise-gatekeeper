
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Sparkles } from 'lucide-react';

/**
 * Alert component to show when using mock data for candidate matches
 * Note: This component is no longer used as we now use real data
 */
export const MockDataAlert: React.FC = () => (
  <Alert variant="warning" className="mt-4 mb-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 shadow-md animate-fade-in relative overflow-hidden">
    <div className="absolute inset-0 bg-pattern opacity-5"></div>
    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-400/10 to-yellow-400/10 rounded-bl-full"></div>
    
    <div className="flex items-center">
      <div className="relative">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <span className="absolute -top-1 -right-1">
          <Sparkles size={8} className="text-yellow-400 animate-pulse" />
        </span>
      </div>
      <AlertDescription className="ml-2 text-amber-800 font-medium">
        Chargement des données réelles en cours...
      </AlertDescription>
    </div>
  </Alert>
);

export default MockDataAlert;
