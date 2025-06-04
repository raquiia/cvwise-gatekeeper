
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CandidateData } from '@/services/data/candidateService';
import KanbanColumn from './KanbanColumn';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { useAIScoring } from '@/hooks/use-ai-scoring';

interface CandidatesKanbanViewProps {
  candidates: CandidateData[];
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
}

const CandidatesKanbanView: React.FC<CandidatesKanbanViewProps> = ({
  candidates,
  onViewCandidate,
  onCandidateDeleted
}) => {
  const { preloadScoresFromDatabase } = useAIScoring();

  // Précharger les scores AI pour tous les candidats du kanban
  useEffect(() => {
    const candidateIds = candidates.map(c => c.id!).filter(Boolean);
    if (candidateIds.length > 0) {
      console.log('Preloading AI scores for kanban candidates:', candidateIds.length);
      preloadScoresFromDatabase(candidateIds);
    }
  }, [candidates, preloadScoresFromDatabase]);

  const statuses = [
    'initial',
    'contact',
    'prequalification',
    'ec1',
    'ec2',
    'presentation_client',
    'en_mission',
    'refus',
    'ancien_employe'
  ];

  const getCandidatesByStatus = (status: string) => {
    return candidates.filter(candidate => 
      (candidate.detailed_status || 'initial') === status
    );
  };

  return (
    <div className="w-full">
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {statuses.map(status => {
          const statusCandidates = getCandidatesByStatus(status);
          const statusLabel = CANDIDATE_STATUS_LABELS[status] || status;
          
          return (
            <KanbanColumn
              key={status}
              status={status}
              title={statusLabel}
              candidates={statusCandidates}
              onViewCandidate={onViewCandidate}
              onCandidateDeleted={onCandidateDeleted}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CandidatesKanbanView;
