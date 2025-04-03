
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, Download, Eye, Loader2, MoreHorizontal, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SelectableCard from './SelectableCard';
import { ResumeData } from '@/services/data/resumeDataService';
import { formatDate } from '@/utils/dateFormatter';

interface ResumesGridProps {
  resumes: ResumeData[];
  selectedResumes: string[];
  selectionMode: boolean;
  downloading: Record<string, boolean>;
  onSelect: (resumeId: string) => void;
  onDownload: (filePath: string, fileName: string, resumeId: string) => void;
  onAnalyze: (resumeId: string) => void;
  onDelete: (resumeId: string, filePath: string) => void;
}

const ResumesGrid: React.FC<ResumesGridProps> = ({
  resumes,
  selectedResumes,
  selectionMode,
  downloading,
  onSelect,
  onDownload,
  onAnalyze,
  onDelete
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Link to="/resumes/upload" className="glass rounded-xl border-2 border-dashed border-navy/20 flex flex-col items-center justify-center p-6 h-64 hover:border-navy/40 transition-colors">
        <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center text-sand">
          <Plus size={24} className="text-navy" />
        </div>
        <p className="text-navy-dark font-medium mb-1 mt-4">Importer un CV</p>
        <p className="text-sm text-muted-foreground text-center">
          Glissez-déposez ou cliquez pour sélectionner
        </p>
      </Link>
      
      {resumes.map((resume) => (
        <SelectableCard
          key={resume.id}
          selected={selectedResumes.includes(resume.id)}
          onSelect={() => onSelect(resume.id)}
          className={`${selectionMode ? 'card-hover-disabled' : 'card-hover'} glass flex flex-col`}
        >
          <div className="p-4 flex-grow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-sand">
                <FileText size={18} />
              </div>
              
              {!selectionMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onDownload(resume.file_path, resume.file_name, resume.id)}
                      disabled={downloading[resume.id]}
                    >
                      {downloading[resume.id] ? (
                        <Loader2 size={14} className="mr-2 animate-spin" />
                      ) : (
                        <Download size={14} className="mr-2" />
                      )}
                      Télécharger
                    </DropdownMenuItem>
                    {!resume.parsed && (
                      <DropdownMenuItem onClick={() => onAnalyze(resume.id)}>
                        <Eye size={14} className="mr-2" />
                        Analyser
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => onDelete(resume.id, resume.file_path)}
                    >
                      <Loader2 size={14} className="mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <h3 className="font-medium text-navy-dark break-all line-clamp-1 mb-1" title={resume.file_name}>
              {resume.file_name}
            </h3>
            
            {resume.candidates && resume.candidates.length > 0 ? (
              <p className="text-sm text-muted-foreground mb-3">
                Candidat: {resume.candidates[0].first_name} {resume.candidates[0].last_name}
              </p>
            ) : (
              <p className="text-sm text-amber-600 mb-3 flex items-center">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v4m0 4h.01M5.07 19H19a2 2 0 0 0 1.75-2.98L13.75 4.99a2 2 0 0 0-3.5 0L3.25 16.02A2 2 0 0 0 5.07 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                En attente d'analyse
              </p>
            )}
            
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar size={12} className="mr-1" />
              Importé le {resume.created_at ? formatDate(resume.created_at) : 'N/A'}
            </div>
            
            <div className="text-xs text-muted-foreground mt-1">
              Taille: {(resume.file_size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          
          {!selectionMode && (
            <div className="border-t border-border/10 p-3 flex justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  resume.parsed ? 
                    navigate(`/candidates/${resume.candidates?.[0]?.id}`) :
                    onAnalyze(resume.id);
                }}
              >
                <Eye size={14} className="mr-1" />
                {resume.parsed ? "Voir candidat" : "Analyser"}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  onDownload(resume.file_path, resume.file_name, resume.id);
                }}
                disabled={downloading[resume.id]}
              >
                {downloading[resume.id] ? (
                  <Loader2 size={14} className="mr-1 animate-spin" />
                ) : (
                  <Download size={14} className="mr-1" />
                )}
                Télécharger
              </Button>
            </div>
          )}
        </SelectableCard>
      ))}
    </div>
  );
};

export default ResumesGrid;
