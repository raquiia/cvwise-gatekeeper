
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Globe } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateDataService';
import { ensureArray } from '@/utils/candidateUtils';

interface DetailsTabProps {
  candidate: CandidateData;
}

const DetailsTab: React.FC<DetailsTabProps> = ({ candidate }) => {
  const languages = ensureArray<any>(candidate.languages);
  const professional_references = ensureArray<any>(candidate.professional_references);
  const professional_networks = ensureArray<any>(candidate.professional_networks);

  return (
    <div className="space-y-6">
      {languages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Langues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {languages.map((lang: any, idx: number) => (
                <div key={idx} className="flex items-center p-3 border border-border rounded-lg">
                  <Languages className="h-5 w-5 mr-3 text-navy" />
                  <div>
                    <p className="font-medium">
                      {typeof lang === 'string' ? 
                        lang : 
                        lang.language || 'Langue non spécifiée'}
                    </p>
                    {lang.level && <p className="text-sm text-muted-foreground">{lang.level}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {candidate.professional_values && (
            <Card>
              <CardHeader>
                <CardTitle>Valeurs professionnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-navy-dark">{candidate.professional_values}</p>
              </CardContent>
            </Card>
          )}
          
          {candidate.work_authorization && (
            <Card>
              <CardHeader>
                <CardTitle>Autorisations de travail</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-navy-dark">{candidate.work_authorization}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          {professional_references.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Références professionnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {professional_references.map((ref: any, idx: number) => (
                    <div key={idx} className="p-3 border border-border rounded-lg">
                      <h4 className="font-semibold">{ref.name}</h4>
                      {ref.position && <p className="text-sm text-navy">{ref.position}</p>}
                      {ref.company && <p className="text-sm text-muted-foreground">{ref.company}</p>}
                      {ref.contact && <p className="text-sm mt-1">{ref.contact}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {professional_networks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Réseaux professionnels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {professional_networks.map((network: any, idx: number) => (
                    <div key={idx} className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-navy" />
                      <a 
                        href={network.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-navy hover:underline"
                      >
                        {network.name || network.platform}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsTab;
