
import React, { useState } from 'react';
import { Star, MapPin, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { CandidateData } from '@/services/data/resumeDataService';
import { candidateDataService } from '@/services/data/candidateDataService';

interface CandidateTableRowProps {
  candidate: CandidateData;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
}

const CandidateTableRow: React.FC<CandidateTableRowProps> = ({ 
  candidate, 
  onViewCandidate,
  onCandidateDeleted 
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { toast } = useToast();
  
  if (!candidate || typeof candidate !== 'object') {
    console.error('Invalid candidate object:', candidate);
    return null;
  }

  // Make sure we have an id
  if (!candidate.id) {
    console.error('Candidate without ID:', candidate);
    return null;
  }

  // Get safe values with fallbacks
  const firstInitial = candidate.first_name?.charAt(0) || '?';
  const lastInitial = candidate.last_name?.charAt(0) || '?';
  const fullName = `${candidate.first_name || 'Sans nom'} ${candidate.last_name || ''}`.trim();
  
  // Fix for position coming as an object sometimes
  let position = 'Non spécifié';
  if (candidate.position) {
    if (typeof candidate.position === 'string') {
      position = candidate.position;
    } else if (typeof candidate.position === 'object' && candidate.position !== null) {
      // Try to extract value if position is an object
      const posObj = candidate.position as any;
      if (posObj.value && posObj.value !== 'undefined') {
        position = posObj.value;
      } else if (Object.values(posObj).length > 0) {
        // Try first value in the object
        const firstValue = Object.values(posObj).find(v => typeof v === 'string' && v !== 'undefined');
        if (firstValue) position = String(firstValue);
      }
    }
  }
  
  const location = candidate.location || 'Non spécifié';
  const yearsExp = candidate.years_experience || 0;
  
  // Make sure skills is an array of strings
  const skills = Array.isArray(candidate.skills) 
    ? candidate.skills.map(skill => String(skill)) 
    : (typeof candidate.skills === 'object' && candidate.skills !== null)
      ? Object.values(candidate.skills).filter(Boolean).map(skill => String(skill))
      : [];
      
  const score = candidate.score || 0;
  const status = candidate.status || 'qualification';
  const updatedAt = candidate.updated_at ? new Date(candidate.updated_at) : null;
  const company = candidate.company || 'Non spécifié';
  
  // Safe click handler
  const handleViewClick = () => {
    if (candidate.id) {
      onViewCandidate(candidate.id);
    }
  };
  
  // Delete candidate handler
  const handleDeleteClick = () => {
    setDeleteError(null);
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = async () => {
    if (!candidate.id) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await candidateDataService.deleteCandidate(candidate.id);
      
      // Notify parent component to refresh the list
      toast({
        title: "Candidat supprimé",
        description: `${fullName} a été supprimé avec succès.`,
      });
      
      if (onCandidateDeleted) {
        onCandidateDeleted();
      }
      
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      setDeleteError(error.message || "Impossible de supprimer le candidat. Veuillez réessayer.");
      
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le candidat. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <tr className="border-b border-border/10 hover:bg-navy/5 transition-colors">
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy-dark font-medium">
              {firstInitial}{lastInitial}
            </div>
            <div>
              <span className="font-medium text-navy-dark">{fullName}</span>
              <div className="flex items-center mt-0.5">
                {status === 'active' ? (
                  <div className="flex items-center text-xs text-emerald-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></div>
                    Actif
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-amber-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1"></div>
                    {status === 'qualification' ? 'En qualification' : 
                     status === 'inactive' ? 'Inactif' : 
                     status === 'interview' ? 'En entretien' :
                     status === 'hired' ? 'Embauché' : 'Statut inconnu'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </td>
        <td className="p-4 text-navy-dark">
          {position}
        </td>
        <td className="p-4 text-navy-dark">
          {company}
        </td>
        <td className="p-4 text-muted-foreground hidden lg:table-cell">
          {location !== 'Non spécifié' ? (
            <div className="flex items-center">
              <MapPin size={14} className="mr-1" />
              {location}
            </div>
          ) : 'Non spécifié'}
        </td>
        <td className="p-4 text-muted-foreground hidden lg:table-cell">
          {yearsExp > 0 ? `${yearsExp} ans` : 'Non spécifié'}
        </td>
        <td className="p-4">
          <div className="flex flex-wrap gap-1">
            {skills.length > 0 ? (
              skills.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="inline-block px-2 py-0.5 bg-navy/10 text-navy-dark text-xs rounded-full">
                  {String(skill)}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">Non spécifié</span>
            )}
            {skills.length > 3 && (
              <span className="inline-block px-2 py-0.5 bg-navy/5 text-navy-dark text-xs rounded-full">
                +{skills.length - 3}
              </span>
            )}
          </div>
        </td>
        <td className="p-4">
          {score > 0 ? (
            <div className={`rating-chip ${
              score > 85 ? 'rating-high' : 
              score > 65 ? 'rating-medium' : 
              'rating-low'
            }`}>
              <Star size={12} />
              {score}%
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">N/A</span>
          )}
        </td>
        <td className="p-4 text-muted-foreground hidden md:table-cell">
          {updatedAt ? updatedAt.toLocaleDateString() : 'N/A'}
        </td>
        <td className="p-4">
          <div className="flex items-center justify-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleViewClick}
            >
              <Eye size={16} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  Éditer
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={handleDeleteClick}
                >
                  <Trash2 size={14} className="mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {fullName} ? Cette action est irréversible.
            </AlertDialogDescription>
            {deleteError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {deleteError}
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CandidateTableRow;
