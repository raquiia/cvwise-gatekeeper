
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Calendar, TrendingUp, Edit, Trash2, Mail, Phone, Building, Star } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';
import { calculateCandidateScore, getScoreEvaluation } from '@/services/scoring/candidateScoring';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { candidateService } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateFormatter';
import { cn } from '@/lib/utils';

interface CandidatesCardViewProps {
  candidates: CandidateData[];
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
}

const CandidatesCardView: React.FC<CandidatesCardViewProps> = ({
  candidates,
  onViewCandidate,
  onCandidateDeleted
}) => {
  const { toast } = useToast();

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
        gradient: 'from-gray-50 to-gray-100',
        pulse: false 
      },
      contact: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        gradient: 'from-blue-50 to-blue-100',
        pulse: true 
      },
      prequalification: { 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        gradient: 'from-purple-50 to-purple-100',
        pulse: true 
      },
      ec1: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        gradient: 'from-orange-50 to-orange-100',
        pulse: true 
      },
      ec2: { 
        color: 'bg-amber-100 text-amber-800 border-amber-200', 
        gradient: 'from-amber-50 to-amber-100',
        pulse: true 
      },
      presentation_client: { 
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200', 
        gradient: 'from-indigo-50 to-indigo-100',
        pulse: true 
      },
      en_mission: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        gradient: 'from-green-50 to-green-100',
        pulse: false 
      },
      refus: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        gradient: 'from-red-50 to-red-100',
        pulse: false 
      },
      ancien_employe: { 
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
        gradient: 'from-emerald-50 to-emerald-100',
        pulse: false 
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.initial;

    return (
      <Badge 
        variant="outline" 
        className={cn(
          config.color,
          'border text-xs font-medium px-3 py-1 shadow-sm',
          config.pulse && 'animate-pulse'
        )}
      >
        {statusLabel}
      </Badge>
    );
  };

  const handleDelete = async (candidateId: string) => {
    if (!candidateId) return;
    
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
    if (score >= 60) return 'text-amber-600 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
    return 'text-red-600 bg-gradient-to-r from-red-50 to-rose-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Star className="w-3 h-3 fill-current" />;
    if (score >= 60) return <Star className="w-3 h-3" />;
    return null;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {candidates.map((candidate, index) => {
        const skills = ensureStringArray(candidate.skills);
        const scoreBreakdown = calculateCandidateScore(candidate);
        const animationDelay = `${index * 100}ms`;
        
        return (
          <Card 
            key={candidate.id} 
            className={cn(
              "group relative overflow-hidden transition-all duration-500 ease-out",
              "hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2",
              "border border-purple-100/50 dark:border-purple-800/30",
              "bg-gradient-to-br from-white/90 via-white/80 to-purple-50/30",
              "dark:from-navy-dark/90 dark:via-navy-dark/80 dark:to-purple-950/30",
              "backdrop-blur-sm cursor-pointer transform-gpu",
              "animate-in fade-in-0 slide-in-from-bottom-4"
            )}
            style={{ animationDelay }}
            onClick={() => onViewCandidate(candidate.id!)}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500 to-cyan-500 rounded-full blur-2xl transform -translate-x-12 translate-y-12" />
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            </div>

            <CardContent className="p-6 relative z-10">
              {/* Header avec avatar et score */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-14 h-14 ring-2 ring-white/60 shadow-lg group-hover:ring-purple-300/50 transition-all duration-300">
                      <AvatarFallback className={cn(
                        getAvatarColor(candidate.first_name || '', candidate.last_name || ''),
                        "text-white text-lg font-bold shadow-inner"
                      )}>
                        {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Badge "nouveau" si récent */}
                    {new Date(candidate.created_at || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg text-navy-dark dark:text-sand group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-300 truncate">
                      {candidate.first_name} {candidate.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium truncate">
                      {candidate.position || 'Poste non spécifié'}
                    </p>
                  </div>
                </div>
                
                {/* Score badge moderne */}
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-bold border shadow-sm flex items-center gap-1.5",
                  "transition-all duration-300 group-hover:scale-105",
                  getScoreColor(scoreBreakdown.overall)
                )}>
                  {getScoreIcon(scoreBreakdown.overall)}
                  {scoreBreakdown.overall}%
                </div>
              </div>

              {/* Status badge */}
              <div className="mb-4">
                {getStatusBadge(candidate.detailed_status || 'initial')}
              </div>

              {/* Informations principales */}
              <div className="space-y-3 mb-4">
                {candidate.company && (
                  <div className="flex items-center text-sm text-muted-foreground bg-white/40 dark:bg-navy-dark/40 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <Building size={14} className="mr-2 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <span className="truncate font-medium">{candidate.company}</span>
                  </div>
                )}
                
                {candidate.location && (
                  <div className="flex items-center text-sm text-muted-foreground bg-white/40 dark:bg-navy-dark/40 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <MapPin size={14} className="mr-2 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <span className="truncate">{candidate.location}</span>
                  </div>
                )}
                
                {candidate.years_experience && (
                  <div className="flex items-center text-sm text-muted-foreground bg-white/40 dark:bg-navy-dark/40 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <Calendar size={14} className="mr-2 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <span>{candidate.years_experience} ans d'expérience</span>
                  </div>
                )}
              </div>

              {/* Compétences avec design moderne */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Compétences</h4>
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 3).map((skill, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-xs bg-gradient-to-r from-white/60 to-purple-50/60 dark:from-navy-dark/60 dark:to-purple-950/60 border-purple-200/50 hover:border-purple-300/70 transition-all duration-200 font-medium"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {skills.length > 3 && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 dark:from-purple-900/50 dark:to-indigo-900/50 dark:text-purple-300 font-medium"
                    >
                      +{skills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact moderne */}
              {(candidate.email || candidate.phone) && (
                <div className="space-y-2 mb-4">
                  {candidate.email && (
                    <div className="flex items-center text-xs text-muted-foreground bg-blue-50/50 dark:bg-blue-950/20 rounded-md px-2 py-1.5">
                      <Mail size={11} className="mr-1.5 text-blue-600 dark:text-blue-400" />
                      <span className="truncate">{candidate.email}</span>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center text-xs text-muted-foreground bg-green-50/50 dark:bg-green-950/20 rounded-md px-2 py-1.5">
                      <Phone size={11} className="mr-1.5 text-green-600 dark:text-green-400" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Footer avec date et actions */}
              <div className="flex items-center justify-between pt-3 border-t border-purple-100/30 dark:border-purple-800/20">
                <div className="text-xs text-muted-foreground">
                  {formatDate(candidate.updated_at || candidate.created_at || '')}
                </div>

                {/* Actions avec effet hover moderne */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewCandidate(candidate.id!);
                    }}
                    className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full transition-all duration-200"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(candidate.id!);
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-all duration-200"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CandidatesCardView;
