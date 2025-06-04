
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2 } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { candidateService } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { useCandidateData } from '@/context/CandidateDataContext';
import StatusSelector from './detail/StatusSelector';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';

interface CandidateTableRowProps {
  candidate: CandidateData;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
}

const CandidateTableRow: React.FC<CandidateTableRowProps> = ({
  candidate,
  onViewCandidate,
  onCandidateDeleted
}) => {
  const { toast } = useToast();
  const { onCandidateUpdated: globalRefresh } = useCandidateData();

  const handleDeleteCandidate = async () => {
    if (!candidate.id) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce candidat ?')) {
      return;
    }

    try {
      await candidateService.deleteCandidate(candidate.id);
      toast({
        title: "Candidat supprimé",
        description: "Le candidat a été supprimé avec succès.",
      });
      
      if (onCandidateDeleted) {
        onCandidateDeleted();
      }
      
      // Also trigger global refresh
      await globalRefresh();
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le candidat",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    console.log(`Status changed for candidate ${candidate.id}: ${newStatus}`);
    // Force refresh with both local and global mechanisms
    if (onCandidateDeleted) {
      onCandidateDeleted();
    }
    
    // Global refresh to update all views
    await globalRefresh();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const candidateScore = candidate.score || 0;
  // Ensuring we have a valid status
  const candidateStatus = candidate.detailed_status || 'contact';

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">
        {candidate.first_name} {candidate.last_name}
      </TableCell>
      <TableCell>{candidate.email}</TableCell>
      <TableCell>{candidate.position || 'Non spécifié'}</TableCell>
      <TableCell>{candidate.location || 'Non spécifié'}</TableCell>
      <TableCell>{candidate.years_experience || 0} ans</TableCell>
      <TableCell>
        <span className={`font-semibold ${getScoreColor(candidateScore)}`}>
          {candidateScore}%
        </span>
      </TableCell>
      <TableCell>
        <StatusSelector 
          candidateId={candidate.id!}
          currentStatus={candidateStatus}
          onStatusChange={handleStatusChange}
          onDataRefresh={onCandidateDeleted}
          onGlobalRefresh={globalRefresh}
        />
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewCandidate(candidate.id!)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteCandidate}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default CandidateTableRow;
