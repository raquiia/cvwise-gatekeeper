
import React, { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown, Brain, Sparkles, Briefcase, Target, FileSearch } from 'lucide-react';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';
import { getLastCompany } from '@/utils/companyUtils';

interface ModernTableViewProps {
  candidates: CandidateData[];
  onCandidateSelect: (candidate: CandidateData) => void;
  selectedCandidate?: CandidateData;
  jobOfferId?: string;
}

const ModernTableView: React.FC<ModernTableViewProps> = ({
  candidates,
  onCandidateSelect,
  selectedCandidate,
  jobOfferId
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  const { getAIScore, isJobSpecific } = useAIScoring();
  
  const jobSpecific = isJobSpecific(jobOfferId);
  
  const columns: ColumnDef<CandidateData>[] = useMemo(() => [
    {
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
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {candidate.first_name} {candidate.last_name}
            </span>
            <span className="text-sm text-muted-foreground">{candidate.email}</span>
          </div>
        );
      },
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    },
    {
      accessorKey: 'position',
      header: 'Poste',
      cell: ({ row }) => {
        const candidate = row.original;
        const lastCompany = getLastCompany(candidate);
        
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{candidate.position || 'Non spécifié'}</span>
            <span className="text-sm text-muted-foreground">{lastCompany}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'experience',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          Expérience
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        
        // Format location to show only city and country
        const formatLocation = () => {
          const city = candidate.city || '';
          const country = candidate.country || '';
          
          if (city && country) {
            return `${city}, ${country}`;
          } else if (city) {
            return city;
          } else if (country) {
            return country;
          } else if (candidate.location) {
            // Fallback to original location if structured fields are empty
            return candidate.location;
          }
          return 'Lieu non spécifié';
        };
        
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{candidate.years_experience || 0} ans</span>
            <span className="text-sm text-muted-foreground">{formatLocation()}</span>
          </div>
        );
      },
      accessorFn: (row) => row.years_experience || 0,
    },
    {
      accessorKey: 'skills',
      header: 'Compétences',
      cell: ({ row }) => {
        const skills = ensureStringArray(row.original.skills);
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {skills.slice(0, 2).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-secondary/60 text-secondary-foreground border-secondary/40">
                {skill}
              </Badge>
            ))}
            {skills.length > 2 && (
              <Badge variant="outline" className="text-xs border-border/60 text-muted-foreground">
                +{skills.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'ai_score',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80"
        >
          <Brain className="mr-2 h-4 w-4 text-purple-600" />
          Score IA
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const aiScore = getAIScore(candidate.id!, jobOfferId);
        
        const getScoreColor = (score: number | null) => {
          if (score === null) return 'bg-muted text-muted-foreground border-border';
          if (score >= 85) return 'bg-emerald-500 text-white border-emerald-300';
          if (score >= 70) return 'bg-green-500 text-white border-green-300';
          if (score >= 55) return 'bg-amber-500 text-white border-amber-300';
          if (score >= 40) return 'bg-orange-500 text-white border-orange-300';
          return 'bg-red-500 text-white border-red-300';
        };
        
        const getScoreLabel = (score: number | null) => {
          if (score === null) return 'Non calculé';
          if (jobSpecific) {
            if (score >= 70) return 'Excellent match';
            if (score >= 50) return 'Bon match';
            if (score >= 30) return 'Match partiel';
            return 'Match faible';
          } else {
            if (score >= 85) return 'Excellent';
            if (score >= 70) return 'Très bon';
            if (score >= 55) return 'Bon';
            if (score >= 40) return 'À développer';
            return 'Incomplet';
          }
        };
        
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant={jobSpecific ? "default" : "secondary"} 
                className="text-xs bg-secondary/60 text-secondary-foreground"
              >
                {jobSpecific ? <Briefcase size={8} className="mr-1" /> : <Target size={8} className="mr-1" />}
                {jobSpecific ? 'Match' : 'Profil'}
              </Badge>
              
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${getScoreColor(aiScore.score)}`}>
                {aiScore.isLoading ? (
                  <Sparkles className="w-3 h-3 animate-pulse" />
                ) : aiScore.error ? (
                  '?'
                ) : (
                  aiScore.score !== null ? aiScore.score : <FileSearch className="w-3 h-3" />
                )}
              </div>
            </div>
            
            <div className="text-xs text-center">
              {aiScore.error ? (
                <span className="text-destructive">Erreur</span>
              ) : aiScore.isLoading ? (
                <span className="text-purple-600">Calcul...</span>
              ) : (
                <span className={`font-medium ${
                  aiScore.score !== null && aiScore.score >= 70 ? 'text-green-700 dark:text-green-400' : 
                  aiScore.score !== null && aiScore.score >= 40 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'
                }`}>
                  {getScoreLabel(aiScore.score)}
                </span>
              )}
            </div>
            
            {aiScore.score === null && !aiScore.isLoading && !aiScore.error && (
              <div className="text-xs text-center text-muted-foreground">
                <span>Score calculé</span>
                <br />
                <span>lors de l'analyse CV</span>
              </div>
            )}
          </div>
        );
      },
      accessorFn: (row) => getAIScore(row.id!, jobOfferId).score || 0,
    },
    {
      accessorKey: 'detailed_status',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize border-border/60 text-foreground">
          {row.original.detailed_status || 'Initial'}
        </Badge>
      ),
    }
  ], [getAIScore, jobOfferId, jobSpecific]);

  const table = useReactTable({
    data: candidates,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher des candidats..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(String(event.target.value))}
          className="max-w-sm input-modern"
        />
      </div>
      
      <div className="card-modern overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border/50 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-foreground font-semibold">
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
                  data-state={row.getIsSelected() && "selected"}
                  className={`cursor-pointer border-border/30 hover:bg-accent/50 transition-colors duration-200 ${
                    selectedCandidate?.id === row.original.id ? 'bg-primary/10 border-primary/30' : ''
                  }`}
                  onClick={() => onCandidateSelect(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
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

export default ModernTableView;
