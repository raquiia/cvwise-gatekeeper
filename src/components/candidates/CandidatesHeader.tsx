
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Search, FileText, UserPlus, Filter, Zap, Scan, BrainCircuit } from 'lucide-react';
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
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 relative overflow-hidden ai-card p-6 animate-fade-in">
      {/* Animated background elements */}
      <div className="absolute inset-0 ai-gradient-bg opacity-70"></div>
      <div className="absolute inset-0 ai-grid-bg opacity-20"></div>
      <div className="absolute ai-card-accent ai-card-accent-1 ai-pulse"></div>
      <div className="absolute ai-card-accent ai-card-accent-2 ai-pulse" style={{ animationDelay: '1.5s' }}></div>
      
      {/* Animated geometric shapes */}
      <div className="absolute -top-12 -left-12 w-32 h-32 border border-indigo-300/20 rounded-full ai-rotate opacity-30"></div>
      <div className="absolute -bottom-12 -right-12 w-24 h-24 border border-purple-300/20 rounded-full ai-rotate opacity-30" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
      
      <div className="mb-4 md:mb-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg ai-glow">
            <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse"></div>
            <UserPlus size={24} className="text-white relative z-10" />
            <div className="absolute -top-1 -right-1">
              <Zap size={10} className="text-yellow-300 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-bold ai-gradient-text mb-1">
            Candidats
            <span className="ml-2 inline-flex items-center text-sm font-normal px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700">
              <BrainCircuit size={10} className="mr-1" />
              AI Pro
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
            className="pl-10 ai-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={showFilters ? "default" : "outline"} 
            className={`gap-2 ${showFilters ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800' : 'border-indigo-200/50 dark:border-indigo-800/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'} transition-all duration-300`}
            onClick={onToggleFilters}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filtres</span>
          </Button>
          
          <Link to="/resumes/upload">
            <Button 
              variant="outline" 
              className="gap-2 border-indigo-200/50 dark:border-indigo-800/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300 relative group overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-all duration-300"></span>
              <Upload size={16} className="group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
          </Link>
          
          <Link to="/resumes">
            <Button 
              variant="outline" 
              className="gap-2 border-indigo-200/50 dark:border-indigo-800/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300 relative group overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-all duration-300"></span>
              <FileText size={16} className="group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">CV</span>
            </Button>
          </Link>
          
          <Button 
            className="gap-2 ai-button"
            onClick={() => {
              // TODO: Add new candidate functionality
              alert("Fonction à venir: Ajouter un candidat manuellement");
            }}
          >
            <UserPlus size={16} className="group-hover:scale-110 transition-transform duration-300" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        </div>
      </div>
      
      {/* Holographic border effect */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
    </div>
  );
};

export default CandidatesHeader;
