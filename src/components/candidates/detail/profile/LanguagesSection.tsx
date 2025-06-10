
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Globe, FileCheck, Car } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray, safeString } from '@/utils/candidateUtils';

interface LanguagesSectionProps {
  candidate: CandidateData;
}

const LanguagesSection: React.FC<LanguagesSectionProps> = ({ candidate }) => {
  const languages = ensureArray<any>(candidate.languages);
  const work_authorization = safeString(candidate.work_authorization);
  const special_permits = ensureArray<any>(candidate.special_permits);

  const hasContent = languages.length > 0 || work_authorization.trim().length > 0 || special_permits.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <Globe className="w-5 h-5" />
          </div>
          Langues & International
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Langues */}
        {languages.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2 flex items-center gap-2">
              <Languages className="w-4 h-4" />
              Langues ({languages.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {languages.map((lang: any, idx: number) => (
                <div key={idx} className="flex items-center p-3 border border-border rounded-lg bg-muted/20">
                  <Languages className="h-5 w-5 mr-3 text-navy" />
                  <div>
                    <p className="font-medium text-navy-dark">
                      {typeof lang === 'string' ? 
                        lang : 
                        lang.language || lang.name || 'Langue non spécifiée'}
                    </p>
                    {lang.level && (
                      <p className="text-sm text-muted-foreground">{lang.level}</p>
                    )}
                    {lang.certification && (
                      <p className="text-xs text-navy bg-navy/10 px-2 py-1 rounded mt-1 inline-block">
                        {lang.certification}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Autorisation de travail */}
        {work_authorization.trim().length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2 flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              Autorisations de travail
            </h4>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-navy-dark leading-relaxed">{work_authorization}</p>
            </div>
          </div>
        )}

        {/* Permis spéciaux */}
        {special_permits.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2 flex items-center gap-2">
              <Car className="w-4 h-4" />
              Permis & Autorisations spéciales ({special_permits.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {special_permits.map((permit: any, idx: number) => (
                <div key={idx} className="p-3 border border-border rounded-lg bg-muted/20">
                  <div className="flex items-start">
                    <Car className="mr-3 text-navy h-5 w-5 mt-1" />
                    <div className="space-y-1">
                      <h5 className="font-medium text-navy-dark">
                        {typeof permit === 'string' ? 
                          permit : 
                          permit.name || permit.type || 'Permis'}
                      </h5>
                      {permit.number && (
                        <p className="text-sm text-muted-foreground">N° {permit.number}</p>
                      )}
                      {permit.expiry_date && (
                        <p className="text-xs text-muted-foreground">Expire le : {permit.expiry_date}</p>
                      )}
                      {permit.description && (
                        <p className="text-sm text-navy-dark">{permit.description}</p>
                      )}
                    </div>
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

export default LanguagesSection;
