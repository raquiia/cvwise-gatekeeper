
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, TrendingUp, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';
import { calculateCandidateScore, getScoreEvaluation } from '@/services/scoring/candidateScoring';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { candidateService } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateFormatter';

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

  const getStatusBadge = (status: string) => {
    const statusLabel = CANDIDATE_STATUS_LABELS[status] || status;
    
    switch (status) {
      case 'initial':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">{statusLabel}</Badge>;
      case 'contact':
        return <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50">{statusLabel}</Badge>;
      case 'prequalification':
        return <Badge variant="outline" className="border-purple-200 text-purple-800 bg-purple-50">{statusLabel}</Badge>;
      case 'ec1':
        return <Badge variant="outline" className="border-orange-200 text-orange-800 bg-orange-50">{statusLabel}</Badge>;
      case 'ec2':
        return <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50">{statusLabel}</Badge>;
      case 'presentation_client':
        return <Badge variant="outline" className="border-indigo-200 text-indigo-800 bg-indigo-50">{statusLabel}</Badge>;
      case 'en_mission':
        return <Badge variant="default" className="bg-green-100 text-green-800">{statusLabel}</Badge>;
      case 'refus':
        return <Badge variant="destructive">{statusLabel}</Badge>;
      case 'ancien_employe':
        return <Badge variant="outline" className="border-emerald-200 text-emerald-800 bg-emerald-50">{statusLabel}</Badge>;
      default:
        return <Badge variant="secondary">{statusLabel}</Badge>;
    }
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
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {candidates.map((candidate) => {
        const skills = ensureStringArray(candidate.skills);
        const scoreBreakdown = calculateCandidateScore(candidate);
        const evaluation = getScoreEvaluation(scoreBreakdown.overall);
        
        return (
          <Card 
            key={candidate.id} 
            className="group hover:shadow-lg transition-all duration-300 border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm hover:-translate-y-1 cursor-pointer"
            onClick={() => onViewCandidate(candidate.id!)}
          >
            <CardContent className="p-6">
              {/* Header with Avatar and Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg font-semibold">
                    {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-dark dark:text-sand">
                      {candidate.first_name} {candidate.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {candidate.position || 'Poste non spécifié'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(candidate.detailed_status || 'initial')}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(scoreBreakdown.overall)}`}>
                    {scoreBreakdown.overall}%
                  </div>
                </div>
              </div>

              {/* Company and Location */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp size={14} className="mr-2" />
                  {candidate.company || 'Entreprise non spécifiée'}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin size={14} className="mr-2" />
                  {candidate.location || 'Localisation non spécifiée'}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar size={14} className="mr-2" />
                  {candidate.years_experience ? `${candidate.years_experience} ans d'exp.` : 'Expérience non spécifiée'}
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {skills.slice(0, 3).map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {skills.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{skills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              {(candidate.email || candidate.phone) && (
                <div className="space-y-1 mb-4 text-xs text-muted-foreground">
                  {candidate.email && (
                    <div className="flex items-center">
                      <Mail size={12} className="mr-1" />
                      {candidate.email}
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center">
                      <Phone size={12} className="mr-1" />
                      {candidate.phone}
                    </div>
                  )}
                </div>
              )}

              {/* Last Updated */}
              <div className="text-xs text-muted-foreground mb-4">
                Mis à jour: {formatDate(candidate.updated_at || candidate.created_at || '')}
              </div>

              {/* Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewCandidate(candidate.id!);
                  }}
                  className="h-8 w-8 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20"
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
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CandidatesCardView;
