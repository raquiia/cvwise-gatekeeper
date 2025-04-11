
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Globe, MessageSquareText, Globe2, User2 } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray, safeString } from '@/utils/candidateUtils';

interface DetailsTabProps {
  candidate: CandidateData;
}

const DetailsTab: React.FC<DetailsTabProps> = ({ candidate }) => {
  console.log("DetailsTab - candidate data:", {
    languages: candidate.languages,
    professional_references: candidate.professional_references,
    professional_networks: candidate.professional_networks
  });
  
  const languages = ensureArray<any>(candidate.languages);
  const professional_references = ensureArray<any>(candidate.professional_references);
  const professional_networks = ensureArray<any>(candidate.professional_networks);
  
  // Use safe string extraction
  const professional_values = safeString(candidate.professional_values);
  const work_authorization = safeString(candidate.work_authorization);
  
  // Check if strings have valid content
  const hasValidProfessionalValues = professional_values.trim().length > 0;
  const hasValidWorkAuthorization = work_authorization.trim().length > 0;
  
  console.log("DetailsTab - processed data:", {
    languages,
    professional_references,
    professional_networks,
    professional_values,
    work_authorization
  });

  return (
    <div className="space-y-6">
      {languages.length > 0 && (
        <Card className="ai-card border-0 shadow-md">
          <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-blue-400/10 blur-3xl ai-pulse"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-indigo-400/10 blur-3xl ai-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-0 ai-grid-bg opacity-5 pointer-events-none"></div>
          
          <CardHeader className="relative border-b border-blue-100/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-bl-full"></div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400/20 blur-md rounded-full"></div>
                <MessageSquareText className="h-5 w-5 text-blue-600 relative z-10" />
              </div>
              <CardTitle>Langues</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {languages.map((lang: any, idx: number) => (
                <div key={idx} className="group flex items-center p-3 border border-blue-200/30 rounded-lg bg-gradient-to-br from-blue-50/20 to-indigo-50/30 hover:from-blue-50/40 hover:to-indigo-50/50 transition-all duration-300 hover:shadow-md">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white mr-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Languages className="h-4 w-4" />
                    <div className="absolute inset-0 rounded-full animate-pulse bg-white/10"></div>
                  </div>
                  <div>
                    <p className="font-medium ai-gradient-text from-blue-600 to-indigo-600">
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
          {hasValidProfessionalValues && (
            <Card className="ai-card border-0 shadow-md">
              <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-purple-400/10 blur-3xl ai-pulse"></div>
              <div className="absolute inset-0 ai-grid-bg opacity-5 pointer-events-none"></div>
              
              <CardHeader className="relative border-b border-purple-100/50 bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-bl-full"></div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-400/20 blur-md rounded-full"></div>
                    <User2 className="h-5 w-5 text-purple-600 relative z-10" />
                  </div>
                  <CardTitle>Valeurs professionnelles</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <p className="text-navy-dark bg-white/50 p-4 rounded-lg border border-purple-100/30">{professional_values}</p>
              </CardContent>
            </Card>
          )}
          
          {hasValidWorkAuthorization && (
            <Card className="ai-card border-0 shadow-md">
              <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-teal-400/10 blur-3xl ai-pulse"></div>
              <div className="absolute inset-0 ai-grid-bg opacity-5 pointer-events-none"></div>
              
              <CardHeader className="relative border-b border-teal-100/50 bg-gradient-to-r from-teal-50/50 to-blue-50/50">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-bl-full"></div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-teal-400/20 blur-md rounded-full"></div>
                    <Globe2 className="h-5 w-5 text-teal-600 relative z-10" />
                  </div>
                  <CardTitle>Autorisations de travail</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <p className="text-navy-dark bg-white/50 p-4 rounded-lg border border-teal-100/30">{work_authorization}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          {professional_references.length > 0 && (
            <Card className="ai-card border-0 shadow-md">
              <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-amber-400/10 blur-3xl ai-pulse"></div>
              <div className="absolute inset-0 ai-grid-bg opacity-5 pointer-events-none"></div>
              
              <CardHeader className="relative border-b border-amber-100/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-bl-full"></div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-400/20 blur-md rounded-full"></div>
                    <User2 className="h-5 w-5 text-amber-600 relative z-10" />
                  </div>
                  <CardTitle>Références professionnelles</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {professional_references.map((ref: any, idx: number) => (
                    <div key={idx} className="group p-3 border border-amber-200/30 rounded-lg bg-gradient-to-br from-amber-50/20 to-orange-50/20 hover:from-amber-50/40 hover:to-orange-50/40 transition-all duration-300 hover:shadow-md">
                      <h4 className="font-semibold ai-gradient-text from-amber-700 to-orange-600">{ref.name}</h4>
                      {ref.position && <p className="text-sm text-amber-700">{ref.position}</p>}
                      {ref.company && <p className="text-sm text-muted-foreground">{ref.company}</p>}
                      {ref.contact && <p className="text-sm mt-1 bg-white/50 p-2 rounded-md border border-amber-100/30">{ref.contact}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {professional_networks.length > 0 && (
            <Card className="ai-card border-0 shadow-md">
              <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-blue-400/10 blur-3xl ai-pulse"></div>
              <div className="absolute inset-0 ai-grid-bg opacity-5 pointer-events-none"></div>
              
              <CardHeader className="relative border-b border-blue-100/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-bl-full"></div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-400/20 blur-md rounded-full"></div>
                    <Globe className="h-5 w-5 text-blue-600 relative z-10" />
                  </div>
                  <CardTitle>Réseaux professionnels</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {professional_networks.map((network: any, idx: number) => (
                    <div key={idx} className="group flex items-center p-3 border border-blue-200/30 rounded-lg bg-gradient-to-br from-blue-50/20 to-indigo-50/30 hover:from-blue-50/40 hover:to-indigo-50/50 transition-all duration-300 hover:shadow-md">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white mr-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                        <Globe className="h-4 w-4" />
                        <div className="absolute inset-0 rounded-full animate-pulse bg-white/10"></div>
                      </div>
                      <a 
                        href={network.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-300 font-medium"
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
