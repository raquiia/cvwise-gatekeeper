
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';

interface IdentityContactSectionProps {
  candidate: CandidateData;
}

const IdentityContactSection: React.FC<IdentityContactSectionProps> = ({ candidate }) => {
  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <User className="w-5 h-5" />
          </div>
          Identité & Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations personnelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Prénom</div>
            <div className="text-navy-dark font-medium">{candidate.first_name || 'Non renseigné'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Nom</div>
            <div className="text-navy-dark font-medium">{candidate.last_name || 'Non renseigné'}</div>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2">Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidate.email && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <div className="text-navy-dark font-medium">{candidate.email}</div>
              </div>
            )}
            {candidate.phone && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Téléphone
                </div>
                <div className="text-navy-dark font-medium">{candidate.phone}</div>
              </div>
            )}
          </div>
        </div>

        {/* Adresse */}
        <div className="space-y-4">
          <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2">Adresse</h4>
          <div className="space-y-3">
            {candidate.address && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse
                </div>
                <div className="text-navy-dark font-medium">{candidate.address}</div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {candidate.postal_code && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Code postal</div>
                  <div className="bg-navy/10 px-2 py-1 rounded text-navy font-medium text-center">
                    {candidate.postal_code}
                  </div>
                </div>
              )}
              {candidate.city && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Ville</div>
                  <div className="text-navy-dark font-medium">{candidate.city}</div>
                </div>
              )}
              {candidate.country && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Pays</div>
                  <div className="text-navy-dark font-medium">{candidate.country}</div>
                </div>
              )}
            </div>
            {candidate.location && candidate.location !== `${candidate.city || ''}${candidate.country ? `, ${candidate.country}` : ''}` && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Localisation (héritée)</div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{candidate.location}</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IdentityContactSection;
