
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  MoreHorizontal,
  Building
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
        color: 'bg-gray-100 text-gray-700 border-gray-200', 
        icon: Clock, 
        pulse: false 
      },
      contact: { 
        color: 'bg-blue-100 text-blue-700 border-blue-200', 
        icon: Phone, 
        pulse: false 
      },
      prequalification: { 
        color: 'bg-purple-100 text-purple-700 border-purple-200', 
        icon: Award, 
        pulse: false 
      },
      ec1: { 
        color: 'bg-orange-100 text-orange-700 border-orange-200', 
        icon: Star, 
        pulse: false 
      },
      ec2: { 
        color: 'bg-amber-100 text-amber-700 border-amber-200', 
        icon: Star, 
        pulse: false 
      },
      presentation_client: { 
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200', 
        icon: Briefcase, 
        pulse: false 
      },
      en_mission: { 
        color: 'bg-green-100 text-green-700 border-green-200', 
        icon: TrendingUp, 
        pulse: false 
      },
      refus: { 
        color: 'bg-red-100 text-red-700 border-red-200', 
        icon: Clock, 
        pulse: false 
      },
      ancien_employe: { 
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
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
          'border text-xs font-medium flex items-center gap-1.5 px-2 py-1'
        )}
      >
        <Icon size={10} />
        {statusLabel}
      </Badge>
    );
  };

  const getScoreBadge = (score: number) => {
    let bgColor = 'bg-red-100 text-red-700 border-red-200';
    let label = 'Faible';
    
    if (score >= 80) {
      bgColor = 'bg-green-100 text-green-700 border-green-200';
      label = 'Excellent';
    } else if (score >= 60) {
      bgColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
      label = 'Bon';
    }

    return (
      <Badge 
        variant="outline" 
        className={cn(bgColor, 'border text-xs font-semibold px-2 py-1')}
      >
        {score}/100
      </Badge>
    );
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
            <TableHead className="font-semibold text-navy-dark dark:text-sand w-80">Candidat</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand w-24">Score</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand w-32">Statut</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand w-40">Poste recherché</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand hidden xl:table-cell w-24">Expérience</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand">Compétences</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand hidden md:table-cell w-32">Dernière MAJ</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand text-center w-28">Actions</TableHead>
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
                  "group transition-all duration-200 border-b border-purple-100/30 dark:border-purple-800/20",
                  "hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-transparent dark:hover:from-purple-950/15 dark:hover:to-transparent",
                  isSelected && "bg-purple-50/50 dark:bg-purple-950/20",
                  "cursor-pointer"
                )}
                onMouseEnter={() => setHoveredRow(candidate.id!)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Checkbox */}
                <TableCell className="py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelectCandidate(candidate.id!, e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500/25"
                  />
                </TableCell>

                {/* Candidat */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10 ring-2 ring-white/50 shadow-sm">
                        <AvatarFallback className={cn(
                          getAvatarColor(candidate.first_name || '', candidate.last_name || ''),
                          "text-white text-sm font-semibold"
                        )}>
                          {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Badge "nouveau" si récent */}
                      {new Date(candidate.created_at || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <Link 
                        to={`/candidates/${candidate.id}`}
                        className="font-semibold text-navy-dark dark:text-sand hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 block"
                      >
                        {candidate.first_name} {candidate.last_name}
                      </Link>
                      
                      {/* Email */}
                      {candidate.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <Mail size={11} />
                          <span className="truncate">{candidate.email}</span>
                        </div>
                      )}
                      
                      {/* Entreprise et localisation sur la même ligne */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {candidate.company && (
                          <div className="flex items-center gap-1">
                            <Building size={11} />
                            <span className="font-medium">{candidate.company}</span>
                          </div>
                        )}
                        {candidate.company && candidate.location && (
                          <span>•</span>
                        )}
                        {candidate.location && (
                          <div className="flex items-center gap-1">
                            <MapPin size={11} />
                            <span>{candidate.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Score simplifié */}
                <TableCell className="py-3">
                  {getScoreBadge(scoreBreakdown.overall)}
                </TableCell>

                {/* Statut */}
                <TableCell className="py-3">
                  {getStatusBadge(candidate.detailed_status || 'initial')}
                </TableCell>

                {/* Poste recherché */}
                <TableCell className="py-3">
                  <div className="text-sm font-medium text-navy-dark dark:text-sand">
                    {candidate.position || 'Poste non spécifié'}
                  </div>
                </TableCell>

                {/* Expérience */}
                <TableCell className="hidden xl:table-cell py-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar size={12} />
                    <span>{candidate.years_experience ? `${candidate.years_experience} ans` : 'N/A'}</span>
                  </div>
                </TableCell>

                {/* Compétences */}
                <TableCell className="py-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {skills.slice(0, 2).map((skill, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs bg-white/60 dark:bg-navy-dark/60 border-purple-200/40 text-muted-foreground px-1.5 py-0.5"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {skills.length > 2 && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 py-0.5"
                      >
                        +{skills.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Dernière MAJ */}
                <TableCell className="hidden md:table-cell py-3">
                  <div className="text-xs text-muted-foreground">
                    {formatDate(candidate.updated_at || candidate.created_at || '')}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3">
                  <div className={cn(
                    "flex items-center justify-center gap-1 transition-all duration-200",
                    isHovered ? "opacity-100" : "opacity-60"
                  )}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewCandidate(candidate.id!)}
                      className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      <Eye size={13} />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                        >
                          <MoreHorizontal size={13} />
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
