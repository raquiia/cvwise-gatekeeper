
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Sparkles, Scan, Zap } from 'lucide-react';

/**
 * Alert component to show when using mock data for candidate matches
 * Note: This component is no longer used as we now use real data
 */
export const MockDataAlert: React.FC = () => (
  <Alert variant="warning" className="mt-4 mb-2 ai-glass bg-gradient-to-r from-amber-500/5 to-amber-100/10 border-l-4 border-amber-500 shadow-md animate-fade-in relative overflow-hidden">
    <div className="absolute inset-0 ai-grid-bg opacity-5"></div>
    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-400/10 to-amber-200/10 rounded-bl-full"></div>
    
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-amber-400/20 blur-md rounded-full"></div>
        <AlertTriangle className="h-5 w-5 text-amber-600 relative z-10" />
        <div className="absolute -top-1 -right-1 animate-pulse">
          <Zap size={9} className="text-amber-400" />
        </div>
      </div>
      <AlertDescription className="text-amber-800 font-medium flex items-center">
        <Scan className="h-3.5 w-3.5 mr-1 text-amber-600 opacity-70" />
        IA en cours d'analyse...
        <span className="ml-1.5 inline-flex">
          <Sparkles size={9} className="text-amber-500 animate-pulse" style={{ animationDelay: '0s' }} />
          <Sparkles size={9} className="text-amber-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <Sparkles size={9} className="text-amber-500 animate-pulse" style={{ animationDelay: '1s' }} />
        </span>
      </AlertDescription>
    </div>
  </Alert>
);

export default MockDataAlert;
