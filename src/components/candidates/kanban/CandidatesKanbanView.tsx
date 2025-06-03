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

  // Group candidates by status - CORRECTED: No more "initial" status
  const candidatesByStatus = useMemo(() => {
    const groups: Record<string, CandidateData[]> = {};
    
    // Initialize all status groups (sans "initial")
    Object.keys(CANDIDATE_STATUS_LABELS).forEach(status => {
      groups[status] = [];
    });
    
    // Group candidates by their detailed_status
    candidates.forEach(candidate => {
      const status = candidate.detailed_status || 'contact'; // CHANGEMENT: défaut = 'contact'
      
      console.log(`🎯 Kanban grouping: ${candidate.first_name} ${candidate.last_name} -> detailed_status: "${candidate.detailed_status}" -> using: "${status}"`);
      
      // Vérifier que le statut existe dans nos labels
      if (Object.keys(CANDIDATE_STATUS_LABELS).includes(status)) {
        groups[status].push(candidate);
      } else {
        console.warn(`⚠️  Status "${status}" not found in CANDIDATE_STATUS_LABELS, using contact for candidate ${candidate.first_name} ${candidate.last_name}`);
        groups['contact'].push(candidate); // CHANGEMENT: utiliser 'contact' au lieu de 'initial'
      }
    });
    
    // Debug: Afficher la répartition finale
    Object.entries(groups).forEach(([status, candidates]) => {
      if (candidates.length > 0) {
        console.log(`📊 Kanban group "${status}": ${candidates.length} candidates`);
        candidates.forEach(c => console.log(`  ✓ ${c.first_name} ${c.last_name} (${c.detailed_status})`));
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

  // Define the order of statuses for display (SANS "initial")
  const statusOrder = [
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
