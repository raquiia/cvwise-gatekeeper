
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Contact, 
  Globe, 
  Languages, 
  Settings, 
  Clock,
  DollarSign,
  Car,
  Target
} from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray, safeString } from '@/utils/candidateUtils';

interface ProfileSidebarProps {
  candidate: CandidateData;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ candidate }) => {
  const languages = ensureArray<any>(candidate.languages);
  const work_authorization = safeString(candidate.work_authorization);

  return (
    <div className="space-y-4">
      {/* Contact détaillé */}
      <Card className="border-navy/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-navy-dark">
            <Contact className="w-4 h-4" />
            Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {candidate.email && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Email</div>
              <div className="text-navy-dark font-medium">{candidate.email}</div>
            </div>
          )}
          {candidate.phone && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Téléphone</div>
              <div className="text-navy-dark font-medium">{candidate.phone}</div>
            </div>
          )}
          {(candidate.address || candidate.city) && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Adresse</div>
              <div className="text-navy-dark">
                {candidate.address && <div>{candidate.address}</div>}
                <div className="flex gap-2">
                  {candidate.postal_code && (
                    <span className="bg-navy/10 px-2 py-0.5 rounded text-xs font-mono">
                      {candidate.postal_code}
                    </span>
                  )}
                  {candidate.city && <span>{candidate.city}</span>}
                </div>
                {candidate.country && <div className="text-muted-foreground">{candidate.country}</div>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Langues */}
      {languages.length > 0 && (
        <Card className="border-navy/10 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-navy-dark">
              <Languages className="w-4 h-4" />
              Langues ({languages.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {languages.slice(0, 4).map((lang: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-navy-dark font-medium">
                  {typeof lang === 'string' ? lang : lang.language || lang.name || 'Langue'}
                </span>
                {lang.level && (
                  <Badge variant="outline" className="text-xs">
                    {lang.level}
                  </Badge>
                )}
              </div>
            ))}
            {languages.length > 4 && (
              <div className="text-xs text-muted-foreground text-center pt-1">
                +{languages.length - 4} autre{languages.length - 4 > 1 ? 's' : ''}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Préférences professionnelles */}
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

      {/* Autorisations */}
      {work_authorization.trim().length > 0 && (
        <Card className="border-navy/10 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-navy-dark">
              <Globe className="w-4 h-4" />
              Autorisations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="text-navy-dark">{work_authorization}</div>
          </CardContent>
        </Card>
      )}

      {/* Métadonnées admin */}
      <Card className="border-navy/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-navy-dark">
            <Settings className="w-4 h-4" />
            Administration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {candidate.profile_completeness !== undefined && (
            <div>
              <div className="text-muted-foreground mb-1">Complétude</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-navy h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${candidate.profile_completeness}%` }}
                  ></div>
                </div>
                <span className="text-navy font-medium">
                  {candidate.profile_completeness}%
                </span>
              </div>
            </div>
          )}
          {candidate.created_at && (
            <div>
              <div className="text-muted-foreground mb-1">Créé le</div>
              <div className="text-navy-dark">
                {new Date(candidate.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSidebar;
