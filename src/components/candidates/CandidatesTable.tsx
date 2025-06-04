
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { MoreHorizontal, Eye, Trash2, Phone, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CandidateData } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/ui/use-confirm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ensureStringArray } from '@/utils/candidateUtils';

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
      case 'initial': return 'bg-gray-100 text-gray-800';
      case 'contact': return 'bg-blue-100 text-blue-800';
      case 'prequalification': return 'bg-yellow-100 text-yellow-800';
      case 'ec1': return 'bg-purple-100 text-purple-800';
      case 'ec2': return 'bg-orange-100 text-orange-800';
      case 'presentation_client': return 'bg-indigo-100 text-indigo-800';
      case 'en_mission': return 'bg-green-100 text-green-800';
      case 'refus': return 'bg-red-100 text-red-800';
      case 'ancien_employe': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-semibold text-gray-700">Contact</TableHead>
            <TableHead className="font-semibold text-gray-700">Poste</TableHead>
            <TableHead className="font-semibold text-gray-700">Entreprise</TableHead>
            <TableHead className="font-semibold text-gray-700">Localisation</TableHead>
            <TableHead className="font-semibold text-gray-700">Expérience</TableHead>
            <TableHead className="font-semibold text-gray-700">Compétences</TableHead>
            <TableHead className="font-semibold text-gray-700">Statut</TableHead>
            <TableHead className="font-semibold text-gray-700">Score</TableHead>
            <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => {
            const skills = ensureStringArray(candidate.skills);
            
            return (
              <TableRow 
                key={candidate.id} 
                className="hover:bg-gray-50/50 transition-colors duration-200 border-b border-gray-100"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                      {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900">
                        {candidate.first_name} {candidate.last_name}
                      </div>
                      {candidate.email && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Mail size={12} className="mr-1 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{candidate.email}</span>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Phone size={12} className="mr-1 text-gray-400 flex-shrink-0" />
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="text-gray-800 font-medium">
                  {candidate.position || 'Non spécifié'}
                </TableCell>
                
                <TableCell className="text-gray-600">
                  {candidate.company || 'Non spécifiée'}
                </TableCell>
                
                <TableCell className="text-gray-600">
                  {candidate.location || 'Non spécifiée'}
                </TableCell>
                
                <TableCell className="text-gray-600">
                  {candidate.years_experience ? `${candidate.years_experience} ans` : 'Non spécifiée'}
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {skills.length > 0 ? (
                      <>
                        {skills.slice(0, 2).map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {skill}
                          </Badge>
                        ))}
                        {skills.length > 2 && (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                            +{skills.length - 2}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">Aucune</span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge className={getStatusColor(candidate.detailed_status || 'initial')}>
                    {CANDIDATE_STATUS_LABELS[candidate.detailed_status || 'initial'] || 'Initial'}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center">
                    <span className={`font-bold ${getScoreColor(candidate.score || 0)}`}>
                      {candidate.score || 0}%
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                        <span className="sr-only">Ouvrir le menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border shadow-lg">
                      <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => handleCandidateSelect(candidate)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir le profil
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCandidate(candidate.id!)}
                        className="cursor-pointer hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {candidates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun candidat trouvé</p>
        </div>
      )}
    </div>
  );
};

export default CandidatesTable;
