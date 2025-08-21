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
import { ArrowUpDown, Brain, Sparkles, Trash2, Lock, MapPin, Briefcase, Phone, Mail, Star, Calendar, User, DollarSign } from 'lucide-react';
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

  // Optimized function for responsive column widths
  const getColumnWidth = useMemo(() => (index: number) => {
    switch (index) {
      case 0: return 'w-[30%] min-w-[280px]'; // Candidat 
      case 1: return 'w-[35%] min-w-[240px]'; // Position & Performance 
      case 2: return 'w-[15%] min-w-[120px]'; // Statut & Disponibilité 
      case 3: return 'w-[10%] min-w-[90px]'; // Prétentions
      case 4: return 'w-[10%] min-w-[100px]'; // Actions
      default: return 'w-auto';
    }
  }, []);

  // Improved availability status logic
  const getAvailabilityStatus = (candidate: CandidateData) => {
    // Priority 1: Explicit availability info
    if (candidate.availability) {
      return {
        status: candidate.availability,
        type: 'confirmed',
        color: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 border-blue-300',
        icon: Calendar
      };
    }

    // Priority 2: Check employment status from experiences (sorted by most recent)
    const experiences = ensureArray(candidate.experiences);
    if (experiences.length > 0) {
      // Sort experiences by end date to find the most recent
      const sortedExperiences = [...experiences].sort((a: any, b: any) => {
        const endDateA = a.end_date || a.endDate;
        const endDateB = b.end_date || b.endDate;
        
        // Current positions (no end date) come first
        if (!endDateA && endDateB) return -1;
        if (endDateA && !endDateB) return 1;
        if (!endDateA && !endDateB) return 0;
        
        // Compare actual dates
        return new Date(endDateB).getTime() - new Date(endDateA).getTime();
      });

      const mostRecentExperience = sortedExperiences[0];
      if (mostRecentExperience && typeof mostRecentExperience === 'object') {
        const endDate = (mostRecentExperience as any).end_date || (mostRecentExperience as any).endDate;
        
        if (!endDate || endDate === 'Présent' || endDate === 'Present' || endDate === 'En cours') {
          return {
            status: 'Sous préavis',
            type: 'estimated',
            color: 'bg-gradient-to-r from-amber-400/20 to-orange-400/20 text-amber-700 border-amber-300',
            icon: Briefcase
          };
        } else {
          return {
            status: 'Immédiate',
            type: 'calculated', 
            color: 'bg-gradient-to-r from-emerald-400/20 to-green-400/20 text-emerald-700 border-emerald-300',
            icon: Star
          };
        }
      }
    }

    return {
      status: 'Non définie',
      type: 'unknown',
      color: 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 text-gray-600 border-gray-300',
      icon: User
    };
  };


  const getStatusConfig = (status: string | undefined | null) => {
    const normalizedStatus = status?.toLowerCase().trim();
    switch (normalizedStatus) {
      case 'en mission':
      case 'en_mission':
        return {
          label: 'En Mission',
          color: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200'
        };
      case 'en cours':
      case 'en_cours':
        return {
          label: 'En Cours',
          color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'refusé':
      case 'refuse':
        return {
          label: 'Refusé',
          color: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'nouveau':
      case 'initial':
        return {
          label: 'Nouveau',
          color: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white',
          textColor: 'text-purple-700',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      default:
        return {
          label: 'Initial',
          color: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getScoreConfig = (score: number) => {
    if (score >= 85) return {
      color: 'from-emerald-400 to-green-400',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-100'
    };
    if (score >= 70) return {
      color: 'from-blue-400 to-cyan-400',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-100'
    };
    if (score >= 50) return {
      color: 'from-amber-400 to-orange-400',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-100'
    };
    return {
      color: 'from-red-400 to-pink-400',
      textColor: 'text-red-700',
      bgColor: 'bg-red-100'
    };
  };

  const columns: ColumnDef<CandidateData>[] = useMemo(() => [
    // Column 1: Candidat (35%) - Avatar + Nom + Email + Téléphone
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
          <div className="flex items-center space-x-3 min-w-0 py-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 cursor-help shadow-md transition-transform hover:scale-105",
                    isOwnCandidate 
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500 ring-2 ring-blue-300 ring-offset-2" 
                      : "bg-gradient-to-br from-gray-500 to-gray-600"
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
              <div className="font-semibold text-base text-foreground truncate">
                {candidate.first_name} {candidate.last_name}
              </div>
              
              {candidate.email && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a 
                        href={`mailto:${candidate.email}`}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors group"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="w-3 h-3 mr-1.5 flex-shrink-0 group-hover:text-blue-700" />
                        <span className="truncate">{candidate.email}</span>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Envoyer un email à {candidate.first_name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {candidate.phone && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a 
                        href={`tel:${candidate.phone}`}
                        className="flex items-center text-sm text-green-600 hover:text-green-700 transition-colors group"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-3 h-3 mr-1.5 flex-shrink-0 group-hover:text-green-700" />
                        <span className="truncate">{candidate.phone}</span>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Appeler {candidate.first_name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 mr-1.5 flex-shrink-0" />
                <span className="truncate" title={(() => {
                  const city = candidate.city || '';
                  const country = candidate.country || '';
                  if (city && country) return `${city}, ${country}`;
                  if (city) return city;
                  if (country) return country;
                  if (candidate.location) return candidate.location;
                  return 'Non spécifiée';
                })()}>
                  {(() => {
                    const city = candidate.city || '';
                    const country = candidate.country || '';
                    if (city && country) return `${city}, ${country}`;
                    if (city) return city;
                    if (country) return country;
                    if (candidate.location) return candidate.location;
                    return 'Non spécifiée';
                  })()}
                </span>
              </div>
            </div>
          </div>
        );
      },
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    },
    
    // Column 2: Position & Performance (40%) - Titre + Entreprise + Expérience + Score IA
    {
      id: 'position_performance',
      accessorKey: 'position',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Position & Performance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const currentCompany = getLastCompany(candidate);
        const aiScore = getAIScore(candidate.id!, jobOfferId);
        const displayScore = aiScore.score !== null ? aiScore.score : (candidate.score || 0);
        const scoreConfig = getScoreConfig(displayScore);
        
        return (
          <div className="space-y-1.5 min-w-0">
            <div className="font-semibold text-sm text-foreground line-clamp-2 leading-tight" title={candidate.position}>
              {candidate.position || 'Non spécifié'}
            </div>
            
            <div className="flex items-center text-xs text-muted-foreground">
              <Briefcase className="w-3 h-3 mr-1.5 flex-shrink-0" />
              <span title={currentCompany} className="truncate">{currentCompany}</span>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {candidate.years_experience ? `${candidate.years_experience}a` : 'N/A'}
              </Badge>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      {aiScore.isLoading ? (
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                          <span className="text-xs text-muted-foreground">...</span>
                        </div>
                      ) : (
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r text-white text-xs font-bold shadow-sm transition-all hover:shadow-md",
                          scoreConfig.color
                        )}>
                          {aiScore.error ? '?' : displayScore}
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
          </div>
        );
      },
      accessorFn: (row) => row.position || '',
    },

    // Column 3: Statut & Disponibilité (15%) - Statut coloré + Disponibilité
    {
      id: 'status_availability',
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Statut & Dispo.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const statusConfig = getStatusConfig(candidate.status);
        const availability = getAvailabilityStatus(candidate);
        const AvailabilityIcon = availability.icon;
        
        return (
          <div className="space-y-1.5 min-w-0">
            <Badge 
              className={cn(
                "px-2 py-0.5 text-xs font-medium border-0 shadow-sm transition-all hover:shadow-md",
                statusConfig.color
              )}
            >
              {statusConfig.label}
            </Badge>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium cursor-help transition-all",
                    availability.color
                  )}>
                    <AvailabilityIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="line-clamp-2 leading-tight">{availability.status}</span>
                  </div>
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
          </div>
        );
      },
      accessorFn: (row) => row.status || '',
    },

    // Column 4: Prétentions (10%) - Prétentions salariales
    {
      id: 'salary_expectations',
      accessorKey: 'salary_expectations',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          <DollarSign className="w-4 h-4 mr-1" />
          Prétentions
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const salary = candidate.salary_expectations;
        
        return (
          <div className="min-w-0">
            {salary ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium cursor-help bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200">
                      <DollarSign className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-2 leading-tight">{salary}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Prétentions salariales</p>
                    <p className="text-sm">{salary}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground bg-gray-50 border border-gray-200">
                <DollarSign className="w-3 h-3 flex-shrink-0" />
                <span>Non renseigné</span>
              </div>
            )}
          </div>
        );
      },
      accessorFn: (row) => row.salary_expectations || '',
    },

    // Column 5: Actions (10%) - Actions uniquement
    {
      id: 'actions',
      accessorKey: 'actions',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Actions
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const isOwnCandidate = candidate.user_id === currentUserId;
        
        return (
          <div className="flex items-center justify-center">
            {isOwnCandidate ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleDeleteCandidate(candidate.id!, candidate, e)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
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
                    <div className="h-8 w-8 flex items-center justify-center text-muted-foreground/50 cursor-help">
                      <Lock className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Candidat d'un autre utilisateur</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
      accessorFn: (row) => '',
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
                 {headerGroup.headers.map((header, index) => (
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
                 ))}
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
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell 
                      key={cell.id} 
                      className={`px-4 py-3 ${getColumnWidth(index)}`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
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