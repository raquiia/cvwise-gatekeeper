
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';
import { calculateCandidateScore, getScoreEvaluation } from '@/services/scoring/candidateScoring';

interface CandidateTableRowProps {
  candidate: CandidateData;
}

const CandidateTableRow: React.FC<CandidateTableRowProps> = ({ candidate }) => {
  const skills = ensureStringArray(candidate.skills);
  
  // Calcul du score intelligent
  const scoreBreakdown = calculateCandidateScore(candidate);
  const evaluation = getScoreEvaluation(scoreBreakdown.overall);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Actif</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Inactif</Badge>;
      case 'qualification':
        return <Badge variant="secondary">En qualification</Badge>;
      case 'interview':
        return <Badge variant="outline" className="border-blue-200 text-blue-800">Entretien</Badge>;
      case 'hired':
        return <Badge variant="default" className="bg-green-100 text-green-800">Embauché</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  return (
    <TableRow className="hover:bg-muted/50 cursor-pointer">
      <TableCell className="font-medium">
        <Link 
          to={`/candidates/${candidate.id}`}
          className="flex items-center space-x-3 text-navy-dark hover:text-navy"
        >
          <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-sand text-sm font-medium">
            {candidate.first_name?.[0]}{candidate.last_name?.[0]}
          </div>
          <div>
            <div className="font-medium">
              {candidate.first_name} {candidate.last_name}
            </div>
            {candidate.email && (
              <div className="text-sm text-muted-foreground">
                {candidate.email}
              </div>
            )}
          </div>
        </Link>
      </TableCell>
      
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">
            {candidate.position || 'Poste non spécifié'}
          </div>
          {candidate.company && (
            <div className="text-sm text-muted-foreground">
              {candidate.company}
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="space-y-2">
          {candidate.location && (
            <div className="flex items-center text-sm">
              <MapPin size={14} className="mr-1 text-muted-foreground" />
              {candidate.location}
            </div>
          )}
          {candidate.years_experience && (
            <div className="flex items-center text-sm">
              <Calendar size={14} className="mr-1 text-muted-foreground" />
              {candidate.years_experience} ans
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {skills.slice(0, 3).map((skill, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {skills.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{skills.length - 3}
            </Badge>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <TrendingUp size={14} className="text-muted-foreground" />
            <span className="font-semibold text-lg">
              {scoreBreakdown.overall}
            </span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${evaluation.bgColor} ${evaluation.color}`}>
            {scoreBreakdown.overall >= 85 ? 'Excellent' : 
             scoreBreakdown.overall >= 70 ? 'Très bon' :
             scoreBreakdown.overall >= 55 ? 'Bon' :
             scoreBreakdown.overall >= 40 ? 'Potentiel' : 'À développer'}
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        {getStatusBadge(candidate.status || 'pending')}
      </TableCell>
    </TableRow>
  );
};

export default CandidateTableRow;
