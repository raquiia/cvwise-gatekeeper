
import React from 'react';
import { Calendar, ChevronDown, CheckSquare, Building, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface ResumesFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string | null;
  setSelectedStatus: (status: string | null) => void;
  resumesCount: number;
  onEnableSelection: () => void;
  selectionMode: boolean;
  companyFilter?: string;
  setCompanyFilter?: (company: string) => void;
  semanticSearchQuery?: string;
  setSemanticSearchQuery?: (query: string) => void;
}

const ResumesFilters: React.FC<ResumesFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  resumesCount,
  onEnableSelection,
  selectionMode,
  companyFilter = '',
  setCompanyFilter = () => {},
  semanticSearchQuery = '',
  setSemanticSearchQuery = () => {}
}) => {
  const handleReset = () => {
    setSearchQuery('');
    setSelectedStatus(null);
    if (setCompanyFilter) setCompanyFilter('');
    if (setSemanticSearchQuery) setSemanticSearchQuery('');
  };

  return (
    <div className="glass-card rounded-lg p-3 mb-6 flex flex-wrap items-center gap-3">
      <div className="flex items-center">
        <span className="text-sm font-medium text-foreground mr-2">Filtres:</span>
      </div>
      
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1 text-sm border-border hover:bg-accent">
              <Calendar size={16} className="mr-1" />
              <span>Date</span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-card border-border">
            <DropdownMenuItem className="hover:bg-accent">Aujourd'hui</DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-accent">Cette semaine</DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-accent">Ce mois-ci</DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-accent">Tous</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1 text-sm border-border hover:bg-accent">
              <span>Statut</span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-card border-border">
            <DropdownMenuItem onClick={() => setSelectedStatus(null)} className="hover:bg-accent">
              Tous
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedStatus('analyzed')} className="hover:bg-accent">
              Analysés
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedStatus('pending')} className="hover:bg-accent">
              En attente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {setCompanyFilter && (
        <div className="flex-1 min-w-[200px] max-w-xs">
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Filtrer par entreprise..."
              className="h-9 pl-10 input-modern"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            />
          </div>
        </div>
      )}
      
      {setSemanticSearchQuery && (
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Recherche sémantique (ex: chef de projet ferroviaire)..."
              className="h-9 pl-10 input-modern"
              value={semanticSearchQuery}
              onChange={(e) => setSemanticSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}
      
      <div className="ml-auto flex gap-2">
        {!selectionMode && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 text-foreground border-border hover:bg-accent"
            onClick={onEnableSelection}
            disabled={resumesCount === 0}
          >
            <CheckSquare size={16} className="mr-2" />
            Sélectionner
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 text-muted-foreground hover:bg-accent"
          onClick={handleReset}
        >
          Réinitialiser
        </Button>
      </div>
    </div>
  );
};

export default ResumesFilters;
