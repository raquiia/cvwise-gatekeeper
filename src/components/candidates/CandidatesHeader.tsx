
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Search, FileText, UserPlus, Filter, Sparkles } from 'lucide-react';
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
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 relative overflow-hidden rounded-2xl p-6 bg-white/40 backdrop-blur-sm border border-purple-200/30 shadow-lg animate-fade-in">
      {/* Animated background circles */}
      <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-purple-400/10 blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-blue-400/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
      
      <div className="mb-4 md:mb-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-md">
            <div className="absolute inset-0 bg-white/10 rounded-xl animate-pulse"></div>
            <UserPlus size={24} className="text-white relative z-10" />
            <div className="absolute -top-1 -right-1">
              <Sparkles size={12} className="text-yellow-300 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-600 mb-1">
            Candidats
            <span className="ml-2 inline-flex items-center text-sm font-normal px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-700">
              <Sparkles size={10} className="mr-1" />
              Pro
            </span>
          </h1>
        </div>
        <p className="text-muted-foreground">
          Gérez les profils des candidats issus de vos CV
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto relative z-10">
        <div className="relative w-full md:w-72 mb-4 md:mb-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Rechercher un candidat..."
            className="pl-10 border-purple-200/50 dark:border-purple-800/30 focus-visible:ring-purple-500 transition-all duration-300 focus:shadow-md"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={showFilters ? "default" : "outline"} 
            className={`gap-2 ${showFilters ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800' : 'border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20'} transition-all duration-300`}
            onClick={onToggleFilters}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filtres</span>
          </Button>
          
          <Link to="/resumes/upload">
            <Button 
              variant="outline" 
              className="gap-2 border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 relative group overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-purple-500/0 group-hover:bg-purple-500/10 transition-all duration-300"></span>
              <Upload size={16} className="group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
          </Link>
          
          <Link to="/resumes">
            <Button 
              variant="outline" 
              className="gap-2 border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 relative group overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-purple-500/0 group-hover:bg-purple-500/10 transition-all duration-300"></span>
              <FileText size={16} className="group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">CV</span>
            </Button>
          </Link>
          
          <Button 
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md transition-all duration-300 hover:shadow-lg border-0 relative group overflow-hidden"
            onClick={() => {
              // TODO: Add new candidate functionality
              alert("Fonction à venir: Ajouter un candidat manuellement");
            }}
          >
            <span className="absolute inset-0 w-full h-full bg-white/0 group-hover:bg-white/10 transition-all duration-300"></span>
            <UserPlus size={16} className="group-hover:scale-110 transition-transform duration-300" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        </div>
      </div>
      
      {/* Animated border */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500"></div>
    </div>
  );
};

export default CandidatesHeader;
