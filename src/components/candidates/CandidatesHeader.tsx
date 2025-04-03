
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Search, FileText, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          Gérez les profils des candidats issus de vos CV
        </p>
      </div>
      
      <div className="flex gap-2">
        <Link to="/resumes/upload">
          <Button variant="outline" className="gap-2">
            <Upload size={16} />
            <span className="hidden sm:inline">Importer</span>
          </Button>
        </Link>
        
        <Link to="/resumes">
          <Button variant="outline" className="gap-2">
            <FileText size={16} />
            <span className="hidden sm:inline">CV</span>
          </Button>
        </Link>
        
        <Button 
          className="gap-2"
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
  );
};

export default CandidatesHeader;
