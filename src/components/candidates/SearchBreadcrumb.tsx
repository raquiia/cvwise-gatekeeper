
import React from 'react';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface SearchBreadcrumbProps {
  semanticSearch: string;
  selectedStatus: string | null;
  onClearFilters: () => void;
  resultsCount: number;
}

const SearchBreadcrumb: React.FC<SearchBreadcrumbProps> = ({
  semanticSearch,
  selectedStatus,
  onClearFilters,
  resultsCount
}) => {
  if (!semanticSearch.trim() && !selectedStatus) {
    return null;
  }

  return (
    <div className="bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Recherche active :</span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {semanticSearch.trim() && (
              <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                <Search className="w-3 h-3" />
                "{semanticSearch}"
              </div>
            )}
            
            {selectedStatus && (
              <div className="bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                <Filter className="w-3 h-3" />
                {selectedStatus}
              </div>
            )}
            
            <span className="text-sm text-muted-foreground">
              {resultsCount} résultat{resultsCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        >
          <X className="w-4 h-4 mr-1" />
          Effacer
        </Button>
      </div>
    </div>
  );
};

export default SearchBreadcrumb;
