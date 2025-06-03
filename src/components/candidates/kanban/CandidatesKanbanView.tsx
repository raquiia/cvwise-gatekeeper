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

  // Group candidates by status with enhanced debugging
  const candidatesByStatus = useMemo(() => {
    console.log('🔄 Kanban: Processing candidates for grouping...');
    console.log('🔄 Total candidates received:', candidates.length);
    
    const groups: Record<string, CandidateData[]> = {};
    
    // Initialize all status groups
    Object.keys(CANDIDATE_STATUS_LABELS).forEach(status => {
      groups[status] = [];
    });
    
    // Group candidates by their detailed_status
    candidates.forEach((candidate, index) => {
      const rawStatus = candidate.detailed_status;
      const status = rawStatus || 'contact';
      
      console.log(`🎯 Kanban grouping candidate ${index + 1}: ${candidate.first_name} ${candidate.last_name}`);
      console.log(`   📊 Raw detailed_status: "${rawStatus}"`);
      console.log(`   📊 Final status used: "${status}"`);
      
      // Vérifier que le statut existe dans nos labels
      if (Object.keys(CANDIDATE_STATUS_LABELS).includes(status)) {
        groups[status].push(candidate);
        console.log(`   ✅ Added to group "${status}"`);
      } else {
        console.warn(`   ⚠️  Status "${status}" not found in CANDIDATE_STATUS_LABELS, using contact`);
        groups['contact'].push(candidate);
      }
    });
    
    // Debug: Afficher la répartition finale
    console.log('📊 Final Kanban distribution:');
    Object.entries(groups).forEach(([status, candidates]) => {
      console.log(`   ${status}: ${candidates.length} candidates`);
      if (candidates.length > 0) {
        candidates.forEach(c => console.log(`     - ${c.first_name} ${c.last_name} (ID: ${c.id})`));
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
