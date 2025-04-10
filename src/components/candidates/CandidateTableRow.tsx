import React, { useState } from 'react';
import { Star, MapPin, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { CandidateData, candidateService } from '@/services/data/candidateService';
import { TableRow, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CandidateTableRowProps {
  candidate: CandidateData;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
  hideScore?: boolean;
  scoreIsMatchScore?: boolean;
  matchDetails?: any;
}

const CandidateTableRow: React.FC<CandidateTableRowProps> = ({ 
  candidate, 
  onViewCandidate,
  onCandidateDeleted,
  hideScore = false,
  scoreIsMatchScore = false,
  matchDetails = null
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { toast } = useToast();
  
  if (!candidate || typeof candidate !== 'object') {
    console.error('Invalid candidate object:', candidate);
    return null;
  }

  if (!candidate.id) {
    console.error('Candidate without ID:', candidate);
    return null;
  }

  const firstInitial = candidate.first_name?.charAt(0) || '?';
  const lastInitial = candidate.last_name?.charAt(0) || '?';
  const fullName = `${candidate.first_name || 'Sans nom'} ${candidate.last_name || ''}`.trim();
  
  let position = 'Non spécifié';
  if (candidate.position) {
    if (typeof candidate.position === 'string') {
      position = candidate.position;
    } else if (typeof candidate.position === 'object' && candidate.position !== null) {
      const posObj = candidate.position as any;
      if (posObj.value && posObj.value !== 'undefined') {
        position = posObj.value;
      } else if (Object.values(posObj).length > 0) {
        const firstValue = Object.values(posObj).find(v => typeof v === 'string' && v !== 'undefined');
        if (firstValue) position = String(firstValue);
      }
    }
  }
  
  const location = candidate.location || 'Non spécifié';
  const yearsExp = candidate.years_experience || 0;
  
  const skills = Array.isArray(candidate.skills) 
    ? candidate.skills.map(skill => String(skill)) 
    : (typeof candidate.skills === 'object' && candidate.skills !== null)
      ? Object.values(candidate.skills).filter(Boolean).map(skill => String(skill))
      : [];
      
  const status = candidate.status || 'qualification';
  const updatedAt = candidate.updated_at ? new Date(candidate.updated_at) : null;
  const company = candidate.company || 'Non spécifié';

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-purple-400 to-purple-600',
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-amber-400 to-amber-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
      'from-red-400 to-red-600',
      'from-orange-400 to-orange-600',
      'from-cyan-400 to-cyan-600'
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const colorClass = getAvatarColor(fullName);
  
  const handleViewClick = () => {
    if (candidate.id) {
      onViewCandidate(candidate.id);
    }
  };
  
  const handleDeleteClick = () => {
    setDeleteError(null);
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = async () => {
    if (!candidate.id) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      if (!candidate.resume_id) {
        console.warn('Candidate has no resume_id. Only candidate will be deleted:', candidate.id);
      }
      
      console.log('Attempting to delete candidate with ID:', candidate.id);
      console.log('Delete resume as well?', !!candidate.resume_id);
      
      await candidateService.deleteCandidate(candidate.id, !!candidate.resume_id);
      
      setShowDeleteDialog(false);
      
      setTimeout(() => {
        toast({
          title: "Candidat supprimé",
          description: `${fullName} a été supprimé avec succès.`,
        });
        
        if (onCandidateDeleted) {
          onCandidateDeleted();
        }
      }, 100);
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      
      const errorMessage = error.message || "Impossible de supprimer le candidat.";
      const isRecursionError = errorMessage.includes('infinite recursion') || 
                              errorMessage.includes('recursion infinie') ||
                              errorMessage.includes('recursive') ||
                              errorMessage.includes('configuration de sécurité');
      
      setDeleteError(
        isRecursionError
          ? "Erreur lors de la suppression. Veuillez réessayer dans quelques instants ou contacter l'administrateur système."
          : errorMessage
      );
      
      toast({
        title: "Erreur de suppression",
        description: isRecursionError 
          ? "Problème temporaire détecté. Veuillez réessayer dans quelques instants."
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setDeleteError(null);
  };

  const getStatusChipColor = (status: string) => {
    switch(status) {
      case 'active': 
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'qualification': 
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'interview': 
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'hired': 
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'inactive': 
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
      default: 
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'active': return 'Actif';
      case 'qualification': return 'En qualification';
      case 'inactive': return 'Inactif';
      case 'interview': return 'En entretien';
      case 'hired': return 'Embauché';
      default: return 'Statut inconnu';
    }
  };

  const statusChipClass = getStatusChipColor(status);
  const statusText = getStatusText(status);

  return (
    <>
      <TableRow className="border-b border-purple-100/30 dark:border-purple-900/20 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
        <TableCell className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className={`bg-gradient-to-br ${colorClass} text-white shadow-md h-11 w-11 transition-all duration-300 hover:shadow-lg`}>
              <AvatarFallback className="text-white font-medium">
                {firstInitial}{lastInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="font-medium text-navy-dark dark:text-sand">{fullName}</span>
              <div className="flex items-center mt-1">
                <div className={`px-2 py-0.5 rounded-full text-xs ${statusChipClass}`}>
                  {statusText}
                </div>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="p-4 text-navy-dark dark:text-sand">
          {position}
        </TableCell>
        <TableCell className="p-4 text-navy-dark dark:text-sand">
          {company}
        </TableCell>
        <TableCell className="p-4 text-muted-foreground hidden lg:table-cell">
          {location !== 'Non spécifié' ? (
            <div className="flex items-center">
              <MapPin size={14} className="mr-1 text-purple-500 dark:text-purple-400" />
              {location}
            </div>
          ) : 'Non spécifié'}
        </TableCell>
        <TableCell className="p-4 text-muted-foreground hidden lg:table-cell">
          {yearsExp > 0 ? `${yearsExp} ans` : 'Non spécifié'}
        </TableCell>
        <TableCell className="p-4">
          <div className="flex flex-wrap gap-1">
            {skills.length > 0 ? (
              skills.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="inline-block px-2 py-0.5 bg-purple-100/70 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                  {String(skill)}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">Non spécifié</span>
            )}
            {skills.length > 3 && (
              <span className="inline-block px-2 py-0.5 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                +{skills.length - 3}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="p-4 text-muted-foreground hidden md:table-cell">
          {updatedAt ? format(updatedAt, 'dd MMM yyyy', { locale: fr }) : 'N/A'}
        </TableCell>
        <TableCell className="p-4">
          <div className="flex items-center justify-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              onClick={handleViewClick}
            >
              <Eye size={16} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-md border-purple-200/50 shadow-lg dark:bg-navy-dark/95 dark:border-purple-800/30">
                <DropdownMenuItem>
                  Éditer
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600 dark:text-red-400"
                  onClick={handleDeleteClick}
                >
                  <Trash2 size={14} className="mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-md border-purple-200/50 shadow-lg dark:bg-navy-dark/95 dark:border-purple-800/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {fullName} ? Cette action est irréversible.
            </AlertDialogDescription>
            {deleteError && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
                {deleteError}
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={handleCancelDelete}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
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
