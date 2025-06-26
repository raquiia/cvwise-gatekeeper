
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, GraduationCap } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';

interface EducationTabProps {
  candidate: CandidateData;
}

const EducationTab: React.FC<EducationTabProps> = ({ candidate }) => {
  console.log("EducationTab - candidate.education:", candidate.education);
  
  // Filter out any undefined objects
  const education = ensureArray<any>(candidate.education);
  const certifications = ensureArray<any>(candidate.certifications);
  
  console.log("EducationTab - processed education:", education);
  console.log("EducationTab - processed certifications:", certifications);

  return (
    <div className="p-8 space-y-8">
      <Card className="bg-white/60 backdrop-blur-sm border-border/30 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-border/20">
          <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-orange-600" />
            Formation académique
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {education.length > 0 ? (
            <div className="space-y-8">
              {education.map((edu: any, idx: number) => (
                <div key={idx} className="relative pl-8 pb-8 border-l-4 border-gradient-to-b from-orange-500 to-red-500 last:border-0 last:pb-0">
                  <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg"></div>
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-border/20 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-navy-dark mb-2">
                        {edu.degree || edu.diploma || 'Formation'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <span className="font-medium text-navy bg-navy/10 px-3 py-1 rounded-full">
                          {edu.institution || edu.school || 'Institution'}
                        </span>
                        {edu.location && (
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                            {edu.location}
                          </span>
                        )}
                        {(edu.start_date || edu.startDate) && (
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                            {edu.start_date || edu.startDate} 
                            {(edu.end_date || edu.endDate) ? 
                              ` - ${edu.end_date || edu.endDate}` : 
                              " - En cours"}
                          </span>
                        )}
                        {!edu.start_date && !edu.startDate && edu.year && (
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                            {edu.year}
                          </span>
                        )}
                      </div>
                    </div>
                    {edu.description && (
                      <p className="text-navy-dark leading-relaxed bg-muted/30 p-4 rounded-lg">
                        {edu.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Aucune formation renseignée</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {certifications.length > 0 && (
        <Card className="bg-white/60 backdrop-blur-sm border-border/30 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gold/10 to-yellow-500/10 border-b border-border/20">
            <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent flex items-center gap-3">
              <Award className="w-7 h-7 text-gold" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certifications.map((cert: any, idx: number) => (
                <div key={idx} className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-border/20 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-gold/20 to-yellow-500/20">
                      <Award className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-navy-dark text-lg mb-1">
                        {typeof cert === 'string' ? 
                          cert : 
                          cert.name || cert.title || 'Certification sans titre'}
                      </h3>
                      {cert && cert.issuer && (
                        <p className="text-sm text-navy font-medium mb-2">{cert.issuer}</p>
                      )}
                      {cert && cert.date && (
                        <p className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full inline-block mb-2">
                          {cert.date}
                        </p>
                      )}
                      {cert && cert.description && (
                        <p className="text-sm text-navy-dark leading-relaxed">{cert.description}</p>
                      )}
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
