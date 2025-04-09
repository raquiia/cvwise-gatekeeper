
import React from 'react';
import { User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

interface ExperienceMatchCandidateCardProps {
  candidate: ExtendedCandidateMatch;
  onViewCandidate: (candidateId: string) => void;
  jobOfferExperienceMin: number;
  jobOfferExperienceMax?: number;
}

const ExperienceMatchCandidateCard = ({ 
  candidate, 
  onViewCandidate,
  jobOfferExperienceMin,
  jobOfferExperienceMax
}: ExperienceMatchCandidateCardProps) => {
  return (
    <Card key={candidate.candidateId}>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold">
              {candidate.firstName} {candidate.lastName}
            </h3>
            <p className="text-gray-600">{candidate.position || candidate.candidate?.position || 'Aucun poste spécifié'}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {candidate.candidate?.years_experience || 0} an{candidate.candidate?.years_experience !== 1 ? 's' : ''} d'expérience
              </span>
              <Badge variant="secondary">
                {candidate.match?.experience_match_score || (candidate.details?.experienceLevel.match ? 100 : 50)}%
              </Badge>
            </div>
            <div className="mt-2">
              <Button 
                size="sm" 
                onClick={() => onViewCandidate(candidate.candidateId)}
                className="gap-1"
              >
                <User size={14} />
                Voir profil
              </Button>
            </div>
          </div>
          
          <div className="md:col-span-4">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">Match d'expérience</span>
                <span className="font-bold text-lg">{candidate.match?.experience_match_score || (candidate.details?.experienceLevel.match ? 100 : 50)}%</span>
              </div>
              <Progress value={candidate.match?.experience_match_score || (candidate.details?.experienceLevel.match ? 100 : 50)} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-1">Expérience du candidat:</h4>
                <p className="text-sm">
                  {candidate.candidate?.years_experience || 0} an{candidate.candidate?.years_experience !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {candidate.candidate?.experiences && Array.isArray(candidate.candidate.experiences) && candidate.candidate.experiences.length > 0 
                    ? `${candidate.candidate.experiences.length} expérience(s) professionnelle(s)` 
                    : 'Aucune expérience détaillée'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-1">Expérience requise:</h4>
                <p className="text-sm">
                  {jobOfferExperienceMin || 0} - {jobOfferExperienceMax || '∞'} ans
                </p>
              </div>
            </div>
            
            <div className="mt-3">
              <h4 className="text-sm font-semibold mb-1">Autres scores:</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-xs text-gray-500">Global: {candidate.match?.match_score || candidate.score}%</div>
                  <Progress value={candidate.match?.match_score || candidate.score} className="h-1 mt-1" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Compétences: {candidate.match?.skills_match_score || candidate.details?.skills.matchPercentage || 0}%</div>
                  <Progress value={candidate.match?.skills_match_score || candidate.details?.skills.matchPercentage || 0} className="h-1 mt-1" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Éducation: {candidate.match?.education_match_score || (candidate.details?.educationLevel.match ? 100 : 0)}%</div>
                  <Progress value={candidate.match?.education_match_score || (candidate.details?.educationLevel.match ? 100 : 0)} className="h-1 mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperienceMatchCandidateCard;
