import React, { useState, useMemo, useEffect } from 'react';
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Brain, Sparkles, Trash2, Lock, MapPin, Briefcase, Phone } from 'lucide-react';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import { CandidateData, candidateService } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';
import { getLastCompany } from '@/utils/companyUtils';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/ui/use-confirm';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OptimizedCandidatesTableProps {
  candidates: CandidateData[];
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted: (candidateId: string) => void;
  jobOfferId?: string;
  isGlobalMode?: boolean;
  currentUserId?: string;
}

const OptimizedCandidatesTable: React.FC<OptimizedCandidatesTableProps> = ({
  candidates,
  selectedStatus,
  onStatusChange,
  onViewCandidate,
  onCandidateDeleted,
  jobOfferId,
  isGlobalMode = false,
  currentUserId
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { getAIScore, preloadScoresFromDatabase, isJobSpecific } = useAIScoring();

  // Précharger les scores depuis la base de données au chargement
  useEffect(() => {
    const candidateIds = candidates.map(c => c.id!).filter(Boolean);
    if (candidateIds.length > 0) {
      console.log('Preloading AI scores for optimized candidates table');
      preloadScoresFromDatabase(candidateIds, jobOfferId);
    }
  }, [candidates, preloadScoresFromDatabase, jobOfferId]);

  const jobSpecific = isJobSpecific(jobOfferId);

  const handleDeleteCandidate = async (candidateId: string, candidate: CandidateData, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Vérifier si l'utilisateur peut supprimer ce candidat
    const isOwnCandidate = candidate.user_id === currentUserId;
    if (!isOwnCandidate) {
      toast({
        title: "Action non autorisée",
        description: "Vous ne pouvez supprimer que vos propres candidats.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const confirmed = await confirm({
        title: 'Supprimer le candidat ?',
        description: 'Êtes-vous sûr de vouloir supprimer ce candidat ? Cette action est irréversible.',
      });
      
      if (confirmed) {
        console.log('Deleting candidate:', candidateId);
        
        // Supprimer le candidat via le service
        const success = await candidateService.deleteCandidate(candidateId);
        
        if (success) {
          console.log('Candidate deleted successfully');
          
          // Informer le parent que le candidat a été supprimé
          onCandidateDeleted(candidateId);
          
          toast({
            title: "Candidat supprimé",
            description: "Le candidat a été supprimé avec succès.",
          });
        } else {
          throw new Error('Échec de la suppression');
        }
      }
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le candidat",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status: string | undefined | null) => {
    const normalizedStatus = status?.toLowerCase().trim();
    switch (normalizedStatus) {
      case 'en mission':
      case 'en_mission':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'en cours':
      case 'en_cours':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'refusé':
      case 'refuse':
        return 'bg-red-500/10 text-red-600 border-red-200';
      case 'nouveau':
      case 'initial':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string | undefined | null) => {
    if (!status) return 'Initial';
    const normalizedStatus = status.toLowerCase().trim();
    switch (normalizedStatus) {
      case 'en_mission': return 'En Mission';
      case 'en_cours': return 'En Cours';
      case 'refuse': return 'Refusé';
      case 'nouveau': return 'Nouveau';
      default: return status;
    }
  };

  const columns: ColumnDef<CandidateData>[] = useMemo(() => [
    // Column 1: Candidate (25%) - Compact name, email, avatar
    {
      id: 'candidate',
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Candidat
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const isOwnCandidate = candidate.user_id === currentUserId;
        const ownerName = candidate.owner_first_name && candidate.owner_last_name 
          ? `${candidate.owner_first_name} ${candidate.owner_last_name}`
          : null;
        
        return (
          <div className="flex items-center space-x-2 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-help",
                    isOwnCandidate ? "bg-gradient-to-br from-primary to-primary/80 shadow-sm" : "bg-muted-foreground/70"
                  )}>
                    {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-medium">{isOwnCandidate ? "Votre candidat" : `Candidat de ${ownerName || 'Autre'}`}</p>
                    {candidate.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3" />
                        <span>{candidate.phone}</span>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground truncate text-sm">
                {candidate.first_name} <span className="font-bold">{candidate.last_name}</span>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {candidate.email}
              </div>
            </div>
          </div>
        );
      },
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    },
    
    // Column 2: Position & Experience (25%) - Compact display
    {
      id: 'position_experience',
      accessorKey: 'position',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Poste & Exp.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const lastCompany = getLastCompany(candidate);
        
        return (
          <div className="space-y-1 min-w-0">
            <div className="font-medium text-foreground truncate text-sm" title={candidate.position}>
              {candidate.position || 'Non spécifié'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground truncate">
              <Briefcase className="w-3 h-3 mr-1 flex-shrink-0" />
              <span title={lastCompany} className="truncate">{lastCompany}</span>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              {candidate.years_experience ? `${candidate.years_experience} ans` : '0 an'}
            </div>
          </div>
        );
      },
      accessorFn: (row) => row.position || '',
    },

    // Column 3: Status & Scoring (20%) - Visible status + AI score
    {
      id: 'status_scoring',
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Statut & Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const aiScore = getAIScore(candidate.id!, jobOfferId);
        const displayScore = aiScore.score !== null ? aiScore.score : (candidate.score || 0);
        
        const getScoreColor = (score: number) => {
          if (score >= 80) return 'text-emerald-600';
          if (score >= 60) return 'text-amber-600';
          return 'text-red-600';
        };
        
        return (
          <div className="space-y-2">
            <Badge 
              variant="outline" 
              className={cn("text-xs font-medium border px-2 py-0.5", getStatusBadgeColor(candidate.status))}
            >
              {getStatusLabel(candidate.status)}
            </Badge>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center cursor-help">
                    {aiScore.isLoading ? (
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 animate-pulse text-primary" />
                        <span className="text-xs text-muted-foreground">...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Brain className="w-3 h-3 text-primary" />
                        <span className={cn("text-sm font-bold", getScoreColor(displayScore))}>
                          {aiScore.error ? '?' : displayScore}
                        </span>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">Score IA: {displayScore}/100</p>
                    {jobSpecific && <p className="text-xs text-primary">Spécifique au poste</p>}
                    {aiScore.explanation && <p className="text-xs mt-1 max-w-xs">{aiScore.explanation}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
      accessorFn: (row) => row.status || 'initial',
    },

    // Column 4: Key Skills (20%) - Top 2-3 skills with tooltip
    {
      id: 'key_skills',
      accessorKey: 'skills',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Compétences
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const skills = ensureStringArray(candidate.skills);
        const topSkills = skills.slice(0, 3);
        
        return (
          <div className="space-y-1">
            {topSkills.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1">
                  {topSkills.slice(0, 2).map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
                {skills.length > 2 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className="text-xs px-1.5 py-0.5 cursor-help bg-muted/50 text-muted-foreground border-muted-foreground/30"
                        >
                          +{skills.length - 2} autres
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div>
                          <p className="font-medium mb-1">Toutes les compétences:</p>
                          <p className="text-sm">{skills.join(', ')}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Aucune</span>
            )}
          </div>
        );
      },
      accessorFn: (row) => ensureStringArray(row.skills).join(' '),
    },

    // Column 5: Quick Actions (10%) - Compact actions with location in tooltip
    {
      id: 'quick_actions',
      accessorKey: 'actions',
      header: '',
      cell: ({ row }) => {
        const candidate = row.original;
        const isOwnCandidate = candidate.user_id === currentUserId;
        
        const formatLocation = () => {
          const city = candidate.city || '';
          const country = candidate.country || '';
          
          if (city && country) return `${city}, ${country}`;
          if (city) return city;
          if (country) return country;
          if (candidate.location) return candidate.location;
          return 'Non spécifiée';
        };
        
        return (
          <div className="flex items-center justify-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <MapPin className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{formatLocation()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {isOwnCandidate ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleDeleteCandidate(candidate.id!, candidate, e)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Supprimer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled
                      className="h-6 w-6 p-0 text-muted-foreground"
                    >
                      <Lock className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Protégé</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
      enableSorting: false,
    }
  ], [getAIScore, jobOfferId, jobSpecific, currentUserId, handleDeleteCandidate]);

  const table = useReactTable({
    data: candidates,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border/50 hover:bg-transparent bg-muted/30">
                {headerGroup.headers.map((header, index) => {
                  // Define responsive column widths: 25%, 25%, 20%, 20%, 10%
                  const getColumnWidth = (index: number) => {
                    switch (index) {
                      case 0: return 'w-[25%] min-w-[160px]'; // Candidate
                      case 1: return 'w-[25%] min-w-[160px]'; // Position & Experience  
                      case 2: return 'w-[20%] min-w-[130px]'; // Status & Scoring
                      case 3: return 'w-[20%] min-w-[130px]'; // Key Skills
                      case 4: return 'w-[10%] min-w-[80px]';  // Quick Actions
                      default: return 'w-auto';
                    }
                  };
                  
                  return (
                    <TableHead 
                      key={header.id} 
                      className={`text-foreground font-semibold px-4 py-3 ${getColumnWidth(index)}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer border-border/30 hover:bg-accent/50 transition-colors duration-200"
                  onClick={() => onViewCandidate(row.original.id!)}
                >
                  {row.getVisibleCells().map((cell, index) => {
                    const getColumnWidth = (index: number) => {
                      switch (index) {
                        case 0: return 'w-[25%] min-w-[160px]';
                        case 1: return 'w-[25%] min-w-[160px]';
                        case 2: return 'w-[20%] min-w-[130px]';
                        case 3: return 'w-[20%] min-w-[130px]';
                        case 4: return 'w-[10%] min-w-[80px]';
                        default: return 'w-auto';
                      }
                    };
                    
                    return (
                      <TableCell 
                        key={cell.id} 
                        className={`px-4 py-4 ${getColumnWidth(index)}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Aucun candidat trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OptimizedCandidatesTable;