
import React from 'react';
import { Button } from '@/components/ui/button';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { Users, Filter } from 'lucide-react';

interface CandidatesHeaderProps {
  onStatusChange: (status: string | null) => void;
  selectedStatus: string | null;
  candidateCount: number;
}

const CandidatesHeader: React.FC<CandidatesHeaderProps> = ({
  onStatusChange,
  selectedStatus,
  candidateCount
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
                  Filtres Intelligents
                </h2>
                <p className="text-muted-foreground text-sm">
                  {candidateCount} candidat{candidateCount !== 1 ? 's' : ''} dans votre base
                </p>
              </div>
            </div>
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
