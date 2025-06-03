
import React, { useState, useMemo } from 'react';
import { CandidateData } from '@/services/data/candidateService';
import { CANDIDATE_STATUS_LABELS, candidateStatusService } from '@/services/data/candidateStatusService';
import { useToast } from '@/hooks/use-toast';
import KanbanColumn from './KanbanColumn';

interface CandidatesKanbanViewProps {
  candidates: CandidateData[];
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
  onCandidateUpdated?: () => void;
}

const CandidatesKanbanView: React.FC<CandidatesKanbanViewProps> = ({
  candidates,
  onViewCandidate,
  onCandidateDeleted,
  onCandidateUpdated
}) => {
  const { toast } = useToast();
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null);

  // Group candidates by status
  const candidatesByStatus = useMemo(() => {
    const groups: Record<string, CandidateData[]> = {};
    
    // Initialize all status groups
    Object.keys(CANDIDATE_STATUS_LABELS).forEach(status => {
      groups[status] = [];
    });
    
    // Group candidates by their status
    candidates.forEach(candidate => {
      const status = candidate.detailed_status || 'initial';
      console.log(`Kanban: Candidate ${candidate.first_name} ${candidate.last_name} has status: ${status}`);
      if (groups[status]) {
        groups[status].push(candidate);
      } else {
        // Fallback for unknown statuses
        console.warn(`Unknown status ${status}, placing in initial`);
        groups['initial'].push(candidate);
      }
    });
    
    return groups;
  }, [candidates]);

  const handleDrop = async (candidateId: string, newStatus: string) => {
    try {
      const success = await candidateStatusService.updateCandidateStatus(candidateId, newStatus);
      
      if (success) {
        toast({
          title: "Statut mis à jour",
          description: `Le statut du candidat a été modifié en "${CANDIDATE_STATUS_LABELS[newStatus]}"`,
        });
        
        // Trigger immediate refresh of parent data
        if (onCandidateUpdated) {
          console.log('Triggering data refresh after status update');
          onCandidateUpdated();
        }
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
    
    setDraggedCandidate(null);
  };

  // Handle status change from within cards - ensure immediate refresh
  const handleStatusChange = async () => {
    console.log('Status changed in Kanban, triggering immediate refresh');
    if (onCandidateUpdated) {
      await onCandidateUpdated();
    }
  };

  // Define the order of statuses for display
  const statusOrder = [
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

  return (
    <div className="w-full">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusOrder.map(status => (
          <KanbanColumn
            key={status}
            title={CANDIDATE_STATUS_LABELS[status]}
            status={status}
            candidates={candidatesByStatus[status] || []}
            onViewCandidate={onViewCandidate}
            onCandidateDeleted={onCandidateDeleted}
            onCandidateUpdated={handleStatusChange}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
};

export default CandidatesKanbanView;
