
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';

interface CompactExperienceSectionProps {
  candidate: CandidateData;
}

const CompactExperienceSection: React.FC<CompactExperienceSectionProps> = ({ candidate }) => {
  const experiences = ensureArray<any>(candidate.experiences);

  if (experiences.length === 0) {
    return null;
  }

  // Prendre les 3 expériences les plus récentes
  const recentExperiences = experiences.slice(0, 3);

  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <Briefcase className="w-5 h-5" />
          </div>
          Expériences récentes ({experiences.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentExperiences.map((exp: any, idx: number) => (
          <div key={idx} className="group hover:bg-muted/30 p-3 rounded-lg transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-navy-dark group-hover:text-navy transition-colors">
                    {exp?.title || exp?.position || 'Poste non spécifié'}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-navy transition-colors" />
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    <span className="font-medium text-navy">
                      {exp?.company || 'Entreprise non spécifiée'}
                    </span>
                  </div>
                  
                  {exp?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{exp.location}</span>
                    </div>
                  )}
                  
                  {(exp?.startDate || exp?.start_date) && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {exp.startDate || exp.start_date}
                        {(exp?.endDate || exp?.end_date) ? 
                          ` - ${exp.endDate || exp.end_date}` : 
                          " - Présent"}
                      </span>
                    </div>
                  )}
                </div>
                
                {exp?.description && (
                  <p className="text-sm text-navy-dark line-clamp-2 leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {experiences.length > 3 && (
          <div className="text-center pt-2 border-t border-border/50">
            <span className="text-sm text-muted-foreground">
              et {experiences.length - 3} expérience{experiences.length - 3 > 1 ? 's' : ''} de plus...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactExperienceSection;
