
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Users, Globe } from 'lucide-react';

interface MatchingModeToggleProps {
  isGlobalMode: boolean;
  onModeChange: (isGlobal: boolean) => void;
  totalCandidates?: number;
  ownCandidates?: number;
}

const MatchingModeToggle: React.FC<MatchingModeToggleProps> = ({
  isGlobalMode,
  onModeChange,
  totalCandidates = 0,
  ownCandidates = 0
}) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200/30">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-purple-600" />
        <Label htmlFor="matching-mode" className="text-sm font-medium">
          Mode de recherche
        </Label>
      </div>
      
      <div className="flex items-center gap-3">
        <span className={`text-sm ${!isGlobalMode ? 'font-medium text-purple-700' : 'text-muted-foreground'}`}>
          Mes candidats ({ownCandidates})
        </span>
        
        <Switch
          id="matching-mode"
          checked={isGlobalMode}
          onCheckedChange={onModeChange}
        />
        
        <span className={`text-sm ${isGlobalMode ? 'font-medium text-blue-700' : 'text-muted-foreground'}`}>
          <Globe className="h-3 w-3 inline mr-1" />
          Tous les candidats ({totalCandidates})
        </span>
      </div>
      
      {isGlobalMode && (
        <div className="text-xs text-blue-600 dark:text-blue-400 ml-auto">
          Mode collaboration actif - Vous pouvez voir tous les candidats de la plateforme
        </div>
      )}
    </div>
  );
};

export default MatchingModeToggle;
