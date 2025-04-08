
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';
import { CandidateData } from '@/services/data/resumeDataService';
import { ensureArray } from '@/utils/candidateUtils';

interface EducationTabProps {
  candidate: CandidateData;
}

const EducationTab: React.FC<EducationTabProps> = ({ candidate }) => {
  const education = ensureArray<any>(candidate.education);
  const certifications = ensureArray<any>(candidate.certifications);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Formation académique</CardTitle>
        </CardHeader>
        <CardContent>
          {education.length > 0 ? (
            <div className="space-y-6">
              {education.map((edu: any, idx: number) => (
                <div key={idx} className="relative pl-6 pb-6 border-l-2 border-navy/20 last:border-0 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-navy"></div>
                  <div className="mb-1">
                    <h3 className="text-lg font-semibold text-navy-dark">{edu.degree || edu.diploma}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                      <span className="font-medium text-navy">{edu.institution || edu.school}</span>
                      {edu.location && <span>• {edu.location}</span>}
                      {(edu.start_date || edu.startDate) && (
                        <span>
                          • {edu.start_date || edu.startDate} 
                          {(edu.end_date || edu.endDate) ? 
                            ` - ${edu.end_date || edu.endDate}` : 
                            ""}
                        </span>
                      )}
                      {!edu.start_date && !edu.startDate && edu.year && <span>• {edu.year}</span>}
                    </div>
                  </div>
                  {edu.description && (
                    <p className="mt-2 text-navy-dark">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">Aucune formation renseignée</p>
          )}
        </CardContent>
      </Card>
      
      {certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((cert: any, idx: number) => (
                <div key={idx} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start">
                    <Award className="mr-3 text-navy h-5 w-5 mt-1" />
                    <div>
                      <h3 className="font-semibold text-navy-dark">
                        {typeof cert === 'string' ? 
                          cert : 
                          cert.name || cert.title || 'Certification sans titre'}
                      </h3>
                      {cert.issuer && <p className="text-sm text-navy">{cert.issuer}</p>}
                      {cert.date && <p className="text-xs text-muted-foreground mt-1">{cert.date}</p>}
                      {cert.description && <p className="text-sm text-navy-dark mt-2">{cert.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EducationTab;
