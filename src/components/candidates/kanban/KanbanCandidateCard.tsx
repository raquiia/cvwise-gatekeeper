import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';
import { calculateCandidateScore } from '@/services/scoring/candidateScoring';
import { candidateService } from '@/services/data/candidateService';
import { useToast } from '@/hooks/use-toast';
import StatusSelector from '../detail/StatusSelector';

interface KanbanCandidateCardProps {
  candidate: CandidateData;
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
  onCandidateUpdated?: () => void; // NEW: Add callback for updates
  isDragging?: boolean;
}

const KanbanCandidateCard: React.FC<KanbanCandidateCardProps> = ({
  candidate,
  onViewCandidate,
  onCandidateDeleted,
  onCandidateUpdated,
  isDragging = false
}) => {
  const { toast } = useToast();
  const skills = ensureStringArray(candidate.skills);
  const scoreBreakdown = calculateCandidateScore(candidate);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!candidate.id) return;
    
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
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    console.log(`Status changed for candidate ${candidate.id}: ${newStatus}`);
    // Trigger immediate refresh of kanban data
    if (onCandidateUpdated) {
      await onCandidateUpdated();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Card 
      className={`group cursor-pointer border-purple-200/30 dark:border-purple-800/20 bg-white/90 dark:bg-navy-dark/90 backdrop-blur-sm hover:shadow-md transition-all duration-200 ${
        isDragging ? 'rotate-3 shadow-lg' : ''
      }`}
      onClick={() => onViewCandidate(candidate.id!)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
              {candidate.first_name?.[0]}{candidate.last_name?.[0]}
            </div>
            <div>
              <h4 className="font-medium text-sm text-navy-dark dark:text-sand">
                {candidate.first_name} {candidate.last_name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {candidate.position || 'Poste non spécifié'}
              </p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(scoreBreakdown.overall)}`}>
            {scoreBreakdown.overall}%
          </div>
        </div>

        {/* Status Selector with immediate refresh */}
        <div className="mb-3">
          <StatusSelector 
            candidateId={candidate.id!}
            currentStatus={candidate.detailed_status}
            onStatusChange={handleStatusChange}
            onDataRefresh={onCandidateUpdated}
          />
        </div>

        {/* Company and Location */}
        <div className="space-y-1 mb-3 text-xs text-muted-foreground">
          <div className="flex items-center">
            <MapPin size={10} className="mr-1" />
            {candidate.location || 'Non spécifié'}
          </div>
          <div className="flex items-center">
            <Calendar size={10} className="mr-1" />
            {candidate.years_experience ? `${candidate.years_experience} ans` : 'Exp. NS'}
          </div>
        </div>

        {/* Skills */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 2).map((skill, idx) => (
              <Badge key={idx} variant="outline" className="text-xs py-0">
                {skill}
              </Badge>
            ))}
            {skills.length > 2 && (
              <Badge variant="secondary" className="text-xs py-0">
                +{skills.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Contact Info */}
        {(candidate.email || candidate.phone) && (
          <div className="space-y-1 mb-3 text-xs text-muted-foreground">
            {candidate.email && (
              <div className="flex items-center truncate">
                <Mail size={10} className="mr-1" />
                <span className="truncate">{candidate.email}</span>
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center">
                <Phone size={10} className="mr-1" />
                {candidate.phone}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewCandidate(candidate.id!);
            }}
            className="h-6 w-6 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            <Edit size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanCandidateCard;
