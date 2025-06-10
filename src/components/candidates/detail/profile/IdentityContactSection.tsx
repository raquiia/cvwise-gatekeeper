
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

        {/* Adresse compacte */}
        {(candidate.address || candidate.city || candidate.postal_code || candidate.country) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-navy" />
              <span className="font-medium text-muted-foreground">Adresse</span>
            </div>
            <div className="text-sm text-navy-dark ml-6">
              {candidate.address && <div>{candidate.address}</div>}
              <div>
                {candidate.postal_code && <span className="bg-navy/10 px-2 py-0.5 rounded mr-2">{candidate.postal_code}</span>}
                {candidate.city} {candidate.country && `(${candidate.country})`}
              </div>
            </div>
          </div>
        )}

        {/* Localisation héritée si différente */}
        {candidate.location && candidate.location !== `${candidate.city || ''}${candidate.country ? `, ${candidate.country}` : ''}` && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <strong>Localisation héritée :</strong> {candidate.location}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IdentityContactSection;
