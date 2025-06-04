
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, TrendingUp, Edit, Trash2, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { Button } from '@/components/ui/button';
import { candidateService } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateFormatter';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import { cn } from '@/lib/utils';

interface CandidateTableRowProps {
  candidate: CandidateData;
  onViewCandidate?: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
  hideScore?: boolean;
}

const CandidateTableRow: React.FC<CandidateTableRowProps> = ({ 
  candidate,
  onViewCandidate,
  onCandidateDeleted,
  hideScore = false
}) => {
  const skills = ensureStringArray(candidate.skills);
  const { toast } = useToast();
  const { getAIScore, isJobSpecific } = useAIScoring();
  
  // Utiliser le système AI scoring unifié
  const aiScore = getAIScore(candidate.id!);
  const displayScore = aiScore.score !== null ? aiScore.score : (candidate.score || 0);
  const isAIScore = aiScore.score !== null;

  const getStatusBadge = (status: string) => {
    const statusLabel = CANDIDATE_STATUS_LABELS[status] || status;
    
    switch (status) {
      case 'initial':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          {statusLabel}
        </Badge>;
      case 'contact':
        return <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50">
          {statusLabel}
        </Badge>;
      case 'prequalification':
        return <Badge variant="outline" className="border-purple-200 text-purple-800 bg-purple-50">
          {statusLabel}
        </Badge>;
      case 'ec1':
        return <Badge variant="outline" className="border-orange-200 text-orange-800 bg-orange-50">
          {statusLabel}
        </Badge>;
      case 'ec2':
        return <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50">
          {statusLabel}
        </Badge>;
      case 'presentation_client':
        return <Badge variant="outline" className="border-indigo-200 text-indigo-800 bg-indigo-50">
          {statusLabel}
        </Badge>;
      case 'en_mission':
        return <Badge variant="default" className="bg-green-100 text-green-800">
          {statusLabel}
        </Badge>;
      case 'refus':
        return <Badge variant="destructive">
          {statusLabel}
        </Badge>;
      case 'ancien_employe':
        return <Badge variant="outline" className="border-emerald-200 text-emerald-800 bg-emerald-50">
          {statusLabel}
        </Badge>;
      default:
        return <Badge variant="secondary">
          {statusLabel}
        </Badge>;
    }
  };

  const handleDelete = async () => {
    if (!candidate.id) return;
    
    try {
      await candidateService.deleteCandidate(candidate.id);
      toast({
        title: "Candidat supprimé",
        description: "Le candidat a été supprimé avec succès",
      });
      if (onCandidateDeleted) {
        onCandidateDeleted();
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le candidat",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreSource = (source?: string) => {
    switch (source) {
      case 'database': return 'BDD';
      case 'fresh_calculation': return 'Nouveau';
      case 'cache': return 'Cache';
      default: return 'Ancien';
    }
  };

  return (
    <TableRow className="hover:bg-muted/50">
      {/* Status Column - First */}
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          {getStatusBadge(candidate.detailed_status || 'initial')}
          {isJobSpecific && (
            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-300">
              <Briefcase size={10} className="mr-1" />
              Match
            </Badge>
          )}
        </div>
      </TableCell>
      
      {/* Name Column */}
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
      
      {/* Position Column */}
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">
            {candidate.position || 'Poste non spécifié'}
          </div>
        </div>
      </TableCell>
      
      {/* Company Column */}
      <TableCell>
        <div className="font-medium">
          {candidate.company || 'Non spécifiée'}
        </div>
      </TableCell>
      
      {/* Location Column */}
      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center text-sm">
          <MapPin size={14} className="mr-1 text-muted-foreground" />
          {candidate.location || 'Non spécifiée'}
        </div>
      </TableCell>
      
      {/* Experience Column */}
      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center text-sm">
          <Calendar size={14} className="mr-1 text-muted-foreground" />
          {candidate.years_experience ? `${candidate.years_experience} ans` : 'Non spécifiée'}
        </div>
      </TableCell>
      
      {/* Skills Column */}
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {skills.slice(0, 2).map((skill, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {skills.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{skills.length - 2}
            </Badge>
          )}
        </div>
      </TableCell>
      
      {/* Score Column avec système AI unifié */}
      {!hideScore && (
        <TableCell className="hidden xl:table-cell">
          <div className="flex items-center gap-2">
            {aiScore.isLoading ? (
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-gray-500">...</span>
              </div>
            ) : aiScore.error ? (
              <div className="flex items-center gap-1" title={aiScore.error}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                  getScoreColor(candidate.score || 0)
                )}>
                  {candidate.score || 0}
                </div>
                <Badge variant="secondary" className="text-xs">
                  Ancien
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                  getScoreColor(displayScore)
                )}>
                  {displayScore}
                </div>
                <Badge 
                  variant={isAIScore ? "default" : "secondary"} 
                  className={cn(
                    "text-xs",
                    isAIScore ? "bg-purple-100 text-purple-800 border-purple-300" : ""
                  )}
                  title={isAIScore ? aiScore.explanation : "Score calculé avec l'ancien système"}
                >
                  {isAIScore ? getScoreSource(aiScore.source) : 'Ancien'}
                </Badge>
              </div>
            )}
            {isJobSpecific && (
              <div title="Score de correspondance">
                <TrendingUp size={12} className="ml-1 text-purple-600" />
              </div>
            )}
          </div>
        </TableCell>
      )}
      
      {/* Updated Date Column */}
      <TableCell className="hidden md:table-cell">
        <div className="text-sm text-muted-foreground">
          {formatDate(candidate.updated_at || candidate.created_at || '')}
        </div>
      </TableCell>
      
      {/* Actions Column */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewCandidate && onViewCandidate(candidate.id!)}
            className="h-8 w-8 p-0"
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default CandidateTableRow;
