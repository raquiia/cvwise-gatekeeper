
import React from 'react';
import { User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

interface CandidateCardProps {
  candidate: ExtendedCandidateMatch;
  onViewCandidate: (candidateId: string) => void;
  renderMatchedSkills: (item: ExtendedCandidateMatch) => React.ReactNode;
}

export const CandidateCard = ({ 
  candidate, 
  onViewCandidate, 
  renderMatchedSkills 
}: CandidateCardProps) => {
  // Safe access for score values with fallbacks
  const overallScore = candidate.match?.match_score || candidate.score || 0;
  const skillsScore = candidate.match?.skills_match_score || 
                     (candidate.details?.skills?.matchPercentage || 0);
  const experienceScore = candidate.match?.experience_match_score || 
                         (candidate.details?.experienceLevel?.match ? 100 : 50);
  const educationScore = candidate.match?.education_match_score || 
                        (candidate.details?.educationLevel?.match ? 100 : 0);
  const locationScore = candidate.match?.location_match_score || 
                       (candidate.details?.location?.match ? 100 : 0);
                       
  return (
    <Card key={candidate.candidateId} className="overflow-hidden">
      <div className="flex">
        <div className="w-24 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{overallScore}%</div>
            <div className="text-xs text-blue-100">Match</div>
          </div>
        </div>
        
        <CardContent className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold">
                {candidate.firstName} {candidate.lastName}
              </h3>
              <p className="text-gray-600">{candidate.position || candidate.candidate?.position || 'Aucun poste spécifié'}</p>
              <p className="text-sm text-gray-500 mt-1">{candidate.candidate?.location || 'Aucune localisation'}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                <div>
                  <div className="text-sm text-gray-500">Compétences</div>
                  <div className="flex items-center mt-1">
                    <Progress value={skillsScore} className="h-2 flex-1 mr-2" />
                    <span className="text-sm font-medium">{skillsScore}%</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Expérience</div>
                  <div className="flex items-center mt-1">
                    <Progress value={experienceScore} className="h-2 flex-1 mr-2" />
                    <span className="text-sm font-medium">{experienceScore}%</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Éducation</div>
                  <div className="flex items-center mt-1">
                    <Progress value={educationScore} className="h-2 flex-1 mr-2" />
                    <span className="text-sm font-medium">{educationScore}%</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Localisation</div>
                  <div className="flex items-center mt-1">
                    <Progress value={locationScore} className="h-2 flex-1 mr-2" />
                    <span className="text-sm font-medium">{locationScore}%</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <h4 className="text-sm font-semibold mb-1">Compétences correspondantes:</h4>
                <div className="flex flex-wrap gap-1">
                  {renderMatchedSkills(candidate)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default CandidateCard;
