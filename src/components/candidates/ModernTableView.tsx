
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Edit, 
  Trash2, 
  Eye,
  Star,
  Clock,
  Award,
  Briefcase,
  Mail,
  Phone,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';
import { calculateCandidateScore, getScoreEvaluation } from '@/services/scoring/candidateScoring';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { candidateService } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateFormatter';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ModernTableViewProps {
  candidates: CandidateData[];
  selectedCandidates: Set<string>;
  onSelectCandidate: (candidateId: string, selected: boolean) => void;
  onSelectAll: () => void;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
}

const ModernTableView: React.FC<ModernTableViewProps> = ({
  candidates,
  selectedCandidates,
  onSelectCandidate,
  onSelectAll,
  onViewCandidate,
  onCandidateDeleted
}) => {
  const { toast } = useToast();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Fonction pour générer une couleur basée sur les initiales
  const getAvatarColor = (firstName: string, lastName: string) => {
    const colors = [
      'bg-gradient-to-br from-purple-500 to-pink-500',
      'bg-gradient-to-br from-blue-500 to-cyan-500',
      'bg-gradient-to-br from-green-500 to-teal-500',
      'bg-gradient-to-br from-orange-500 to-red-500',
      'bg-gradient-to-br from-indigo-500 to-purple-500',
      'bg-gradient-to-br from-pink-500 to-rose-500',
      'bg-gradient-to-br from-cyan-500 to-blue-500',
      'bg-gradient-to-br from-teal-500 to-green-500',
    ];
    const nameHash = (firstName + lastName).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[nameHash % colors.length];
  };

  const getStatusBadge = (status: string) => {
    const statusLabel = CANDIDATE_STATUS_LABELS[status] || status;
    
    const statusConfig = {
      initial: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: Clock, 
        pulse: false 
      },
      contact: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: Phone, 
        pulse: true 
      },
      prequalification: { 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        icon: Award, 
        pulse: true 
      },
      ec1: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: Star, 
        pulse: true 
      },
      ec2: { 
        color: 'bg-amber-100 text-amber-800 border-amber-200', 
        icon: Star, 
        pulse: true 
      },
      presentation_client: { 
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200', 
        icon: Briefcase, 
        pulse: true 
      },
      en_mission: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: TrendingUp, 
        pulse: false 
      },
      refus: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: Clock, 
        pulse: false 
      },
      ancien_employe: { 
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
        icon: Award, 
        pulse: false 
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.initial;
    const Icon = config.icon;

    return (
      <Badge 
        variant="outline" 
        className={cn(
          config.color,
          'border text-xs font-medium flex items-center gap-1 transition-all duration-300',
          config.pulse && 'animate-pulse'
        )}
      >
        <Icon size={10} />
        {statusLabel}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const handleDelete = async (candidateId: string) => {
    try {
      await candidateService.deleteCandidate(candidateId, true);
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

  const candidatesCount = candidates.length;
  const selectedCount = selectedCandidates.size;

  return (
    <div className="rounded-lg border border-purple-200/30 dark:border-purple-800/20 overflow-hidden bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm shadow-xl">
      {/* En-tête de tableau moderne */}
      <div className="bg-gradient-to-r from-purple-50/80 to-white/80 dark:from-purple-950/30 dark:to-navy-dark/50 border-b border-purple-200/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedCount === candidatesCount && candidatesCount > 0}
              ref={(input) => {
                if (input) {
                  input.indeterminate = selectedCount > 0 && selectedCount < candidatesCount;
                }
              }}
              onChange={onSelectAll}
              className="w-4 h-4 rounded border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500/25"
            />
            <h3 className="font-semibold text-navy-dark dark:text-sand">
              {candidatesCount} candidat{candidatesCount > 1 ? 's' : ''}
            </h3>
            {selectedCount > 0 && (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <Table>
        <TableHeader>
          <TableRow className="border-b border-purple-200/30 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20 hover:bg-purple-50/50 dark:hover:bg-purple-950/20">
            <TableHead className="w-12"></TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand">Candidat</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand">Score</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand">Statut</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand">Poste</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand hidden lg:table-cell">Localisation</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand hidden xl:table-cell">Expérience</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand">Compétences</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand hidden md:table-cell">Dernière MAJ</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate, index) => {
            const skills = ensureStringArray(candidate.skills);
            const scoreBreakdown = calculateCandidateScore(candidate);
            const isHovered = hoveredRow === candidate.id;
            const isSelected = selectedCandidates.has(candidate.id!);

            return (
              <TableRow
                key={candidate.id || `temp-${Math.random()}`}
                className={cn(
                  "group transition-all duration-300 border-b border-purple-100/30 dark:border-purple-800/20",
                  "hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent dark:hover:from-purple-950/20 dark:hover:to-transparent",
                  "hover:shadow-lg hover:shadow-purple-500/10",
                  isSelected && "bg-purple-50/70 dark:bg-purple-950/30 shadow-md shadow-purple-500/20",
                  isHovered && "scale-[1.01] transform-gpu"
                )}
                onMouseEnter={() => setHoveredRow(candidate.id!)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Checkbox */}
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelectCandidate(candidate.id!, e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500/25"
                  />
                </TableCell>

                {/* Candidat */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12 ring-2 ring-white/50 shadow-lg transition-transform duration-200 group-hover:scale-110">
                        <AvatarFallback className={cn(
                          getAvatarColor(candidate.first_name || '', candidate.last_name || ''),
                          "text-white text-sm font-bold shadow-inner"
                        )}>
                          {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Badge "nouveau" si récent */}
                      {new Date(candidate.created_at || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <Link 
                        to={`/candidates/${candidate.id}`}
                        className="font-semibold text-navy-dark dark:text-sand hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 block truncate"
                      >
                        {candidate.first_name} {candidate.last_name}
                      </Link>
                      {candidate.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail size={12} />
                          <span className="truncate">{candidate.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Score avec cercle de progression */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="relative w-12 h-12">
                      <Progress 
                        value={scoreBreakdown.overall} 
                        className="h-2 w-full rotate-90 origin-center scale-150"
                      />
                      <div className={cn(
                        "absolute inset-0 flex items-center justify-center text-sm font-bold",
                        getScoreColor(scoreBreakdown.overall)
                      )}>
                        {scoreBreakdown.overall}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Statut */}
                <TableCell>
                  {getStatusBadge(candidate.detailed_status || 'initial')}
                </TableCell>

                {/* Poste */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {candidate.position || 'Poste non spécifié'}
                    </div>
                    {candidate.company && (
                      <div className="text-xs text-muted-foreground">
                        {candidate.company}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Localisation */}
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin size={12} className="text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{candidate.location || 'Non spécifiée'}</span>
                  </div>
                </TableCell>

                {/* Expérience */}
                <TableCell className="hidden xl:table-cell">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar size={12} className="text-muted-foreground" />
                    <span>{candidate.years_experience ? `${candidate.years_experience} ans` : 'N/A'}</span>
                  </div>
                </TableCell>

                {/* Compétences */}
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {skills.slice(0, 3).map((skill, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs bg-white/50 dark:bg-navy-dark/50 border-purple-200/50 hover:bg-purple-50"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {skills.length > 3 && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
                      >
                        +{skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Dernière MAJ */}
                <TableCell className="hidden md:table-cell">
                  <div className="text-sm text-muted-foreground">
                    {formatDate(candidate.updated_at || candidate.created_at || '')}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className={cn(
                    "flex items-center justify-center gap-1 transition-all duration-300",
                    isHovered ? "opacity-100 translate-x-0" : "opacity-60 translate-x-1"
                  )}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewCandidate(candidate.id!)}
                      className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      <Eye size={14} />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                        >
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-md border-purple-100/50 shadow-lg">
                        <DropdownMenuItem onClick={() => onViewCandidate(candidate.id!)}>
                          <Edit size={14} className="mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(candidate.id!)}
                          className="text-red-600 focus:text-red-800"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Message si aucun candidat */}
      {candidates.length === 0 && (
        <div className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 text-purple-300 dark:text-purple-700 opacity-50 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 010 7.75" />
              </svg>
            </div>
            <p className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-2">Aucun candidat trouvé</p>
            <p className="text-muted-foreground text-center max-w-md">
              Importez des CV pour commencer à créer des profils de candidats.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernTableView;
