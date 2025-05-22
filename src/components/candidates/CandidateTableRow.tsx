
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MoreHorizontal, Eye, Trash, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { CandidateData } from '@/services/data/candidateService';
import { candidateService } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';

interface CandidateTableRowProps {
  candidate: CandidateData;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
  hideScore?: boolean;
  scoreIsMatchScore?: boolean;
  matchDetails?: any;
  statusFirst?: boolean;
}

const CandidateTableRow: React.FC<CandidateTableRowProps> = ({
  candidate,
  onViewCandidate,
  onCandidateDeleted,
  hideScore = false,
  scoreIsMatchScore = false,
  matchDetails,
  statusFirst = false
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleViewCandidate = () => {
    if (candidate.id) {
      onViewCandidate(candidate.id);
    }
  };
  
  const handleDeleteCandidate = async () => {
    if (!candidate.id) return;
    
    setIsDeleting(true);
    try {
      await candidateService.deleteCandidate(candidate.id, true);
      
      toast({
        title: "Candidat supprimé",
        description: "Le candidat et le CV associé ont été supprimés avec succès",
      });
      
      if (onCandidateDeleted) {
        onCandidateDeleted();
      }
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      
      toast({
        title: "Erreur de suppression",
        description: error.message || "Impossible de supprimer le candidat",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
    }
  };
  
  // Format and display skills from array
  const formatSkills = () => {
    if (!candidate.skills || !Array.isArray(candidate.skills) || candidate.skills.length === 0) {
      return "Aucune compétence";
    }
    
    return candidate.skills.slice(0, 3).map((skill, index) => (
      <span key={index} className="inline-flex items-center px-2 py-1 mr-1 mb-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
        {typeof skill === 'object' ? skill.name || '' : skill}
      </span>
    ));
  };
  
  // Format the date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non spécifiée";
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return "Date invalide";
    }
  };

  // Get status class based on status value
  const getStatusClass = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    
    switch(status) {
      case 'initial':
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case 'contact':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case 'prequalification':
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300";
      case 'ec1':
        return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300";
      case 'ec2':
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
      case 'presentation_client':
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case 'en_mission':
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case 'refus':
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case 'ancien_employe':
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };
  
  // Check if candidate data exists
  if (!candidate) {
    return (
      <TableRow className="border-b border-purple-100/30 dark:border-purple-900/10">
        <TableCell colSpan={9} className="py-4 text-center text-muted-foreground">
          <AlertCircle className="w-5 h-5 mx-auto mb-2" />
          Données du candidat non disponibles
        </TableCell>
      </TableRow>
    );
  }
  
  // Construct display name
  const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Sans nom';
  
  // Get the status value, ensuring it's a string and not an object
  // Fixed type checking to avoid 'never' type error
  const statusValue = typeof candidate.detailed_status === 'string' 
    ? candidate.detailed_status 
    : (candidate.detailed_status && 
       typeof candidate.detailed_status === 'object' && 
       candidate.detailed_status !== null && 
       'value' in (candidate.detailed_status as Record<string, unknown>))
      ? (candidate.detailed_status as Record<string, string>).value
      : 'initial';
  
  // Status cell to be placed before or after name
  const statusCell = (
    <TableCell className="hidden md:table-cell">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(statusValue)}`}>
        {CANDIDATE_STATUS_LABELS[statusValue] || 'Initial'}
      </span>
    </TableCell>
  );
  
  return (
    <TableRow className="border-b border-purple-100/30 dark:border-purple-900/10 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors">
      {/* Status cell first if requested */}
      {statusFirst && statusCell}
      
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-800 dark:to-indigo-900 flex items-center justify-center text-purple-700 dark:text-purple-300 font-medium">
            {`${candidate.first_name?.[0] || ''}${candidate.last_name?.[0] || ''}`.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-navy-dark dark:text-sand">{fullName}</p>
            <p className="text-xs text-muted-foreground">{candidate.email || 'Pas d\'email'}</p>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        {candidate.position || 'Non spécifié'}
      </TableCell>
      
      <TableCell>
        {candidate.company || 'Non spécifié'}
      </TableCell>
      
      <TableCell className="hidden lg:table-cell">
        {candidate.location || 'Non spécifié'}
      </TableCell>
      
      <TableCell className="hidden lg:table-cell">
        {candidate.years_experience 
          ? `${candidate.years_experience} an${candidate.years_experience > 1 ? 's' : ''}` 
          : 'Non spécifié'}
      </TableCell>
      
      <TableCell>
        <div className="flex flex-wrap max-w-[200px]">
          {formatSkills()}
        </div>
      </TableCell>
      
      {/* Status cell later if not requested first */}
      {!statusFirst && statusCell}
      
      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
        {formatDate(candidate.updated_at)}
      </TableCell>
      
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            onClick={handleViewCandidate}
          >
            <Eye size={16} className="mr-1" />
            Voir
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-navy-dark dark:hover:text-sand"
              >
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-md border-purple-100/50 shadow-lg dark:bg-navy-dark/95 dark:border-purple-800/30">
              <DropdownMenuItem onClick={handleViewCandidate}>
                <Eye className="mr-2 h-4 w-4" />
                Voir le profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash className="mr-2 h-4 w-4 text-red-500" />
                    <span className="text-red-500">Supprimer</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce candidat ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement le candidat et le CV associé.
                      Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteCandidate}
                      className="bg-red-500 hover:bg-red-600"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default CandidateTableRow;
