import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { Trash2, Phone, Mail, TrendingUp, User, Lock } from 'lucide-react';
import { CandidateData, candidateService } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/ui/use-confirm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ensureStringArray } from '@/utils/candidateUtils';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import { cn } from '@/lib/utils';
import { getLastCompany } from '@/utils/companyUtils';

interface CandidatesTableProps {
  candidates: CandidateData[];
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted: (candidateId: string) => void;
  jobOfferId?: string;
  isGlobalMode?: boolean;
  currentUserId?: string;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({
  candidates,
  selectedStatus,
  onStatusChange,
  onViewCandidate,
  onCandidateDeleted,
  jobOfferId,
  isGlobalMode = false,
  currentUserId
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { getAIScore, preloadScoresFromDatabase, isJobSpecific } = useAIScoring();

  // Précharger les scores depuis la base de données au chargement
  useEffect(() => {
    const candidateIds = candidates.map(c => c.id!).filter(Boolean);
    if (candidateIds.length > 0) {
      console.log('Preloading AI scores for candidates table');
      preloadScoresFromDatabase(candidateIds, jobOfferId);
    }
  }, [candidates, preloadScoresFromDatabase, jobOfferId]);
  
  const handleStatusChange = (status: string | null) => {
    onStatusChange(status);
  };

  const handleDeleteCandidate = async (candidateId: string, candidate: CandidateData, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Vérifier si l'utilisateur peut supprimer ce candidat
    const isOwnCandidate = candidate.user_id === currentUserId;
    if (!isOwnCandidate) {
      toast({
        title: "Action non autorisée",
        description: "Vous ne pouvez supprimer que vos propres candidats.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const confirmed = await confirm({
        title: 'Supprimer le candidat ?',
        description: 'Êtes-vous sûr de vouloir supprimer ce candidat ? Cette action est irréversible.',
      });
      
      if (confirmed) {
        console.log('Deleting candidate:', candidateId);
        
        // Supprimer le candidat via le service
        const success = await candidateService.deleteCandidate(candidateId);
        
        if (success) {
          console.log('Candidate deleted successfully');
          
          // Informer le parent que le candidat a été supprimé
          onCandidateDeleted(candidateId);
          
          toast({
            title: "Candidat supprimé",
            description: "Le candidat a été supprimé avec succès.",
          });
        } else {
          throw new Error('Échec de la suppression');
        }
      }
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le candidat",
        variant: "destructive",
      });
    }
  };

  const handleRowClick = (candidate: CandidateData) => {
    onViewCandidate(candidate.id!);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initial': return 'bg-gray-100 text-gray-800';
      case 'contact': return 'bg-blue-100 text-blue-800';
      case 'prequalification': return 'bg-yellow-100 text-yellow-800';
      case 'ec1': return 'bg-purple-100 text-purple-800';
      case 'ec2': return 'bg-orange-100 text-orange-800';
      case 'presentation_client': return 'bg-indigo-100 text-indigo-800';
      case 'en_mission': return 'bg-green-100 text-green-800';
      case 'refus': return 'bg-red-100 text-red-800';
      case 'ancien_employe': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getScoreSource = (source?: string) => {
    switch (source) {
      case 'database': return 'BDD';
      case 'fresh_calculation': return 'Nouveau';
      case 'cache': return 'Cache';
      default: return 'Ancien';
    }
  };

  const jobSpecific = isJobSpecific(jobOfferId);

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-semibold text-gray-700 w-[25%]">Candidat</TableHead>
            <TableHead className="font-semibold text-gray-700 w-[20%]">Poste & Entreprise</TableHead>
            <TableHead className="font-semibold text-gray-700 w-[15%]">Expérience</TableHead>
            <TableHead className="font-semibold text-gray-700 w-[20%]">Compétences</TableHead>
            <TableHead className="font-semibold text-gray-700 w-[10%]">Score IA</TableHead>
            <TableHead className="font-semibold text-gray-700 w-[10%] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => {
            const skills = ensureStringArray(candidate.skills);
            const aiScore = getAIScore(candidate.id!, jobOfferId);
            const displayScore = aiScore.score !== null ? aiScore.score : (candidate.score || 0);
            const isAIScore = aiScore.score !== null;
            const lastCompany = getLastCompany(candidate);
            
            // Check ownership
            const isOwnCandidate = candidate.user_id === currentUserId;
            const ownerName = candidate.owner_first_name && candidate.owner_last_name 
              ? `${candidate.owner_first_name} ${candidate.owner_last_name}`
              : null;
            
            return (
              <TableRow 
                key={candidate.id} 
                className="hover:bg-gray-50/50 transition-colors duration-200 border-b border-gray-100 cursor-pointer"
                onClick={() => handleRowClick(candidate)}
              >
                {/* Candidat - Fusion Contact */}
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0",
                      isOwnCandidate ? "bg-gradient-to-br from-purple-500 to-blue-600" : "bg-gray-500"
                    )}>
                      {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {candidate.first_name} <span className="font-bold">{candidate.last_name}</span>
                        </span>
                        {isGlobalMode && !isOwnCandidate && (
                          <Badge variant="outline" className="text-xs bg-muted/30 text-muted-foreground border-border/50 flex-shrink-0">
                            <User size={8} className="mr-0.5" />
                            {ownerName || 'Autre'}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        <span title={candidate.email}>{candidate.email}</span>
                        {candidate.phone && (
                          <span 
                            className="ml-2 text-xs text-gray-400 cursor-help" 
                            title={`Téléphone: ${candidate.phone}`}
                          >
                            📞
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                {/* Poste & Entreprise - Fusion */}
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-800 truncate" title={candidate.position}>
                      {candidate.position || 'Non spécifié'}
                    </div>
                    <div className="text-sm text-gray-500 truncate" title={lastCompany}>
                      {lastCompany}
                    </div>
                  </div>
                </TableCell>
                
                {/* Expérience & Localisation - Fusion */}
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-800">
                      {candidate.years_experience ? `${candidate.years_experience} ans` : '0 an'}
                    </div>
                    <div className="text-sm text-gray-500 truncate" title={candidate.location}>
                      {candidate.location || 'Non spécifiée'}
                    </div>
                  </div>
                </TableCell>
                
                {/* Compétences - Optimisé */}
                <TableCell>
                  <div className="flex flex-wrap gap-1" title={skills.join(', ')}>
                    {skills.length > 0 ? (
                      <>
                        {skills.slice(0, 2).map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 truncate max-w-[80px]">
                            {skill}
                          </Badge>
                        ))}
                        {skills.length > 2 && (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                            +{skills.length - 2}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">Aucune</span>
                    )}
                  </div>
                </TableCell>
                
                {/* Score IA - Compacté */}
                <TableCell>
                  <div className="flex flex-col items-center gap-1">
                    {aiScore.isLoading ? (
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : aiScore.error ? (
                      <div 
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                          displayScore >= 80 ? "bg-green-500" : 
                          displayScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        title={aiScore.error}
                      >
                        {candidate.score || 0}
                      </div>
                    ) : (
                      <div 
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                          displayScore >= 80 ? "bg-green-500" : 
                          displayScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        title={isAIScore ? aiScore.explanation : "Score calculé avec l'ancien système"}
                      >
                        {displayScore}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant={isAIScore ? "default" : "secondary"} 
                        className={cn(
                          "text-xs px-1 py-0",
                          isAIScore ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {isAIScore ? getScoreSource(aiScore.source) : 'Ancien'}
                      </Badge>
                      
                      {jobSpecific && (
                        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-300 px-1 py-0">
                          <TrendingUp size={8} />
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  {isOwnCandidate ? (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleDeleteCandidate(candidate.id!, candidate, e)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                      title="Supprimer le candidat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled
                      className="h-8 w-8 p-0 text-gray-400"
                      title="Vous ne pouvez pas supprimer ce candidat"
                    >
                      <Lock className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {candidates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun candidat trouvé</p>
        </div>
      )}
    </div>
  );
};

export default CandidatesTable;
