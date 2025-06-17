
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Upload, Filter, Search, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ResumesHeaderProps {
  totalResumes: number;
  onFilterToggle: () => void;
  showFilters: boolean;
  onSearch?: (query: string) => void;
}

const ResumesHeader: React.FC<ResumesHeaderProps> = ({
  totalResumes,
  onFilterToggle,
  showFilters,
  onSearch
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="relative mb-6">
      {/* Modern Header Card */}
      <div className="bg-card/70 dark:bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl p-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          {/* Left: Title & Stats */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestion des CV
                </h1>
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                  {totalResumes} document{totalResumes !== 1 ? 's' : ''} analysé{totalResumes !== 1 ? 's' : ''} par l'IA
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={onFilterToggle}
              className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-border/50 hover:bg-accent/80 transition-all duration-200"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
            
            <Link to="/resumes/upload">
              <Button 
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importer CV
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Section */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher dans les CV... (nom, compétences, entreprise)"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl shadow-xl p-2 z-50">
              <div className="text-sm text-muted-foreground p-2">
                Recherche en cours pour "{searchQuery}"...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumesHeader;
