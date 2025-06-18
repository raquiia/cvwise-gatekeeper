
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Trash2, User } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { formatDate } from '@/utils/dateFormatter';
import { useToast } from '@/hooks/use-toast';
import { candidateService } from '@/services/data/candidateService';

interface CandidatesTableProps {
  candidates: CandidateData[];
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted: (candidateId: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({
  candidates,
  onViewCandidate,
  onCandidateDeleted,
  currentUserId,
  isAdmin = false
}) => {
  const { toast } = useToast();

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      const candidate = candidates.find(c => c.id === candidateId);
      
      if (!candidate) {
        toast({
          title: "Erreur",
          description: "Candidat non trouvé",
          variant: "destructive",
        });
        return;
      }
      
      // Vérifier les permissions
      if (!isAdmin && candidate.user_id !== currentUserId) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas l'autorisation de supprimer ce candidat",
          variant: "destructive",
        });
        return;
      }

      if (!confirm('Êtes-vous sûr de vouloir supprimer ce candidat ?')) {
        return;
      }

      await candidateService.deleteCandidate(candidateId);
      onCandidateDeleted(candidateId);
      
      toast({
        title: "Succès",
        description: "Candidat supprimé avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de supprimer le candidat",
        variant: "destructive",
      });
    }
  };

  const canAccessCandidate = (candidate: CandidateData) => {
    return isAdmin || candidate.user_id === currentUserId;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'en_mission':
        return 'default';
      case 'contact':
      case 'prequalification':
        return 'secondary';
      case 'ec1':
      case 'ec2':
        return 'outline';
      case 'presentation_client':
        return 'secondary';
      case 'refus':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Aucun candidat trouvé
        </h3>
        <p className="text-muted-foreground">
          Commencez par importer des CV pour voir vos candidats ici.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Poste</TableHead>
            <TableHead>Expérience</TableHead>
            <TableHead>Localisation</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Score</TableHead>
            {isAdmin && <TableHead>Propriétaire</TableHead>}
            <TableHead>Dernière MAJ</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow key={candidate.id}>
              <TableCell className="font-medium">
                {candidate.first_name} {candidate.last_name}
              </TableCell>
              <TableCell>{candidate.position || 'Non spécifié'}</TableCell>
              <TableCell>
                {candidate.years_experience ? `${candidate.years_experience} ans` : 'Non spécifié'}
              </TableCell>
              <TableCell>{candidate.location || 'Non spécifiée'}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(candidate.detailed_status || 'initial')}>
                  {CANDIDATE_STATUS_LABELS[candidate.detailed_status as keyof typeof CANDIDATE_STATUS_LABELS] || 'Initial'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{candidate.ai_score || candidate.score || 0}/100</span>
                </div>
              </TableCell>
              {isAdmin && (
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    ID: {candidate.user_id?.substring(0, 8)}...
                  </span>
                </TableCell>
              )}
              <TableCell>
                {formatDate(candidate.updated_at || candidate.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewCandidate(candidate.id!)}
                    disabled={!canAccessCandidate(candidate)}
                    title={!canAccessCandidate(candidate) ? "Vous n'avez pas accès à ce candidat" : "Voir le profil"}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCandidate(candidate.id!)}
                    disabled={!canAccessCandidate(candidate)}
                    title={!canAccessCandidate(candidate) ? "Vous n'avez pas accès à ce candidat" : "Supprimer"}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CandidatesTable;
