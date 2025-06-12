
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CandidateData } from '@/services/data/candidateService';
import KanbanColumn from './KanbanColumn';
import { CANDIDATE_STATUS_LABELS, candidateStatusService } from '@/services/data/candidateStatusService';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import { useToast } from '@/hooks/use-toast';

interface CandidatesKanbanViewProps {
  candidates: CandidateData[];
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
  jobOfferId?: string;
}

const CandidatesKanbanView: React.FC<CandidatesKanbanViewProps> = ({
  candidates,
  onViewCandidate,
  onCandidateDeleted,
  jobOfferId
}) => {
  const { preloadScoresFromDatabase } = useAIScoring();
  const { toast } = useToast();
  const [localCandidates, setLocalCandidates] = useState<CandidateData[]>(candidates);

  // Synchroniser avec les props candidates
  useEffect(() => {
    setLocalCandidates(candidates);
  }, [candidates]);

  // Précharger les scores AI SEULEMENT une fois et de manière intelligente
  useEffect(() => {
    const candidateIds = candidates.map(c => c.id!).filter(Boolean);
    if (candidateIds.length > 0) {
      console.log('Preloading AI scores for kanban candidates (once only):', candidateIds.length);
      preloadScoresFromDatabase(candidateIds, jobOfferId);
    }
  }, [candidates.length, preloadScoresFromDatabase, jobOfferId]); // Dépendance sur length seulement

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
    return localCandidates.filter(candidate => 
      (candidate.detailed_status || 'initial') === status
    );
  };

  const handleDrop = async (candidateId: string, newStatus: string) => {
    try {
      console.log('Updating candidate status via drag & drop:', { candidateId, newStatus });
      
      // Mise à jour optimiste locale AVANT l'appel API
      setLocalCandidates(prevCandidates => 
        prevCandidates.map(candidate => 
          candidate.id === candidateId 
            ? { ...candidate, detailed_status: newStatus }
            : candidate
        )
      );
      
      const success = await candidateStatusService.updateCandidateStatus(candidateId, newStatus);
      
      if (success) {
        toast({
          title: "Statut mis à jour",
          description: `Le candidat a été déplacé vers "${CANDIDATE_STATUS_LABELS[newStatus]}"`,
        });
        
        // PAS de rechargement complet - la mise à jour locale suffit
        // On ne call onCandidateDeleted que si nécessaire pour d'autres vues
      } else {
        // Rollback en cas d'échec
        setLocalCandidates(candidates);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le statut du candidat",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating candidate status:', error);
      
      // Rollback en cas d'erreur
      setLocalCandidates(candidates);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  };

  const handleCandidateDeleted = () => {
    // Rafraîchir seulement si on a une vraie suppression
    if (onCandidateDeleted) {
      onCandidateDeleted();
    }
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
              onCandidateDeleted={handleCandidateDeleted}
              onDrop={handleDrop}
              jobOfferId={jobOfferId}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CandidatesKanbanView;
