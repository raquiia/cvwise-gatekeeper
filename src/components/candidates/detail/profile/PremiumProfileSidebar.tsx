
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User,
  Target,
  Clock,
  DollarSign,
  Car,
  Mail,
  Phone,
  MapPin,
  Languages,
  Building,
  Calendar,
  Briefcase,
  Star,
  Download,
  Share,
  Heart
} from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';

interface PremiumProfileSidebarProps {
  candidate: CandidateData;
}

const PremiumProfileSidebar: React.FC<PremiumProfileSidebarProps> = ({ candidate }) => {
  const languages = ensureArray<any>(candidate.languages);
  const experiences = ensureArray<any>(candidate.experiences);
  
  // Construire l'adresse complète
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

  // Calculer quelques métriques
  const totalExperience = experiences.length;
  const lastExperience = experiences[0];

  return (
    <div className="space-y-6">
      {/* Card de contact premium */}
      <Card className="border-navy/20 shadow-xl bg-gradient-to-br from-white via-navy/2 to-blue-50/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-3 text-navy-dark">
            <div className="p-2 rounded-xl bg-gradient-to-br from-navy to-navy-dark text-white shadow-lg">
              <User className="w-5 h-5" />
            </div>
            Contact & Identité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Nom avec avatar stylisé */}
          <div className="text-center pb-4 border-b border-navy/10">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-navy to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {candidate.first_name?.charAt(0)}{candidate.last_name?.charAt(0)}
            </div>
            <div className="text-lg font-bold text-navy-dark">
              {candidate.first_name} {candidate.last_name}
            </div>
            {candidate.position && (
              <div className="text-sm text-muted-foreground mt-1">
                {candidate.position}
              </div>
            )}
          </div>

          {/* Contact moderne */}
          <div className="space-y-3">
            {candidate.email && (
              <a 
                href={`mailto:${candidate.email}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-all duration-200 group border border-navy/10 hover:border-navy/20"
              >
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm font-medium text-navy-dark truncate">{candidate.email}</div>
                </div>
              </a>
            )}
            
            {candidate.phone && (
              <a 
                href={`tel:${candidate.phone}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-all duration-200 group border border-navy/10 hover:border-navy/20"
              >
                <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Téléphone</div>
                  <div className="text-sm font-medium text-navy-dark">{candidate.phone}</div>
                </div>
              </a>
            )}
          </div>

          {/* Adresse élégante */}
          {hasStructuredAddress && (
            <div className="bg-white/40 rounded-lg p-4 border border-navy/10">
              <div className="flex items-center gap-2 text-sm mb-2">
                <MapPin className="w-4 h-4 text-navy" />
                <span className="font-medium text-muted-foreground">Adresse</span>
              </div>
              <div className="text-sm text-navy-dark space-y-1 ml-6">
                {addressParts.map((part, idx) => (
                  <div key={idx} className={idx === 0 ? "font-medium" : ""}>
                    {part}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline des expériences */}
      {totalExperience > 0 && (
        <Card className="border-navy/20 shadow-xl bg-gradient-to-br from-white via-purple/2 to-pink-50/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                <Briefcase className="w-4 h-4" />
              </div>
              Parcours Express
              <Badge variant="outline" className="ml-auto bg-purple-50 text-purple-600">
                {totalExperience}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {experiences.slice(0, 3).map((exp: any, idx: number) => (
              <div key={idx} className="relative">
                {idx < 2 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-gradient-to-b from-purple-200 to-transparent"></div>
                )}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Building className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-navy-dark line-clamp-1">
                      {exp.position || exp.title || 'Poste non spécifié'}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {exp.company || 'Entreprise non spécifiée'}
                    </div>
                    {exp.duration && (
                      <div className="text-xs text-purple-600 font-medium mt-1">
                        {exp.duration}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {totalExperience > 3 && (
              <div className="text-center pt-2">
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600">
                  +{totalExperience - 3} autres expériences
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Langues principales */}
      {languages.length > 0 && (
        <Card className="border-navy/20 shadow-xl bg-gradient-to-br from-white via-green/2 to-emerald-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg">
                <Languages className="w-4 h-4" />
              </div>
              Langues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {languages.slice(0, 4).map((lang: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/50 border border-green-100">
                <span className="text-sm font-medium text-navy-dark">
                  {typeof lang === 'string' ? lang : lang.language || 'Langue non spécifiée'}
                </span>
                {lang.level && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                    {lang.level}
                  </Badge>
                )}
              </div>
            ))}
            {languages.length > 4 && (
              <div className="text-center">
                <Badge variant="outline" className="text-xs bg-green-50 text-green-600">
                  +{languages.length - 4} autres langues
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Préférences professionnelles */}
      <Card className="border-navy/20 shadow-xl bg-gradient-to-br from-white via-gold/2 to-yellow-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
            <div className="p-2 rounded-xl bg-gradient-to-br from-gold to-yellow-500 text-white shadow-lg">
              <Target className="w-4 h-4" />
            </div>
            Préférences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidate.salary_expectations && (
            <div className="bg-white/50 rounded-lg p-3 border border-gold/20">
              <div className="text-xs text-muted-foreground mb-1">Salaire souhaité</div>
              <div className="flex items-center gap-2 text-sm font-medium text-navy-dark">
                <DollarSign className="w-3 h-3 text-gold" />
                {candidate.salary_expectations}
              </div>
            </div>
          )}
          
          {candidate.availability && (
            <div className="bg-white/50 rounded-lg p-3 border border-gold/20">
              <div className="text-xs text-muted-foreground mb-1">Disponibilité</div>
              <div className="flex items-center gap-2 text-sm font-medium text-navy-dark">
                <Clock className="w-3 h-3 text-green-600" />
                {candidate.availability}
              </div>
            </div>
          )}
          
          {candidate.mobility && (
            <div className="bg-white/50 rounded-lg p-3 border border-gold/20">
              <div className="text-xs text-muted-foreground mb-1">Mobilité</div>
              <div className="flex items-center gap-2 text-sm font-medium text-navy-dark">
                <Car className="w-3 h-3 text-blue-600" />
                {candidate.mobility}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {candidate.remote_preference && (
              <Badge variant="outline" className="w-full justify-center bg-blue-50 text-blue-600 border-blue-200">
                {candidate.remote_preference}
              </Badge>
            )}
            {candidate.contract_type && (
              <Badge variant="outline" className="w-full justify-center bg-purple-50 text-purple-600 border-purple-200">
                {candidate.contract_type}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card className="border-navy/20 shadow-xl bg-gradient-to-br from-white to-navy/5">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Button variant="outline" size="sm" className="w-full bg-white/70 hover:bg-white transition-all duration-200">
              <Download className="w-4 h-4 mr-2" />
              Télécharger CV
            </Button>
            
            <Button variant="outline" size="sm" className="w-full bg-white/70 hover:bg-white transition-all duration-200">
              <Share className="w-4 h-4 mr-2" />
              Partager profil
            </Button>
            
            <Button variant="outline" size="sm" className="w-full bg-white/70 hover:bg-white transition-all duration-200 text-red-600 border-red-200 hover:bg-red-50">
              <Heart className="w-4 h-4 mr-2" />
              Ajouter aux favoris
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumProfileSidebar;
