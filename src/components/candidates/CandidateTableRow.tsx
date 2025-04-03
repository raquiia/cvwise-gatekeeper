
import React from 'react';
import { Star, MapPin, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CandidateData } from '@/services/data/resumeDataService';

interface CandidateTableRowProps {
  candidate: CandidateData;
  onViewCandidate: (candidateId: string) => void;
}

const CandidateTableRow: React.FC<CandidateTableRowProps> = ({ candidate, onViewCandidate }) => {
  return (
    <tr key={candidate.id} className="border-b border-border/10 hover:bg-navy/5 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy-dark font-medium">
            {candidate.first_name?.[0]}{candidate.last_name?.[0]}
          </div>
          <div>
            <span className="font-medium text-navy-dark">{candidate.first_name} {candidate.last_name}</span>
            <div className="flex items-center mt-0.5">
              {candidate.status === 'active' ? (
                <div className="flex items-center text-xs text-emerald-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></div>
                  Actif
                </div>
              ) : (
                <div className="flex items-center text-xs text-red-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></div>
                  {candidate.status === 'qualification' ? 'En qualification' : 
                   candidate.status === 'inactive' ? 'Inactif' : 
                   candidate.status === 'interview' ? 'En entretien' :
                   candidate.status === 'hired' ? 'Embauché' : 'Statut inconnu'}
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="p-4 text-navy-dark">
        {candidate.position || 'Non spécifié'}
      </td>
      <td className="p-4 text-navy-dark">
        {candidate.company || 'Non spécifié'}
      </td>
      <td className="p-4 text-muted-foreground hidden lg:table-cell">
        {candidate.location ? (
          <div className="flex items-center">
            <MapPin size={14} className="mr-1" />
            {candidate.location}
          </div>
        ) : 'Non spécifié'}
      </td>
      <td className="p-4 text-muted-foreground hidden lg:table-cell">
        {candidate.years_experience ? `${candidate.years_experience} ans` : 'Non spécifié'}
      </td>
      <td className="p-4">
        <div className="flex flex-wrap gap-1">
          {candidate.skills && candidate.skills.length > 0 ? (
            candidate.skills.slice(0, 3).map((skill, idx) => (
              <span key={idx} className="inline-block px-2 py-0.5 bg-navy/10 text-navy-dark text-xs rounded-full">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">Non spécifié</span>
          )}
          {candidate.skills && candidate.skills.length > 3 && (
            <span className="inline-block px-2 py-0.5 bg-navy/5 text-navy-dark text-xs rounded-full">
              +{candidate.skills.length - 3}
            </span>
          )}
        </div>
      </td>
      <td className="p-4">
        {candidate.score ? (
          <div className={`rating-chip ${
            candidate.score > 85 ? 'rating-high' : 
            candidate.score > 65 ? 'rating-medium' : 
            'rating-low'
          }`}>
            <Star size={12} />
            {candidate.score}%
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">N/A</span>
        )}
      </td>
      <td className="p-4 text-muted-foreground hidden md:table-cell">
        {candidate.updated_at ? new Date(candidate.updated_at).toLocaleDateString() : 'N/A'}
      </td>
      <td className="p-4">
        <div className="flex items-center justify-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onViewCandidate(candidate.id)}
          >
            <Eye size={16} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Éditer
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 size={14} className="mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
};

export default CandidateTableRow;
