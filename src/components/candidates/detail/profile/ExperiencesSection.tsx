
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Calendar, MapPin } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';

interface ExperiencesSectionProps {
  candidate: CandidateData;
}

const ExperiencesSection: React.FC<ExperiencesSectionProps> = ({ candidate }) => {
  const experiences = ensureArray<any>(candidate.experiences);

  if (experiences.length === 0) {
    return null;
  }

  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <Briefcase className="w-5 h-5" />
          </div>
          Expériences Détaillées ({experiences.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {experiences.map((exp: any, idx: number) => (
            <div key={idx} className="relative pl-6 pb-6 border-l-2 border-navy/20 last:border-0 last:pb-0">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-navy"></div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-navy-dark">
                    {exp?.title || exp?.position || 'Poste non spécifié'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    <span className="font-medium text-navy flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {exp?.company || 'Entreprise non spécifiée'}
                    </span>
                    {exp?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {exp.location}
                      </span>
                    )}
                    {(exp?.startDate || exp?.start_date) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {exp.startDate || exp.start_date} 
                        {(exp?.endDate || exp?.end_date) ? 
                          ` - ${exp.endDate || exp.end_date}` : 
                          " - Présent"}
                      </span>
                    )}
                  </div>
                </div>
                
                {exp?.description && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-navy-dark leading-relaxed">{exp.description}</p>
                  </div>
                )}
                
                {exp?.responsibilities && Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 && (
                  <div>
                    <h4 className="font-medium text-navy-dark mb-2">Responsabilités :</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-navy-dark">
                      {exp.responsibilities.map((resp: string, respIdx: number) => (
                        <li key={respIdx}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {exp?.achievements && Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-navy-dark mb-2">Réalisations :</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-navy-dark">
                      {exp.achievements.map((achievement: string, achIdx: number) => (
                        <li key={achIdx}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {exp?.skills && Array.isArray(exp.skills) && exp.skills.length > 0 && (
                  <div>
                    <h4 className="font-medium text-navy-dark mb-2">Compétences utilisées :</h4>
                    <div className="flex flex-wrap gap-2">
                      {exp.skills.map((skill: string, skillIdx: number) => (
                        <span key={skillIdx} className="px-2 py-1 text-xs bg-navy/10 text-navy-dark rounded-full border border-navy/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperiencesSection;
