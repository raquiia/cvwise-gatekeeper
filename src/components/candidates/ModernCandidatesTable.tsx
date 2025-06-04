
import React, { useState, useEffect } from 'react';
import { ArrowUpDown, SlidersHorizontal, ChevronDown, Grid, List, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CandidateData } from '@/services/data/candidateService';
import CandidateCard from './CandidateCard';
import { useToast } from '@/hooks/use-toast';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { cn } from '@/lib/utils';
import { useAIScoring } from '@/hooks/use-ai-scoring';

interface ModernCandidatesTableProps {
  candidates: CandidateData[];
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'date' | 'score' | 'status';
type DensityOption = 'comfortable' | 'compact';

const ModernCandidatesTable: React.FC<ModernCandidatesTableProps> = ({
  candidates,
  selectedStatus,
  onStatusChange,
  onViewCandidate,
  onCandidateDeleted
}) => {
  const { toast } = useToast();
  const { getAIScore, preloadScoresFromDatabase } = useAIScoring();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [density, setDensity] = useState<DensityOption>('comfortable');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [sortedCandidates, setSortedCandidates] = useState<CandidateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Précharger les scores AI au chargement
  useEffect(() => {
    const candidateIds = candidates.map(c => c.id!).filter(Boolean);
    if (candidateIds.length > 0) {
      console.log('Preloading AI scores for modern candidates table');
      preloadScoresFromDatabase(candidateIds);
    }
  }, [candidates, preloadScoresFromDatabase]);

  // Sort candidates avec scores AI
  useEffect(() => {
    if (!candidates || candidates.length === 0) {
      setSortedCandidates([]);
      return;
    }

    const sorted = [...candidates].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'date':
          return new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime();
        case 'score':
          // Utiliser les scores AI si disponibles, sinon fallback sur l'ancien score
          const scoreA = getAIScore(a.id!).score ?? a.score ?? 0;
          const scoreB = getAIScore(b.id!).score ?? b.score ?? 0;
          return scoreB - scoreA;
        case 'status':
          return (a.detailed_status || 'initial').localeCompare(b.detailed_status || 'initial');
        default:
          return 0;
      }
    });

    setSortedCandidates(sorted);
  }, [candidates, sortBy, getAIScore]);

  const handleCandidateDeleted = () => {
    toast({
      title: "Candidat supprimé",
      description: "Le candidat a été supprimé avec succès",
    });
    
    if (onCandidateDeleted) {
      onCandidateDeleted();
    }
  };

  const handleSelectCandidate = (candidateId: string, selected: boolean) => {
    const newSelected = new Set(selectedCandidates);
    if (selected) {
      newSelected.add(candidateId);
    } else {
      newSelected.delete(candidateId);
    }
    setSelectedCandidates(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCandidates.size === sortedCandidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(sortedCandidates.map(c => c.id!).filter(Boolean)));
    }
  };

  const candidatesCount = sortedCandidates.length;
  const selectedCount = selectedCandidates.size;

  const getGridColumns = () => {
    if (density === 'compact') {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
    }
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  return (
    <div className="animate-fade-in transition-all">
      {/* Enhanced Header */}
      <Card className="mb-6 overflow-hidden border border-purple-200/30 dark:border-purple-900/20 shadow-xl bg-white/50 dark:bg-navy-dark/30 backdrop-blur-sm">
        <div className="p-4 bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-navy-dark/90 dark:to-purple-950/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left side - Stats and filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-navy-dark dark:text-sand">
                  {candidatesCount} candidat{candidatesCount > 1 ? 's' : ''}
                </span>
                
                {selectedCount > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-sm text-purple-600 font-medium">
                      {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
                    </span>
                  </>
                )}

                <Separator orientation="vertical" className="h-4" />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-purple-700 dark:hover:text-purple-300">
                      <Filter size={14} />
                      <span>Statut</span>
                      <ChevronDown size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-purple-100/50 shadow-lg dark:bg-navy-dark/95 dark:border-purple-800/30">
                    <DropdownMenuItem onClick={() => onStatusChange(null)}>
                      Tous
                    </DropdownMenuItem>
                    {Object.entries(CANDIDATE_STATUS_LABELS).map(([value, label]) => (
                      <DropdownMenuItem 
                        key={value} 
                        onClick={() => onStatusChange(value)}
                        className={selectedStatus === value ? "bg-purple-50 dark:bg-purple-900/20" : ""}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Right side - View controls */}
            <div className="flex items-center gap-2">
              {/* Select all checkbox */}
              <div className="flex items-center gap-2 mr-4">
                <input
                  type="checkbox"
                  checked={selectedCount === candidatesCount && candidatesCount > 0}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = selectedCount > 0 && selectedCount < candidatesCount;
                    }
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500/25"
                />
                <span className="text-sm text-muted-foreground">Tout sélectionner</span>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center bg-white/50 dark:bg-navy-dark/50 rounded-lg p-1 border border-purple-200/30">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "h-8 w-8 p-0",
                    viewMode === 'grid' && "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  <Grid size={14} />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "h-8 w-8 p-0",
                    viewMode === 'list' && "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  <List size={14} />
                </Button>
              </div>

              {/* Sort dropdown avec indication que le score utilisé est AI */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    <ArrowUpDown size={14} className="mr-1" />
                    Trier
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-purple-100/50 shadow-lg dark:bg-navy-dark/95 dark:border-purple-800/30">
                  <DropdownMenuItem 
                    onClick={() => setSortBy('name')} 
                    className={sortBy === 'name' ? "bg-purple-50 dark:bg-purple-900/20" : ""}
                  >
                    Par nom
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('date')} 
                    className={sortBy === 'date' ? "bg-purple-50 dark:bg-purple-900/20" : ""}
                  >
                    Par date
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('score')} 
                    className={sortBy === 'score' ? "bg-purple-50 dark:bg-purple-900/20" : ""}
                  >
                    Par score IA
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('status')} 
                    className={sortBy === 'status' ? "bg-purple-50 dark:bg-purple-900/20" : ""}
                  >
                    Par statut
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Density toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    <SlidersHorizontal size={14} className="mr-1" />
                    Densité
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-purple-100/50 shadow-lg dark:bg-navy-dark/95 dark:border-purple-800/30">
                  <DropdownMenuItem 
                    onClick={() => setDensity('comfortable')} 
                    className={density === 'comfortable' ? "bg-purple-50 dark:bg-purple-900/20" : ""}
                  >
                    Confortable
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setDensity('compact')} 
                    className={density === 'compact' ? "bg-purple-50 dark:bg-purple-900/20" : ""}
                  >
                    Compact
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>

      {/* Main content */}
      <div className="relative">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="ml-4 text-purple-700 dark:text-purple-300 font-medium">Chargement des candidats...</p>
          </div>
        ) : sortedCandidates.length === 0 ? (
          <Card className="p-12 text-center border border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm">
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
          </Card>
        ) : (
          <div 
            className={cn(
              "grid gap-4 transition-all duration-300",
              viewMode === 'grid' ? getGridColumns() : 'grid-cols-1',
              density === 'compact' && 'gap-3'
            )}
          >
            {sortedCandidates.map((candidate, index) => (
              <div
                key={candidate.id || `temp-${Math.random()}`}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CandidateCard
                  candidate={candidate}
                  onViewCandidate={onViewCandidate}
                  onCandidateDeleted={handleCandidateDeleted}
                  isSelected={selectedCandidates.has(candidate.id!)}
                  onSelect={handleSelectCandidate}
                  index={index}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selection actions bar */}
      {selectedCount > 0 && (
        <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md border-purple-200/50 shadow-2xl">
          <div className="p-4 flex items-center gap-4">
            <span className="text-sm font-medium text-navy-dark">
              {selectedCount} candidat{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                Exporter
              </Button>
              <Button size="sm" variant="outline">
                Modifier le statut
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-800">
                Supprimer
              </Button>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setSelectedCandidates(new Set())}
            >
              Annuler
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ModernCandidatesTable;
