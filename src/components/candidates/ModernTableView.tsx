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
import { Search, ArrowUpDown, Brain, Sparkles, Briefcase, Target } from 'lucide-react';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';

interface ModernTableViewProps {
  candidates: CandidateData[];
  onCandidateSelect: (candidate: CandidateData) => void;
  selectedCandidate?: CandidateData;
}

const ModernTableView: React.FC<ModernTableViewProps> = ({
  candidates,
  onCandidateSelect,
  selectedCandidate
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  const { calculateAIScore, getAIScore, isJobSpecific } = useAIScoring();
  
  const columns: ColumnDef<CandidateData>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Candidat
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {candidate.first_name} {candidate.last_name}
            </span>
            <span className="text-sm text-gray-500">{candidate.email}</span>
          </div>
        );
      },
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    },
    {
      accessorKey: 'position',
      header: 'Poste',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.position || 'Non spécifié'}</span>
          <span className="text-sm text-gray-500">{row.original.company || ''}</span>
        </div>
      ),
    },
    {
      accessorKey: 'experience',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
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
            <span className="font-medium">{candidate.years_experience || 0} ans</span>
            <span className="text-sm text-gray-500">{formatLocation()}</span>
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
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 2 && (
              <Badge variant="outline" className="text-xs">
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
          className="h-auto p-0 font-semibold"
        >
          <Brain className="mr-2 h-4 w-4 text-purple-600" />
          Score IA
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const aiScore = getAIScore(candidate.id!);
        
        const getScoreColor = (score: number | null) => {
          if (score === null) return 'bg-gray-100 text-gray-600 border-gray-200';
          if (score >= 85) return 'bg-emerald-500 text-white border-emerald-300';
          if (score >= 70) return 'bg-green-500 text-white border-green-300';
          if (score >= 55) return 'bg-amber-500 text-white border-amber-300';
          if (score >= 40) return 'bg-orange-500 text-white border-orange-300';
          return 'bg-red-500 text-white border-red-300';
        };
        
        const getScoreLabel = (score: number | null) => {
          if (score === null) return 'Non calculé';
          if (isJobSpecific) {
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
                variant={isJobSpecific ? "default" : "secondary"} 
                className="text-xs"
              >
                {isJobSpecific ? <Briefcase size={8} className="mr-1" /> : <Target size={8} className="mr-1" />}
                {isJobSpecific ? 'Match' : 'Profil'}
              </Badge>
              
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${getScoreColor(aiScore.score)}`}>
                {aiScore.isLoading ? (
                  <Sparkles className="w-3 h-3 animate-pulse" />
                ) : aiScore.error ? (
                  '?'
                ) : (
                  aiScore.score !== null ? aiScore.score : '?'
                )}
              </div>
            </div>
            
            <div className="text-xs text-center">
              {aiScore.error ? (
                <span className="text-red-600">Erreur</span>
              ) : aiScore.isLoading ? (
                <span className="text-purple-600">Calcul...</span>
              ) : (
                <span className={`font-medium ${
                  aiScore.score !== null && aiScore.score >= 70 ? 'text-green-700' : 
                  aiScore.score !== null && aiScore.score >= 40 ? 'text-amber-700' : 'text-gray-600'
                }`}>
                  {getScoreLabel(aiScore.score)}
                </span>
              )}
            </div>
            
            {aiScore.score === null && !aiScore.isLoading && !aiScore.error && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  calculateAIScore(candidate.id!);
                }}
                className="text-xs h-6 px-2"
              >
                <Sparkles size={10} className="mr-1" />
                Calculer
              </Button>
            )}
          </div>
        );
      },
      accessorFn: (row) => getAIScore(row.id!).score || 0,
    },
    {
      accessorKey: 'detailed_status',
      header: 'Statut',
      cell: ({ row }) => {
        const getStatusColor = (status: string) => {
          switch (status?.toLowerCase()) {
            case 'qualification': return 'bg-blue-100 text-blue-800';
            case 'contact': return 'bg-yellow-100 text-yellow-800';
            case 'entretien': return 'bg-purple-100 text-purple-800';
            case 'shortlist': return 'bg-green-100 text-green-800';
            case 'refusé': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
          }
        };
        
        return (
          <Badge className={getStatusColor(row.original.detailed_status || 'qualification')}>
            {row.original.detailed_status || 'Qualification'}
          </Badge>
        );
      },
    }
  ], [getAIScore, calculateAIScore, isJobSpecific]);
  
  const table = useReactTable({
    data: candidates,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher un candidat..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Brain className="w-4 h-4 text-purple-600" />
          <span>Scores calculés par IA</span>
          <Badge variant="outline" className="text-xs">
            {isJobSpecific ? 'Mode Correspondance' : 'Mode Complétude'}
          </Badge>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-3">
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
                  data-state={selectedCandidate?.id === row.original.id ? "selected" : undefined}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onCandidateSelect(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Aucun candidat trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {table.getFilteredRowModel().rows.length} candidat(s) trouvé(s)
        </span>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Système de scoring intelligent avec OpenAI</span>
        </div>
      </div>
    </div>
  );
};

export default ModernTableView;
