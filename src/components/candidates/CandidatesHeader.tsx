
import React from 'react';
import { Button } from '@/components/ui/button';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import ReprocessDataButton from './ReprocessDataButton';

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
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Filtrer par statut</h2>
          <p className="text-sm text-gray-500">
            {candidateCount} candidat{candidateCount !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <ReprocessDataButton />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedStatus === null ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange(null)}
          className="whitespace-nowrap"
        >
          Tous
        </Button>
        
        {Object.keys(CANDIDATE_STATUS_LABELS).map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusChange(status)}
            className="whitespace-nowrap"
          >
            {CANDIDATE_STATUS_LABELS[status as keyof typeof CANDIDATE_STATUS_LABELS]}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CandidatesHeader;
