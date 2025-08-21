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

  const columns: ColumnDef<CandidateData>[] = useMemo(() => [
    // Column 1: Candidate (35%) - Name, email, avatar, phone in tooltip
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
        const skills = ensureStringArray(candidate.skills);
        
        return (
          <div className="flex items-center space-x-3 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 cursor-help",
                    isOwnCandidate ? "bg-gradient-to-br from-primary to-primary/80 shadow-sm" : "bg-muted-foreground/80"
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
                    {skills.length > 0 && (
                      <div className="text-xs">
                        <p className="font-medium mb-1">Compétences :</p>
                        <p className="text-muted-foreground">{skills.slice(0, 5).join(', ')}{skills.length > 5 ? '...' : ''}</p>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground truncate">
                {candidate.first_name} <span className="font-bold">{candidate.last_name}</span>
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {candidate.email}
              </div>
            </div>
          </div>
        );
      },
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    },
    
    // Column 2: Position & Experience (30%) - Role, company, years, location
    {
      id: 'position_experience',
      accessorKey: 'position',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Poste & Expérience
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const lastCompany = getLastCompany(candidate);
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
          <div className="space-y-1 min-w-0">
            <div className="font-medium text-foreground truncate" title={candidate.position}>
              {candidate.position || 'Non spécifié'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground truncate">
              <Briefcase className="w-3 h-3 mr-1 flex-shrink-0" />
              <span title={lastCompany} className="truncate">{lastCompany}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">
                {candidate.years_experience ? `${candidate.years_experience} ans` : '0 an'}
              </span>
              <div className="flex items-center max-w-[100px] truncate">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span title={formatLocation()} className="truncate">{formatLocation()}</span>
              </div>
            </div>
          </div>
        );
      },
      accessorFn: (row) => row.position || '',
    },
    {
      accessorKey: 'ai_score',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          <Brain className="mr-2 h-4 w-4 text-primary" />
          Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const aiScore = getAIScore(candidate.id!, jobOfferId);
        const displayScore = aiScore.score !== null ? aiScore.score : (candidate.score || 0);
        
        const getScoreColor = (score: number) => {
          if (score >= 80) return 'bg-emerald-500 text-white border-emerald-300';
          if (score >= 60) return 'bg-amber-500 text-white border-amber-300';
          return 'bg-red-500 text-white border-red-300';
        };
        
        const getScoreLabel = (score: number) => {
          if (score >= 80) return 'Excellent';
          if (score >= 60) return 'Bon';
          return 'À améliorer';
        };
        
        const getScoreSource = (source?: string) => {
          switch (source) {
            case 'database': return 'Base de données';
            case 'fresh_calculation': return 'Calcul récent';
            case 'cache': return 'Cache';
            default: return 'Score ancien';
          }
        };
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  {aiScore.isLoading ? (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 cursor-help ${getScoreColor(displayScore)}`}>
                      {aiScore.error ? '?' : displayScore}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">Score: {displayScore}/100</p>
                  <p className="text-sm text-muted-foreground">{getScoreLabel(displayScore)}</p>
                  <p className="text-xs text-muted-foreground">{getScoreSource(aiScore.source)}</p>
                  {jobSpecific && <p className="text-xs text-primary">Spécifique au poste</p>}
                  {aiScore.explanation && <p className="text-xs mt-1 max-w-xs">{aiScore.explanation}</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      accessorFn: (row) => {
        const aiScore = getAIScore(row.id!, jobOfferId);
        return aiScore.score !== null ? aiScore.score : (row.score || 0);
      },
    },
    {
      accessorKey: 'actions',
      header: '',
      cell: ({ row }) => {
        const candidate = row.original;
        const isOwnCandidate = candidate.user_id === currentUserId;
        
        return (
          <div className="flex justify-center">
            {isOwnCandidate ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleDeleteCandidate(candidate.id!, candidate, e)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Supprimer le candidat</p>
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
                      className="h-8 w-8 p-0 text-muted-foreground"
                    >
                      <Lock className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Vous ne pouvez pas supprimer ce candidat</p>
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
                  // Define responsive column widths: 35%, 30%, 20%, 15%
                  const getColumnWidth = (index: number) => {
                    switch (index) {
                      case 0: return 'w-[35%] min-w-[200px]'; // Candidate
                      case 1: return 'w-[30%] min-w-[180px]'; // Position & Experience  
                      case 2: return 'w-[20%] min-w-[100px]'; // AI Score
                      case 3: return 'w-[15%] min-w-[80px]';  // Actions
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
                        case 0: return 'w-[35%] min-w-[200px]';
                        case 1: return 'w-[30%] min-w-[180px]';
                        case 2: return 'w-[20%] min-w-[100px]';
                        case 3: return 'w-[15%] min-w-[80px]';
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