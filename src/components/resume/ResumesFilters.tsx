
import React from 'react';
import { Calendar, ChevronDown, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ResumesFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string | null;
  setSelectedStatus: (status: string | null) => void;
  resumesCount: number;
  onEnableSelection: () => void;
  selectionMode: boolean;
}

const ResumesFilters: React.FC<ResumesFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  resumesCount,
  onEnableSelection,
  selectionMode
}) => {
  const handleReset = () => {
    setSearchQuery('');
    setSelectedStatus(null);
  };

  return (
    <div className="glass rounded-lg p-3 mb-6 flex flex-wrap items-center gap-3">
      <div className="flex items-center">
        <span className="text-sm font-medium text-navy-dark mr-2">Filtres:</span>
      </div>
      
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1 text-sm">
              <Calendar size={16} className="mr-1" />
              <span>Date</span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Aujourd'hui</DropdownMenuItem>
            <DropdownMenuItem>Cette semaine</DropdownMenuItem>
            <DropdownMenuItem>Ce mois-ci</DropdownMenuItem>
            <DropdownMenuItem>Tous</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1 text-sm">
              <span>Statut</span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
              Tous
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedStatus('analyzed')}>
              Analysés
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedStatus('pending')}>
              En attente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="ml-auto flex gap-2">
        {!selectionMode && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 text-navy-dark"
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
          className="h-9 text-muted-foreground"
          onClick={handleReset}
        >
          Réinitialiser
        </Button>
      </div>
    </div>
  );
};

export default ResumesFilters;
