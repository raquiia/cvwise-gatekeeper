
import React from 'react';
import { User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

interface SkillsMatchCandidateCardProps {
  candidate: ExtendedCandidateMatch;
  onViewCandidate: (candidateId: string) => void;
  renderMatchedSkills: (item: ExtendedCandidateMatch) => React.ReactNode;
  renderMissingSkills: (item: ExtendedCandidateMatch) => React.ReactNode;
}

const SkillsMatchCandidateCard = ({ 
  candidate, 
  onViewCandidate, 
  renderMatchedSkills,
  renderMissingSkills
}: SkillsMatchCandidateCardProps) => {
  // Safe access with fallbacks
  const skillsScore = candidate.match?.skills_match_score || 
                     (candidate.details?.skills?.matchPercentage || 0);
  const overallScore = candidate.match?.match_score || candidate.score || 0;
  const experienceScore = candidate.match?.experience_match_score || 
                         (candidate.details?.experienceLevel?.match ? 100 : 50);
  const educationScore = candidate.match?.education_match_score || 
                        (candidate.details?.educationLevel?.match ? 100 : 0);
  
  return (
    <Card key={candidate.candidateId}>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              {candidate.firstName} {candidate.lastName}
            </h3>
            <p className="text-gray-600">{candidate.position || candidate.candidate?.position || 'Aucun poste spécifié'}</p>
            <p className="text-sm text-gray-500">{candidate.candidate?.location || 'Aucune localisation'}</p>
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
          
          <div className="md:col-span-3">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">Match de compétences</span>
                <span className="font-bold text-lg">{skillsScore}%</span>
              </div>
              <Progress value={skillsScore} className="h-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Compétences correspondantes:</h4>
                <div className="flex flex-wrap gap-1">
                  {renderMatchedSkills(candidate)}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-2">Compétences manquantes:</h4>
                <div className="flex flex-wrap gap-1">
                  {renderMissingSkills(candidate)}
                </div>
              </div>
            </div>
            
            <div className="mt-3">
              <h4 className="text-sm font-semibold mb-1">Autres scores:</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-xs text-gray-500">Global: {overallScore}%</div>
                  <Progress value={overallScore} className="h-1 mt-1" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Expérience: {experienceScore}%</div>
                  <Progress value={experienceScore} className="h-1 mt-1" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Éducation: {educationScore}%</div>
                  <Progress value={educationScore} className="h-1 mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillsMatchCandidateCard;
