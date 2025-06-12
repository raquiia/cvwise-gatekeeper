
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target,
  Clock,
  DollarSign,
  Car
} from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';

interface ProfileSidebarProps {
  candidate: CandidateData;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ candidate }) => {
  return (
    <div className="space-y-4">
      {/* Préférences professionnelles uniquement */}
      <Card className="border-navy/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-navy-dark">
            <Target className="w-4 h-4" />
            Préférences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {candidate.salary_expectations && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Salaire souhaité</div>
              <div className="flex items-center gap-1 text-navy-dark">
                <DollarSign className="w-3 h-3" />
                {candidate.salary_expectations}
              </div>
            </div>
          )}
          {candidate.availability && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Disponibilité</div>
              <div className="flex items-center gap-1 text-navy-dark">
                <Clock className="w-3 h-3" />
                {candidate.availability}
              </div>
            </div>
          )}
          {candidate.mobility && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Mobilité</div>
              <div className="flex items-center gap-1 text-navy-dark">
                <Car className="w-3 h-3" />
                {candidate.mobility}
              </div>
            </div>
          )}
          {candidate.remote_preference && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Télétravail</div>
              <Badge variant="outline" className="text-xs">
                {candidate.remote_preference}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSidebar;
