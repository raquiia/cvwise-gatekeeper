
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Search, FileText, UserPlus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CandidatesHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleFilters: () => void;
  showFilters: boolean;
}

const CandidatesHeader: React.FC<CandidatesHeaderProps> = ({ 
  searchQuery, 
  onSearchChange,
  onToggleFilters,
  showFilters
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
      <div className="mb-4 md:mb-0">
        <h1 className="text-2xl font-bold text-navy-dark dark:text-sand mb-1 bg-gradient-to-r from-purple-700 to-indigo-600 dark:from-purple-400 dark:to-indigo-300 bg-clip-text text-transparent">Candidats</h1>
        <p className="text-muted-foreground">
          Gérez les profils des candidats issus de vos CV
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
        <div className="relative w-full md:w-72 mb-4 md:mb-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Rechercher un candidat..."
            className="pl-10 border-purple-200/50 dark:border-purple-800/30 focus-visible:ring-purple-500"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={showFilters ? "default" : "outline"} 
            className={`gap-2 ${showFilters ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800' : 'border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
            onClick={onToggleFilters}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filtres</span>
          </Button>
          
          <Link to="/resumes/upload">
            <Button 
              variant="outline" 
              className="gap-2 border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Importer</span>
            </Button>
          </Link>
          
          <Link to="/resumes">
            <Button 
              variant="outline" 
              className="gap-2 border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">CV</span>
            </Button>
          </Link>
          
          <Button 
            className="gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
            onClick={() => {
              // TODO: Add new candidate functionality
              alert("Fonction à venir: Ajouter un candidat manuellement");
            }}
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CandidatesHeader;
