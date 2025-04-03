
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { MatchResult } from '@/services/analysis/matchingUtils';
import { CandidateData } from '@/services/data/resumeDataService';
import { Briefcase, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SimilarCandidatesProps {
  candidates: (CandidateData & { similarityScore: number })[];
  className?: string;
}

const SimilarCandidates: React.FC<SimilarCandidatesProps> = ({ 
  candidates,
  className 
}) => {
  const navigate = useNavigate();
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 dark:text-green-500";
    if (score >= 70) return "text-amber-600 dark:text-amber-500";
    return "text-red-600 dark:text-red-500";
  };
  
  if (!candidates || candidates.length === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            Profils similaires
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-3">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <User size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Aucun profil similaire trouvé
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          Profils similaires
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-3">
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <div 
              key={candidate.id} 
              className="p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-navy text-sand">
                    {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">
                      {candidate.first_name} {candidate.last_name}
                    </h3>
                    
                    <Badge className={cn(
                      "ml-2", 
                      getScoreColor(candidate.similarityScore)
                    )}>
                      {candidate.similarityScore}% similaire
                    </Badge>
                  </div>
                  
                  <div className="mt-1 flex flex-col space-y-1">
                    {candidate.position && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Briefcase size={14} className="mr-1.5" />
                        <span>{candidate.position}</span>
                      </div>
                    )}
                    
                    {candidate.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin size={14} className="mr-1.5" />
                        <span>{candidate.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {candidate.skills.slice(0, 3).map((skill, index) => (
                        <Badge 
                          key={`skill-${candidate.id}-${index}`}
                          variant="outline"
                          className="text-xs bg-background"
                        >
                          {skill}
                        </Badge>
                      ))}
                      
                      {candidate.skills.length > 3 && (
                        <Badge 
                          variant="outline"
                          className="text-xs bg-background"
                        >
                          +{candidate.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/candidates/${candidate.id}`)}
                >
                  Voir le profil
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimilarCandidates;
