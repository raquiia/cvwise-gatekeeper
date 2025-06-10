
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Globe, User, Phone, Mail } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';

interface NetworksReferencesSectionProps {
  candidate: CandidateData;
}

const NetworksReferencesSection: React.FC<NetworksReferencesSectionProps> = ({ candidate }) => {
  const professional_networks = ensureArray<any>(candidate.professional_networks);
  const professional_references = ensureArray<any>(candidate.professional_references);

  const hasContent = professional_networks.length > 0 || professional_references.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <Users className="w-5 h-5" />
          </div>
          Réseaux & Références
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Réseaux professionnels */}
        {professional_networks.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Réseaux professionnels ({professional_networks.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {professional_networks.map((network: any, idx: number) => (
                <div key={idx} className="p-3 border border-border rounded-lg bg-muted/20">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-navy flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-navy-dark">
                        {network.name || network.platform || 'Réseau professionnel'}
                      </div>
                      {network.url && (
                        <a 
                          href={network.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-navy hover:underline break-all"
                        >
                          {network.url}
                        </a>
                      )}
                      {network.username && (
                        <p className="text-sm text-muted-foreground">@{network.username}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Références professionnelles */}
        {professional_references.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Références professionnelles ({professional_references.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {professional_references.map((ref: any, idx: number) => (
                <div key={idx} className="p-4 border border-border rounded-lg bg-muted/20">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <User className="mr-3 text-navy h-5 w-5 mt-1 flex-shrink-0" />
                      <div className="space-y-1 flex-1">
                        <h5 className="font-semibold text-navy-dark">
                          {ref.name || 'Référence'}
                        </h5>
                        {ref.position && (
                          <p className="text-sm text-navy font-medium">{ref.position}</p>
                        )}
                        {ref.company && (
                          <p className="text-sm text-muted-foreground">{ref.company}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Contact info */}
                    <div className="space-y-2 pl-8">
                      {ref.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                          <a href={`mailto:${ref.email}`} className="text-navy hover:underline">
                            {ref.email}
                          </a>
                        </div>
                      )}
                      {ref.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                          <a href={`tel:${ref.phone}`} className="text-navy hover:underline">
                            {ref.phone}
                          </a>
                        </div>
                      )}
                      {ref.contact && !ref.email && !ref.phone && (
                        <div className="text-sm text-navy-dark">
                          <strong>Contact :</strong> {ref.contact}
                        </div>
                      )}
                    </div>
                    
                    {ref.relationship && (
                      <div className="pl-8">
                        <p className="text-sm text-muted-foreground">
                          <strong>Relation :</strong> {ref.relationship}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworksReferencesSection;
