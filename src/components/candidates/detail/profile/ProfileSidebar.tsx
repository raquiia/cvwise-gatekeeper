
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  Target,
  Clock,
  DollarSign,
  Car,
  Mail,
  Phone,
  MapPin,
  Languages
} from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';

interface ProfileSidebarProps {
  candidate: CandidateData;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ candidate }) => {
  const languages = ensureArray<any>(candidate.languages);
  
  // Construire l'adresse complète pour la sidebar
  const getFullAddress = () => {
    const addressParts = [];
    
    if (candidate.address?.trim()) {
      addressParts.push(candidate.address.trim());
    }
    
    const cityPostal = [candidate.postal_code?.trim(), candidate.city?.trim()].filter(Boolean);
    if (cityPostal.length > 0) {
      addressParts.push(cityPostal.join(' '));
    }
    
    if (candidate.country?.trim() && candidate.country.trim() !== candidate.city?.trim()) {
      addressParts.push(candidate.country.trim());
    }
    
    return addressParts;
  };

  const addressParts = getFullAddress();
  const hasStructuredAddress = addressParts.length > 0;

  return (
    <div className="space-y-6">
      {/* Identité et Contact */}
      <Card className="border-navy/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
            <div className="p-2 rounded-lg bg-navy/10 text-navy">
              <User className="w-5 h-5" />
            </div>
            Identité & Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nom complet */}
          <div>
            <div className="text-xl font-semibold text-navy-dark">
              {candidate.first_name} {candidate.last_name}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3 text-sm">
            {candidate.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-navy" />
                <span className="text-navy-dark">{candidate.email}</span>
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-navy" />
                <span className="text-navy-dark">{candidate.phone}</span>
              </div>
            )}
          </div>

          {/* Adresse complète */}
          {hasStructuredAddress && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-navy" />
                <span className="font-medium text-muted-foreground">Adresse</span>
              </div>
              <div className="text-sm text-navy-dark ml-6 space-y-1">
                {addressParts.map((part, idx) => (
                  <div key={idx} className={idx === 0 ? "font-medium" : ""}>
                    {part}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Localisation alternative si pas d'adresse structurée */}
          {!hasStructuredAddress && candidate.location?.trim() && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-navy" />
                <span className="font-medium text-muted-foreground">Localisation</span>
              </div>
              <div className="text-sm text-navy-dark ml-6">
                {candidate.location.trim()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Langues principales */}
      {languages.length > 0 && (
        <Card className="border-navy/10 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-navy-dark">
              <Languages className="w-4 h-4" />
              Langues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {languages.slice(0, 4).map((lang: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-navy-dark">
                  {typeof lang === 'string' ? lang : lang.language || 'Langue non spécifiée'}
                </span>
                {lang.level && (
                  <Badge variant="outline" className="text-xs">
                    {lang.level}
                  </Badge>
                )}
              </div>
            ))}
            {languages.length > 4 && (
              <div className="text-xs text-muted-foreground">
                +{languages.length - 4} autres langues
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
          {candidate.contract_type && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Type de contrat</div>
              <Badge variant="outline" className="text-xs">
                {candidate.contract_type}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSidebar;
