
import React from 'react';
import { Search, Filter, MoreHorizontal, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface CandidatesHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleFilters: () => void;
}

const CandidatesHeader: React.FC<CandidatesHeaderProps> = ({ 
  searchQuery, 
  onSearchChange,
  onToggleFilters
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
      <div className="mb-4 md:mb-0">
        <h1 className="text-2xl font-bold text-navy-dark mb-1">Candidats</h1>
        <p className="text-muted-foreground">
          Gérez et analysez votre vivier de talents
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Rechercher un candidat..."
            className="input-field pl-10 w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none"
            onClick={onToggleFilters}
          >
            <Filter size={18} className="mr-2" />
            Filtres
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download size={16} className="mr-2" />
                Exporter
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload size={16} className="mr-2" />
                Importer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default CandidatesHeader;
