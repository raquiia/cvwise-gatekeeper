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

  // Group candidates by status - FIX: Properly extract the detailed_status
  const candidatesByStatus = useMemo(() => {
    const groups: Record<string, CandidateData[]> = {};
    
    // Initialize all status groups
    Object.keys(CANDIDATE_STATUS_LABELS).forEach(status => {
      groups[status] = [];
    });
    
    // Group candidates by their actual detailed_status
    candidates.forEach(candidate => {
      // CORRECTION: Extraire correctement le statut détaillé
      let status = 'initial'; // Valeur par défaut
      
      // Vérifier et extraire le statut détaillé
      if (candidate.detailed_status) {
        if (typeof candidate.detailed_status === 'string') {
          status = candidate.detailed_status.trim();
        } else if (typeof candidate.detailed_status === 'object' && candidate.detailed_status !== null) {
          // Si c'est un objet, essayer d'extraire la valeur
          const statusObj = candidate.detailed_status as any;
          if (statusObj.value) {
            status = String(statusObj.value).trim();
          } else if (statusObj.status) {
            status = String(statusObj.status).trim();
          }
        }
      }
      
      // Vérifier que le statut existe dans nos labels
      if (!Object.keys(CANDIDATE_STATUS_LABELS).includes(status)) {
        console.warn(`Status "${status}" not found in CANDIDATE_STATUS_LABELS, using initial for candidate ${candidate.first_name} ${candidate.last_name}`);
        status = 'initial';
      }
      
      console.log(`Kanban grouping: ${candidate.first_name} ${candidate.last_name} -> status: "${status}"`);
      
      if (groups[status]) {
        groups[status].push(candidate);
      } else {
        console.warn(`Group for status "${status}" not found, adding to initial`);
        groups['initial'].push(candidate);
      }
    });
    
    // Debug: Afficher la répartition
    Object.entries(groups).forEach(([status, candidates]) => {
      if (candidates.length > 0) {
        console.log(`Kanban group "${status}": ${candidates.length} candidates`);
        candidates.forEach(c => console.log(`  - ${c.first_name} ${c.last_name}`));
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
    'qualification',
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
