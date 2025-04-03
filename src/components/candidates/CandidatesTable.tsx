
import React from 'react';
import { ArrowUpDown, SlidersHorizontal, ChevronDown, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CandidateData } from '@/services/data/resumeDataService';
import CandidateTableRow from './CandidateTableRow';

interface CandidatesTableProps {
  candidates: CandidateData[];
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  onViewCandidate: (candidateId: string) => void;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({
  candidates,
  selectedStatus,
  onStatusChange,
  onViewCandidate
}) => {
  // Debug: Log the candidates data being received
  console.log('CandidatesTable - received candidates:', candidates);
  
  // Check if we have valid candidates data
  const validCandidates = Array.isArray(candidates) ? candidates : [];
  const candidatesCount = validCandidates.length;
  
  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Table Header with Sort Controls */}
      <div className="p-4 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-navy-dark">
            {candidatesCount} candidats
          </span>
          
          <Separator orientation="vertical" className="h-4" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-navy-dark">
                <span>Statut</span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onStatusChange(null)}>
                Tous
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange('active')}>
                <CheckCircle size={14} className="mr-2 text-emerald-500" />
                Actifs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange('qualification')}>
                <AlertTriangle size={14} className="mr-2 text-amber-500" />
                En qualification
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange('inactive')}>
                <XCircle size={14} className="mr-2 text-red-500" />
                Inactifs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-navy-dark">
            <ArrowUpDown size={14} className="mr-1" />
            Trier
          </Button>
          
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-navy-dark">
            <SlidersHorizontal size={14} className="mr-1" />
            Colonnes
          </Button>
        </div>
      </div>
      
      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-navy/5">
              <th className="text-left p-4 text-sm font-medium text-navy-dark">Nom</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark">Poste</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark">Entreprise</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark hidden lg:table-cell">Localisation</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark hidden lg:table-cell">Expérience</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark">Compétences</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark">Score</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark hidden md:table-cell">Mise à jour</th>
              <th className="text-center p-4 text-sm font-medium text-navy-dark">Actions</th>
            </tr>
          </thead>
          <tbody>
            {validCandidates.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  Aucun candidat trouvé. Importez des CV pour commencer à créer des candidats.
                </td>
              </tr>
            ) : (
              validCandidates.map((candidate) => (
                <CandidateTableRow 
                  key={candidate.id || `temp-${Math.random()}`}
                  candidate={candidate}
                  onViewCandidate={onViewCandidate}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidatesTable;
