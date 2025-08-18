
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import ReprocessDataButton from './ReprocessDataButton';
import { Users, Filter, Globe, Eye } from 'lucide-react';

interface CandidatesHeaderProps {
  onStatusChange: (status: string | null) => void;
  selectedStatus: string | null;
  candidateCount: number;
  isGlobalMode: boolean;
  onModeChange: (isGlobal: boolean) => void;
  ownCandidatesCount: number;
}

const CandidatesHeader: React.FC<CandidatesHeaderProps> = ({
  onStatusChange,
  selectedStatus,
  candidateCount,
  isGlobalMode,
  onModeChange,
  ownCandidatesCount
}) => {
  return (
    <div className="relative mb-6">
      {/* Modern Card with Glassmorphism */}
      <div className="bg-card/70 dark:bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  {isGlobalMode ? 'Tous les candidats' : 'Mes candidats'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {candidateCount} candidat{candidateCount !== 1 ? 's' : ''} {isGlobalMode ? 'au total' : 'dans votre base'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ReprocessDataButton />
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200/30">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <Label htmlFor="view-mode" className="text-sm font-medium">
                Mode de vue
              </Label>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`text-sm ${!isGlobalMode ? 'font-medium text-purple-700' : 'text-muted-foreground'}`}>
                Mes candidats ({ownCandidatesCount})
              </span>
              
              <Switch
                id="view-mode"
                checked={isGlobalMode}
                onCheckedChange={onModeChange}
              />
              
              <span className={`text-sm ${isGlobalMode ? 'font-medium text-blue-700' : 'text-muted-foreground'}`}>
                <Globe className="h-3 w-3 inline mr-1" />
                Tous les candidats ({candidateCount})
              </span>
            </div>
            
            {isGlobalMode && (
              <div className="text-xs text-blue-600 dark:text-blue-400 ml-auto">
                Mode collaboration - Accès en lecture aux candidats d'autres recruteurs
              </div>
            )}
          </div>
        </div>

        {/* Status Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="w-4 h-4" />
            Filtrer par statut
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStatus === null ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusChange(null)}
              className="whitespace-nowrap bg-white/80 dark:bg-card/80 backdrop-blur-sm border-border/50 hover:bg-accent/80 transition-all duration-200"
            >
              Tous les candidats
            </Button>
            
            {Object.keys(CANDIDATE_STATUS_LABELS).map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusChange(status)}
                className="whitespace-nowrap bg-white/80 dark:bg-card/80 backdrop-blur-sm border-border/50 hover:bg-accent/80 transition-all duration-200"
              >
                {CANDIDATE_STATUS_LABELS[status as keyof typeof CANDIDATE_STATUS_LABELS]}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidatesHeader;
