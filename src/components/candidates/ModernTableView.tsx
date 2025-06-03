
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Trash2, 
  Star,
  Clock,
  Award,
  Briefcase,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { candidateService } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedScoring } from '@/hooks/use-optimized-scoring';
import { cn } from '@/lib/utils';

interface ModernTableViewProps {
  candidates: CandidateData[];
  selectedCandidates: Set<string>;
  onSelectCandidate: (candidateId: string, selected: boolean) => void;
  onSelectAll: () => void;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
  refreshKey?: number; // NEW: Add refreshKey prop
}

const ModernTableView: React.FC<ModernTableViewProps> = ({
  candidates,
  selectedCandidates,
  onSelectCandidate,
  onSelectAll,
  onViewCandidate,
  onCandidateDeleted
}) => {
  const { toast } = useToast();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  
  const { 
    getCachedScore, 
    isScoreLoading, 
    calculateContextualScore, 
    isJobSpecific 
  } = useOptimizedScoring();

  // Calculate scores progressively when candidates or job context changes
  useEffect(() => {
    if (!candidates.length) return;
    
    const calculateScoresProgressively = async () => {
      console.log(`Calculating scores for ${candidates.length} candidates, job specific: ${isJobSpecific}`);
      
      // Calculate scores for visible candidates first (first 10)
      const visibleCandidates = candidates.slice(0, 10);
      
      for (let i = 0; i < visibleCandidates.length; i++) {
        const candidate = visibleCandidates[i];
        if (candidate.id && !getCachedScore(candidate.id) && !isScoreLoading(candidate.id)) {
          try {
            // Add small delay between calculations to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, i * 200));
            await calculateContextualScore(candidate);
          } catch (error) {
            console.error(`Error calculating score for candidate ${candidate.id}:`, error);
          }
        }
      }
      
      // Calculate remaining candidates with longer delays
      const remainingCandidates = candidates.slice(10);
      remainingCandidates.forEach((candidate, index) => {
        if (candidate.id && !getCachedScore(candidate.id) && !isScoreLoading(candidate.id)) {
          setTimeout(async () => {
            try {
              await calculateContextualScore(candidate);
            } catch (error) {
              console.error(`Error calculating score for candidate ${candidate.id}:`, error);
            }
          }, 2000 + (index * 300));
        }
      });
    };

    calculateScoresProgressively();
  }, [candidates.length, isJobSpecific]); // Re-run when job context changes

  // Fonction pour générer une couleur basée sur les initiales
  const getAvatarColor = (firstName: string, lastName: string) => {
    const colors = [
      'bg-gradient-to-br from-purple-500 to-pink-500',
      'bg-gradient-to-br from-blue-500 to-cyan-500',
      'bg-gradient-to-br from-green-500 to-teal-500',
      'bg-gradient-to-br from-orange-500 to-red-500',
      'bg-gradient-to-br from-indigo-500 to-purple-500',
      'bg-gradient-to-br from-pink-500 to-rose-500',
      'bg-gradient-to-br from-cyan-500 to-blue-500',
      'bg-gradient-to-br from-teal-500 to-green-500',
    ];
    const nameHash = (firstName + lastName).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[nameHash % colors.length];
  };

  // Function to format company name with line breaks for long names
  const formatCompanyName = (companyName: string) => {
    if (!companyName) return null;
    
    // If company name is longer than 20 characters, try to break it at logical points
    if (companyName.length > 20) {
      // Look for common break points like spaces, hyphens, or uppercase letters
      const words = companyName.split(/(\s+|-|(?=[A-Z]))/);
      if (words.length > 1) {
        // Split into two lines if possible
        const midPoint = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, midPoint).join('');
        const secondLine = words.slice(midPoint).join('');
        
        return (
          <div className="text-sm font-medium text-navy-dark dark:text-sand">
            <div className="truncate">{firstLine}</div>
            <div className="truncate text-xs text-muted-foreground">{secondLine}</div>
          </div>
        );
      }
    }
    
    return (
      <div className="text-sm font-medium text-navy-dark dark:text-sand truncate">
        {companyName}
      </div>
    );
  };

  // Function to extract city and country from location
  const formatLocation = (location: string) => {
    if (!location) return null;
    
    // Try to extract city and country from common location formats
    // Examples: "Paris, France", "New York, NY, USA", "London, UK"
    const parts = location.split(',').map(part => part.trim());
    
    if (parts.length >= 2) {
      // Take the first part as city and last part as country
      const city = parts[0];
      const country = parts[parts.length - 1];
      
      // If there are 3 parts and the middle one looks like a state code (2 letters), use the last one
      if (parts.length === 3 && parts[1].length === 2) {
        return `${city}, ${country}`;
      }
      
      return `${city}, ${country}`;
    }
    
    // If only one part, return as is (might be just a city or country)
    return location;
  };

  const getStatusBadge = (status: string) => {
    const statusLabel = CANDIDATE_STATUS_LABELS[status] || status;
    
    const statusConfig = {
      initial: { 
        color: 'bg-gray-100 text-gray-700 border-gray-200', 
        icon: Clock, 
        pulse: false 
      },
      contact: { 
        color: 'bg-blue-100 text-blue-700 border-blue-200', 
        icon: Phone, 
        pulse: false 
      },
      prequalification: { 
        color: 'bg-purple-100 text-purple-700 border-purple-200', 
        icon: Award, 
        pulse: false 
      },
      ec1: { 
        color: 'bg-orange-100 text-orange-700 border-orange-200', 
        icon: Star, 
        pulse: false 
      },
      ec2: { 
        color: 'bg-amber-100 text-amber-700 border-amber-200', 
        icon: Star, 
        pulse: false 
      },
      presentation_client: { 
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200', 
        icon: Briefcase, 
        pulse: false 
      },
      en_mission: { 
        color: 'bg-green-100 text-green-700 border-green-200', 
        icon: TrendingUp, 
        pulse: false 
      },
      refus: { 
        color: 'bg-red-100 text-red-700 border-red-200', 
        icon: Clock, 
        pulse: false 
      },
      ancien_employe: { 
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
        icon: Award, 
        pulse: false 
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.initial;
    const Icon = config.icon;

    return (
      <Badge 
        variant="outline" 
        className={cn(
          config.color,
          'border text-xs font-medium flex items-center gap-1.5 px-2 py-1'
        )}
      >
        <Icon size={10} />
        {statusLabel}
      </Badge>
    );
  };

  const getScoreBadge = (candidateId: string) => {
    const isLoading = isScoreLoading(candidateId);
    const scoreData = getCachedScore(candidateId);
    
    if (isLoading) {
      return (
        <Badge variant="outline" className="border text-xs px-2 py-1 animate-pulse bg-blue-50 border-blue-200">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            Calcul...
          </div>
        </Badge>
      );
    }
    
    if (!scoreData) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 text-xs px-2 py-1">
          --
        </Badge>
      );
    }

    const score = scoreData.overall;
    const isJobSpecificScore = scoreData.isJobSpecific;
    
    let bgColor = 'bg-red-100 text-red-700 border-red-200';
    
    if (isJobSpecificScore) {
      // Job-specific scoring (0-100 match percentage)
      if (score >= 70) {
        bgColor = 'bg-green-100 text-green-700 border-green-200';
      } else if (score >= 50) {
        bgColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
      }
    } else {
      // General profile completeness scoring
      if (score >= 80) {
        bgColor = 'bg-green-100 text-green-700 border-green-200';
      } else if (score >= 60) {
        bgColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
      }
    }

    return (
      <div className="flex flex-col items-center gap-1">
        <Badge 
          variant="outline" 
          className={cn(bgColor, 'border text-xs font-semibold px-2 py-1')}
        >
          {score}%
        </Badge>
        {isJobSpecificScore && (
          <div className="flex items-center gap-1">
            <Briefcase size={10} className="text-purple-600" />
            <span className="text-xs text-purple-600 font-medium">Match</span>
          </div>
        )}
      </div>
    );
  };

  const handleDelete = async (e: React.MouseEvent, candidateId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await candidateService.deleteCandidate(candidateId, true);
      toast({
        title: "Candidat supprimé",
        description: "Le candidat a été supprimé avec succès",
      });
      if (onCandidateDeleted) {
        onCandidateDeleted();
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le candidat",
        variant: "destructive",
      });
    }
  };

  const handleRowClick = (candidateId: string) => {
    onViewCandidate(candidateId);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, candidateId: string) => {
    e.stopPropagation(); // Empêche la propagation vers le TableRow
    onSelectCandidate(candidateId, e.target.checked);
  };

  const handleCheckboxCellClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche la propagation vers le TableRow
  };

  const candidatesCount = candidates.length;
  const selectedCount = selectedCandidates.size;

  return (
    <div className="rounded-lg border border-purple-200/30 dark:border-purple-800/20 overflow-hidden bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm shadow-xl">
      {/* En-tête de tableau moderne */}
      <div className="bg-gradient-to-r from-purple-50/80 to-white/80 dark:from-purple-950/30 dark:to-navy-dark/50 border-b border-purple-200/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedCount === candidatesCount && candidatesCount > 0}
              ref={(input) => {
                if (input) {
                  input.indeterminate = selectedCount > 0 && selectedCount < candidatesCount;
                }
              }}
              onChange={onSelectAll}
              className="w-4 h-4 rounded border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500/25"
            />
            <h3 className="font-semibold text-navy-dark dark:text-sand">
              {candidatesCount} candidat{candidatesCount > 1 ? 's' : ''}
            </h3>
            {selectedCount > 0 && (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {isJobSpecific ? 'Scores de correspondance activés' : 'Scores généraux de profil'}
          </div>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="border-b border-purple-200/30 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20 hover:bg-purple-50/50 dark:hover:bg-purple-950/20">
            <TableHead className="w-12"></TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand w-64">Candidat</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand w-24">
              {isJobSpecific ? 'Match' : 'Score'}
            </TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand w-32">Statut</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand w-48">Entreprise actuelle</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand w-32">Localisation</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand w-40">Poste actuel</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand hidden xl:table-cell w-24">Expérience</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand">Compétences</TableHead>
            <TableHead className="font-semibold text-navy-dark dark:text-sand text-center w-16">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => {
            const skills = ensureStringArray(candidate.skills);
            const isHovered = hoveredRow === candidate.id;
            const isSelected = selectedCandidates.has(candidate.id!);

            return (
              <TableRow
                key={candidate.id || `temp-${Math.random()}`}
                className={cn(
                  "group transition-all duration-200 border-b border-purple-100/30 dark:border-purple-800/20",
                  "hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-transparent dark:hover:from-purple-950/15 dark:hover:to-transparent",
                  isSelected && "bg-purple-50/50 dark:bg-purple-950/20",
                  "cursor-pointer"
                )}
                onMouseEnter={() => setHoveredRow(candidate.id!)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => handleRowClick(candidate.id!)}
              >
                {/* Checkbox */}
                <TableCell className="py-3" onClick={handleCheckboxCellClick}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleCheckboxChange(e, candidate.id!)}
                    className="w-4 h-4 rounded border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500/25"
                  />
                </TableCell>

                {/* Candidat */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10 ring-2 ring-white/50 shadow-sm">
                        <AvatarFallback className={cn(
                          getAvatarColor(candidate.first_name || '', candidate.last_name || ''),
                          "text-white text-sm font-semibold"
                        )}>
                          {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      {new Date(candidate.created_at || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-navy-dark dark:text-sand hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200">
                        {candidate.first_name} {candidate.last_name}
                      </div>
                      
                      {candidate.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <Mail size={11} />
                          <span className="truncate">{candidate.email}</span>
                        </div>
                      )}
                      
                      {candidate.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <Phone size={11} />
                          <span className="truncate">{candidate.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Score */}
                <TableCell className="py-3">
                  {getScoreBadge(candidate.id!)}
                </TableCell>

                {/* Statut */}
                <TableCell className="py-3">
                  {getStatusBadge(candidate.detailed_status || 'initial')}
                </TableCell>

                {/* Entreprise actuelle */}
                <TableCell className="py-3">
                  {candidate.company ? (
                    <div className="flex items-start gap-2">
                      <Building size={14} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      {formatCompanyName(candidate.company)}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Non renseignée</span>
                  )}
                </TableCell>

                {/* Localisation */}
                <TableCell className="py-3">
                  {candidate.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span className="text-sm text-navy-dark dark:text-sand">
                        {formatLocation(candidate.location)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Non renseignée</span>
                  )}
                </TableCell>

                {/* Poste actuel */}
                <TableCell className="py-3">
                  <div className="text-sm font-medium text-navy-dark dark:text-sand">
                    {candidate.position || 'Poste non spécifié'}
                  </div>
                </TableCell>

                {/* Expérience */}
                <TableCell className="hidden xl:table-cell py-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar size={12} />
                    <span>{candidate.years_experience ? `${candidate.years_experience} ans` : 'N/A'}</span>
                  </div>
                </TableCell>

                {/* Compétences */}
                <TableCell className="py-3">
                  <div className="flex flex-wrap gap-1 max-w-sm">
                    {skills.slice(0, 3).map((skill, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs bg-white/60 dark:bg-navy-dark/60 border-purple-200/40 text-muted-foreground px-1.5 py-0.5"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {skills.length > 3 && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 py-0.5"
                      >
                        +{skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Action */}
                <TableCell className="py-3">
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(e, candidate.id!)}
                      className={cn(
                        "h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200",
                        isHovered ? "opacity-100" : "opacity-60"
                      )}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Message si aucun candidat */}
      {candidates.length === 0 && (
        <div className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 text-purple-300 dark:text-purple-700 opacity-50 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 010 7.75" />
              </svg>
            </div>
            <p className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-2">Aucun candidat trouvé</p>
            <p className="text-muted-foreground text-center max-w-md">
              Importez des CV pour commencer à créer des profils de candidats.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernTableView;
