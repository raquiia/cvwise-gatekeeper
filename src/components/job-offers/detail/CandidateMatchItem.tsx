
import React, { useState } from 'react';
import { CandidateMatch } from '@/services/data/candidate-matching/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, User } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CandidateMatchItemProps {
  match: CandidateMatch;
  onViewCandidate: (candidateId: string) => void;
  jobId: string;
  renderMatchedSkills: (candidateId: string, jobOfferId: string) => React.ReactNode;
  renderMissingSkills: (candidateId: string, jobOfferId: string) => React.ReactNode;
}

const CandidateMatchItem: React.FC<CandidateMatchItemProps> = ({
  match,
  onViewCandidate,
  jobId,
  renderMatchedSkills,
  renderMissingSkills
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const formatName = () => {
    // Try multiple possible name fields from the CandidateMatch structure
    const firstName = match.first_name || match.firstName || '';
    const lastName = match.last_name || match.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Candidat sans nom';
  };
  
  const getPosition = () => {
    return match.position || 'Poste non spécifié';
  };
  
  const getCompany = () => {
    return match.company || '';
  };

  const getScore = () => {
    return match.match_score || match.score || 0;
  };
  
  const getScoreClass = () => {
    const score = getScore();
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (score >= 60) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getCandidateId = () => {
    return match.candidate_id || match.candidateId || '';
  };

  return (
    <Card className="overflow-hidden border border-gray-200">
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-lg font-medium">{formatName()}</CardTitle>
          <CardDescription className="flex items-center gap-1">
            {getPosition()}
            {getCompany() && (
              <>
                <span className="text-gray-500">•</span>
                <span>{getCompany()}</span>
              </>
            )}
          </CardDescription>
        </div>
        <Badge className={`text-sm font-semibold ${getScoreClass()}`}>
          {getScore()}%
        </Badge>
      </CardHeader>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full flex items-center justify-between p-2">
            <span>{isOpen ? 'Masquer les détails' : 'Voir les détails'}</span>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Compétences correspondantes</p>
                <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-900/30">
                  {renderMatchedSkills(getCandidateId(), jobId)}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Compétences manquantes</p>
                <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-900/30">
                  {renderMissingSkills(getCandidateId(), jobId)}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
      
      <CardFooter className="p-2 bg-gray-50 dark:bg-gray-900/10 flex justify-end">
        <Button 
          size="sm" 
          onClick={() => onViewCandidate(getCandidateId())}
          className="gap-2"
        >
          <User className="h-4 w-4" />
          Voir le profil
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CandidateMatchItem;
