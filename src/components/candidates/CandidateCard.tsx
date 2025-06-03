import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Edit, 
  Trash2, 
  Eye,
  Star,
  Clock,
  Award,
  Briefcase,
  Mail,
  Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';
import { calculateCandidateScore, getScoreEvaluation } from '@/services/scoring/candidateScoring';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { candidateService } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateFormatter';
import { cn } from '@/lib/utils';

interface CandidateCardProps {
  candidate: CandidateData;
  onViewCandidate?: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
  isSelected?: boolean;
  onSelect?: (candidateId: string, selected: boolean) => void;
  hideScore?: boolean;
  scoreIsMatchScore?: boolean;
  matchDetails?: any;
  index?: number;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ 
  candidate,
  onViewCandidate,
  onCandidateDeleted,
  isSelected = false,
  onSelect,
  hideScore = false,
  scoreIsMatchScore = false,
  matchDetails,
  index = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const skills = ensureStringArray(candidate.skills);
  const { toast } = useToast();
  
  // Calcul du score intelligent
  const scoreBreakdown = calculateCandidateScore(candidate);
  const evaluation = getScoreEvaluation(scoreBreakdown.overall);

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

  const getStatusBadge = (status: string) => {
    const statusLabel = CANDIDATE_STATUS_LABELS[status] || status;
    
    const statusConfig = {
      initial: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: Clock, 
        pulse: false 
      },
      contact: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: Phone, 
        pulse: true 
      },
      prequalification: { 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        icon: Award, 
        pulse: true 
      },
      ec1: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: Star, 
        pulse: true 
      },
      ec2: { 
        color: 'bg-amber-100 text-amber-800 border-amber-200', 
        icon: Star, 
        pulse: true 
      },
      presentation_client: { 
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200', 
        icon: Briefcase, 
        pulse: true 
      },
      en_mission: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: TrendingUp, 
        pulse: false 
      },
      refus: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: Clock, 
        pulse: false 
      },
      ancien_employe: { 
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
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
          'border text-xs font-medium flex items-center gap-1 transition-all duration-300',
          config.pulse && 'animate-pulse'
        )}
      >
        <Icon size={12} />
        {statusLabel}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const handleDelete = async () => {
    if (!candidate.id) return;
    
    setIsDeleting(true);
    try {
      await candidateService.deleteCandidate(candidate.id, true);
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
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelect = () => {
    if (onSelect && candidate.id) {
      onSelect(candidate.id, !isSelected);
    }
  };

  // Animation delay basée sur l'index
  const animationDelay = `${index * 50}ms`;

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-500 ease-out hover:shadow-2xl hover:shadow-purple-500/20",
        "border border-purple-100/50 dark:border-purple-800/30",
        "bg-gradient-to-br from-white/90 to-purple-50/30 dark:from-navy-dark/90 dark:to-purple-950/30",
        "backdrop-blur-sm hover:scale-[1.02] transform-gpu",
        isSelected && "ring-2 ring-purple-500 shadow-lg shadow-purple-500/25",
        isHovered && "border-purple-300/50 dark:border-purple-600/50"
      )}
      style={{ animationDelay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/20 to-transparent",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        "dark:from-transparent dark:via-purple-900/10 dark:to-transparent"
      )} />
      
      {/* Selection checkbox */}
      {onSelect && (
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className={cn(
              "w-4 h-4 rounded border-2 border-purple-300 text-purple-600",
              "focus:ring-2 focus:ring-purple-500/25 transition-all duration-200",
              "checked:bg-purple-600 checked:border-purple-600"
            )}
          />
        </div>
      )}

      {/* Status badge - Top right */}
      <div className="absolute top-4 right-4 z-10">
        {getStatusBadge(candidate.detailed_status || 'initial')}
      </div>

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start gap-4">
          {/* Avatar avec gradient */}
          <div className="relative">
            <Avatar className="w-16 h-16 ring-2 ring-white/50 shadow-lg">
              <AvatarFallback className={cn(
                getAvatarColor(candidate.first_name || '', candidate.last_name || ''),
                "text-white text-lg font-bold shadow-inner"
              )}>
                {candidate.first_name?.[0]}{candidate.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            
            {/* Score badge sur l'avatar */}
            {!hideScore && (
              <div className={cn(
                "absolute -bottom-2 -right-2 w-8 h-8 rounded-full text-xs font-bold",
                "flex items-center justify-center text-white shadow-lg",
                "bg-gradient-to-r", getScoreGradient(scoreBreakdown.overall)
              )}>
                {scoreBreakdown.overall}
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Name and position */}
            <div className="mb-3">
              <Link 
                to={`/candidates/${candidate.id}`}
                className="group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-navy-dark dark:text-sand truncate">
                  {candidate.first_name} {candidate.last_name}
                </h3>
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground truncate">
                  {candidate.position || 'Poste non spécifié'}
                </p>
                {candidate.company && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <p className="text-sm text-muted-foreground truncate">
                      {candidate.company}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap gap-4 mb-3 text-sm text-muted-foreground">
              {candidate.email && (
                <div className="flex items-center gap-1">
                  <Mail size={12} />
                  <span className="truncate">{candidate.email}</span>
                </div>
              )}
              {candidate.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={12} />
                  <span>{candidate.location}</span>
                </div>
              )}
              {candidate.years_experience && (
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{candidate.years_experience} ans</span>
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 4).map((skill, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs bg-white/50 dark:bg-navy-dark/50 border-purple-200/50 hover:bg-purple-50"
                  >
                    {skill}
                  </Badge>
                ))}
                {skills.length > 4 && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
                  >
                    +{skills.length - 4}
                  </Badge>
                )}
              </div>
            </div>

            {/* Bottom info and actions */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Mis à jour {formatDate(candidate.updated_at || candidate.created_at || '')}
              </div>

              {/* Actions - appear on hover */}
              <div className={cn(
                "flex items-center gap-1 transition-all duration-300",
                isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
              )}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewCandidate && onViewCandidate(candidate.id!)}
                  className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                >
                  <Eye size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewCandidate && onViewCandidate(candidate.id!)}
                  className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Shine effect on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
        "bg-gradient-to-r from-transparent via-white/20 to-transparent",
        "transform -skew-x-12 -translate-x-full group-hover:translate-x-full",
        "transition-transform duration-1000 ease-out"
      )} />
    </Card>
  );
};

export default CandidateCard;
