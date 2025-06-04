
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CandidateData } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/ui/use-confirm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CandidatesTableProps {
  candidates: CandidateData[];
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted: (candidateId: string) => void;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({
  candidates,
  selectedStatus,
  onStatusChange,
  onViewCandidate,
  onCandidateDeleted
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const { toast } = useToast();
  const { confirm } = useConfirm();
  
  const handleStatusChange = (status: string | null) => {
    onStatusChange(status);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    const confirmed = await confirm({
      title: 'Supprimer le candidat ?',
      description: 'Êtes-vous sûr de vouloir supprimer ce candidat ? Cette action est irréversible.',
    });
    
    if (confirmed) {
      onCandidateDeleted(candidateId);
      toast({
        title: "Candidat supprimé",
        description: "Le candidat a été supprimé avec succès.",
      });
    }
  };

  const handleCandidateSelect = (candidate: CandidateData) => {
    setSelectedCandidate(candidate);
    onViewCandidate(candidate.id!);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualification': return 'bg-blue-100 text-blue-800';
      case 'contact': return 'bg-yellow-100 text-yellow-800';
      case 'entretien': return 'bg-purple-100 text-purple-800';
      case 'shortlist': return 'bg-green-100 text-green-800';
      case 'refusé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prénom</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Poste</TableHead>
            <TableHead>Expérience</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow 
              key={candidate.id} 
              onClick={() => setSelectedCandidate(candidate)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <TableCell>{candidate.first_name}</TableCell>
              <TableCell>{candidate.last_name}</TableCell>
              <TableCell>{candidate.email}</TableCell>
              <TableCell>{candidate.position || 'Non spécifié'}</TableCell>
              <TableCell>{candidate.years_experience || 0} ans</TableCell>
              <TableCell>
                <Badge className={getStatusColor(candidate.detailed_status || 'initial')}>
                  {CANDIDATE_STATUS_LABELS[candidate.detailed_status || 'initial'] || 'Inconnu'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <span className="font-medium">{candidate.score || 0}%</span>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Ouvrir le menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleCandidateSelect(candidate)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDeleteCandidate(candidate.id!)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CandidatesTable;
