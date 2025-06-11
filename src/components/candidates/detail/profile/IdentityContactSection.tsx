
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';

interface IdentityContactSectionProps {
  candidate: CandidateData;
}

const IdentityContactSection: React.FC<IdentityContactSectionProps> = ({ candidate }) => {
  // Debug logging pour vérifier les données d'adresse
  console.log('IdentityContactSection - Address data verification:', {
    candidateId: candidate.id,
    address: candidate.address,
    postal_code: candidate.postal_code,
    city: candidate.city,
    country: candidate.country,
    location: candidate.location,
    addressExists: !!candidate.address,
    postalCodeExists: !!candidate.postal_code,
    cityExists: !!candidate.city,
    countryExists: !!candidate.country
  });

  // Vérifier si nous avons des informations d'adresse structurées
  const hasStructuredAddress = candidate.address || candidate.postal_code || candidate.city || candidate.country;
  
  return (
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

        {/* Contact - Layout compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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

        {/* Adresse complète - Affichage amélioré */}
        {hasStructuredAddress && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-navy" />
              <span className="font-medium text-muted-foreground">Adresse</span>
            </div>
            <div className="text-sm text-navy-dark ml-6 space-y-1">
              {/* Adresse (rue) */}
              {candidate.address && candidate.address.trim() && (
                <div className="font-medium">{candidate.address.trim()}</div>
              )}
              
              {/* Code postal et ville sur la même ligne */}
              {(candidate.postal_code || candidate.city) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {candidate.postal_code && candidate.postal_code.trim() && (
                    <span className="bg-navy/10 px-2 py-0.5 rounded font-mono text-xs">
                      {candidate.postal_code.trim()}
                    </span>
                  )}
                  {candidate.city && candidate.city.trim() && (
                    <span className="font-medium">{candidate.city.trim()}</span>
                  )}
                </div>
              )}
              
              {/* Pays sur une ligne séparée si différent de la ville */}
              {candidate.country && candidate.country.trim() && 
               candidate.country.trim() !== candidate.city?.trim() && (
                <div className="text-muted-foreground">
                  <span className="font-medium">{candidate.country.trim()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Localisation héritée - Afficher seulement si elle apporte une info différente */}
        {candidate.location && candidate.location.trim() && !hasStructuredAddress && (
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

        {/* Affichage d'information de debug si aucune adresse n'est trouvée */}
        {!hasStructuredAddress && (!candidate.location || !candidate.location.trim()) && (
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-yellow-400/50">
            <strong>Info :</strong> Aucune information d'adresse disponible pour ce candidat.
          </div>
        )}

        {/* Localisation alternative seulement si elle est différente de l'adresse structurée */}
        {candidate.location && candidate.location.trim() && hasStructuredAddress && (
          (() => {
            const fullStructuredAddress = [
              candidate.address?.trim(),
              candidate.postal_code?.trim(),
              candidate.city?.trim(),
              candidate.country?.trim()
            ].filter(Boolean).join(' ');
            
            // Afficher seulement si la localisation est vraiment différente
            const locationDifferent = candidate.location.trim() !== candidate.city?.trim() && 
                                    candidate.location.trim() !== candidate.country?.trim() &&
                                    !fullStructuredAddress.toLowerCase().includes(candidate.location.trim().toLowerCase());
            
            return locationDifferent ? (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border-l-2 border-navy/20">
                <strong>Localisation alternative :</strong> {candidate.location.trim()}
              </div>
            ) : null;
          })()
        )}
      </CardContent>
    </Card>
  );
};

export default IdentityContactSection;
