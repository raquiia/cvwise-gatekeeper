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
import { ensureStringArray, ensureArray } from '@/utils/candidateUtils';
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

  // Helper function to determine availability status
  const getAvailabilityStatus = (candidate: CandidateData) => {
    // Check if candidate has availability info from notes or profile
    if (candidate.availability) {
      return {
        status: candidate.availability,
        type: 'confirmed',
        color: 'bg-blue-500/10 text-blue-600 border-blue-200'
      };
    }

    // Check if candidate is currently employed by looking at last experience
    const experiences = ensureArray(candidate.experiences);
    const lastExperience = experiences[0]; // Most recent experience should be first
    
    if (lastExperience && typeof lastExperience === 'object') {
      const endDate = (lastExperience as any).end_date || (lastExperience as any).endDate;
      
      if (!endDate || endDate === 'Présent' || endDate === 'Present' || endDate === 'En cours') {
        return {
          status: 'Sous préavis',
          type: 'estimated',
          color: 'bg-amber-500/10 text-amber-600 border-amber-200'
        };
      } else {
        return {
          status: 'Immédiate',
          type: 'calculated',
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
        };
      }
    }

    return {
      status: 'Non définie',
      type: 'unknown',
      color: 'bg-muted text-muted-foreground border-border'
    };
  };

  const getCurrentCompany = (candidate: CandidateData) => {
    // First check if there's a company field
    if (candidate.company) return candidate.company;

    // Then check experiences for most recent company
    const experiences = ensureArray(candidate.experiences);
    const lastExperience = experiences[0];
    
    if (lastExperience && typeof lastExperience === 'object') {
      const company = (lastExperience as any).company || (lastExperience as any).employer;
      if (company) return company;
    }

    return 'Non spécifiée';
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
    // Column 1: Candidat (30%) - Nom + Email + Avatar
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
          <div className="flex items-center space-x-3 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 cursor-help",
                    isOwnCandidate ? "bg-gradient-to-br from-primary to-primary/80 shadow-sm" : "bg-muted-foreground/70"
                  )}>
                    {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="font-medium">{isOwnCandidate ? "Votre candidat" : `Candidat de ${ownerName || 'Autre'}`}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="min-w-0 flex-1 space-y-1">
              <div className="font-semibold text-foreground truncate">
                {candidate.first_name} <span className="font-bold">{candidate.last_name}</span>
              </div>
              {candidate.email && (
                <a 
                  href={`mailto:${candidate.email}`}
                  className="block text-sm text-muted-foreground hover:text-primary truncate transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {candidate.email}
                </a>
              )}
            </div>
          </div>
        );
      },
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    },
    
    // Column 2: Contact & Expérience (25%) - Téléphone + Expérience + Titre
    {
      id: 'contact_experience',
      accessorKey: 'phone',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Contact & Expérience
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        
        return (
          <div className="space-y-1 min-w-0">
            {candidate.phone && (
              <a 
                href={`tel:${candidate.phone}`}
                className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors group"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="w-3 h-3 mr-2 flex-shrink-0 group-hover:text-primary" />
                <span className="truncate">{candidate.phone}</span>
              </a>
            )}
            <div className="flex items-center text-xs">
              <Badge variant="secondary" className="text-xs font-medium">
                {candidate.years_experience ? `${candidate.years_experience} ans` : 'N/A'}
              </Badge>
            </div>
            <div className="text-sm font-medium text-foreground truncate" title={candidate.position}>
              {candidate.position || 'Non spécifié'}
            </div>
          </div>
        );
      },
      accessorFn: (row) => row.phone || '',
    },

    // Column 3: Entreprise & Statut (20%) - Entreprise actuelle + Statut
    {
      id: 'company_status',
      accessorKey: 'company',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Entreprise & Statut
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const currentCompany = getCurrentCompany(candidate);
        
        return (
          <div className="space-y-2 min-w-0">
            <div className="flex items-center text-sm text-muted-foreground truncate">
              <Briefcase className="w-3 h-3 mr-2 flex-shrink-0" />
              <span title={currentCompany} className="truncate">{currentCompany}</span>
            </div>
            <Badge 
              variant="outline" 
              className={cn("text-xs font-medium border px-2 py-0.5", getStatusBadgeColor(candidate.status))}
            >
              {getStatusLabel(candidate.status)}
            </Badge>
          </div>
        );
      },
      accessorFn: (row) => getCurrentCompany(row),
    },

    // Column 4: Disponibilité & Score (15%) - Disponibilité + Score IA
    {
      id: 'availability_score',
      accessorKey: 'availability',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Dispo. & Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const availability = getAvailabilityStatus(candidate);
        const aiScore = getAIScore(candidate.id!, jobOfferId);
        const displayScore = aiScore.score !== null ? aiScore.score : (candidate.score || 0);
        
        const getScoreColor = (score: number) => {
          if (score >= 80) return 'text-emerald-600';
          if (score >= 60) return 'text-amber-600';
          return 'text-red-600';
        };
        
        return (
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs font-medium border px-2 py-0.5 cursor-help", availability.color)}
                  >
                    {availability.status}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-medium">Disponibilité: {availability.status}</p>
                    <p className="text-muted-foreground text-xs">
                      {availability.type === 'confirmed' && 'Confirmée par le candidat'}
                      {availability.type === 'estimated' && 'Estimée - encore en poste'}
                      {availability.type === 'calculated' && 'Calculée - poste terminé'}
                      {availability.type === 'unknown' && 'Information manquante'}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-start cursor-help">
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
      accessorFn: (row) => {
        const availability = getAvailabilityStatus(row);
        return availability.status;
      },
    },

    // Column 5: Localisation & Actions (10%) - Lieu + Actions
    {
      id: 'location_actions',
      accessorKey: 'location',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Lieu & Actions
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
          return 'N/A';
        };
        
        return (
          <div className="space-y-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate" title={formatLocation()}>
                {formatLocation()}
              </span>
            </div>

            <div className="flex items-center justify-start">
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
                      <p>Supprimer le candidat</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-6 w-6 flex items-center justify-center text-muted-foreground/50 cursor-help">
                        <Lock className="h-3 w-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Candidat d'un autre utilisateur</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        );
      },
      accessorFn: (row) => {
        const city = row.city || '';
        const country = row.country || '';
        if (city && country) return `${city}, ${country}`;
        if (city) return city;
        if (country) return country;
        if (row.location) return row.location;
        return '';
      },
    },
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
                  // Define responsive column widths: 30%, 25%, 20%, 15%, 10%
                  const getColumnWidth = (index: number) => {
                    switch (index) {
                      case 0: return 'w-[30%] min-w-[200px]'; // Candidat
                      case 1: return 'w-[25%] min-w-[180px]'; // Contact & Expérience  
                      case 2: return 'w-[20%] min-w-[160px]'; // Entreprise & Statut
                      case 3: return 'w-[15%] min-w-[120px]'; // Disponibilité & Score
                      case 4: return 'w-[10%] min-w-[100px]'; // Localisation & Actions
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
                         case 0: return 'w-[30%] min-w-[200px]'; // Candidat
                         case 1: return 'w-[25%] min-w-[180px]'; // Contact & Expérience
                         case 2: return 'w-[20%] min-w-[160px]'; // Entreprise & Statut
                         case 3: return 'w-[15%] min-w-[120px]'; // Disponibilité & Score
                         case 4: return 'w-[10%] min-w-[100px]'; // Localisation & Actions
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