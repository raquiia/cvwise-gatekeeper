
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, BookOpen, GraduationCap, School, Sparkles, Zap, BrainCircuit } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray, isUndefinedObject } from '@/utils/candidateUtils';

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
    <div className="space-y-6">
      <Card className="ai-card border-0 shadow-md">
        <div className="absolute ai-card-accent ai-card-accent-1 ai-pulse"></div>
        <div className="absolute ai-card-accent ai-card-accent-2 ai-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute inset-0 ai-grid-bg opacity-5 pointer-events-none"></div>
        
        <CardHeader className="relative border-b border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full"></div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400/20 blur-md rounded-full"></div>
              <GraduationCap className="h-5 w-5 text-indigo-600 relative z-10" />
            </div>
            <CardTitle>Formation académique</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 relative">
          {education.length > 0 ? (
            <div className="space-y-6">
              {education.map((edu: any, idx: number) => (
                <div key={idx} className="relative pl-6 pb-6 border-l-2 border-indigo-400/30 last:border-0 last:pb-0 hover:border-indigo-500 transition-colors duration-300 group">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <div className="absolute inset-0 rounded-full animate-pulse bg-white/20"></div>
                  </div>
                  
                  {/* Subtle shine effect on hover */}
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white opacity-0 group-hover:opacity-50 animate-pulse"></div>
                  
                  <div className="mb-1">
                    <h3 className="text-lg font-semibold ai-gradient-text group-hover:from-indigo-800 group-hover:to-purple-800 transition-colors duration-300">{edu.degree || edu.diploma || 'Formation'}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                      <span className="font-medium text-indigo-700">{edu.institution || edu.school || 'Institution'}</span>
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
                    <p className="mt-2 text-navy-dark bg-indigo-50/50 p-3 rounded-md border border-indigo-100/50 text-sm leading-relaxed">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-10 bg-indigo-50/30 rounded-lg border border-indigo-100/30">
              <School className="h-10 w-10 text-indigo-300 mx-auto mb-2 opacity-50" />
              <p>Aucune formation renseignée</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {certifications.length > 0 && (
        <Card className="ai-card border-0 shadow-md">
          <div className="absolute ai-card-accent top-0 left-0 bg-amber-500 opacity-20 w-40 h-40 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 ai-grid-bg opacity-5 pointer-events-none"></div>
          
          <CardHeader className="relative border-b border-amber-100/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-bl-full"></div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/20 blur-md rounded-full"></div>
                <Award className="h-5 w-5 text-amber-600 relative z-10" />
              </div>
              <CardTitle>Certifications</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((cert: any, idx: number) => (
                <div key={idx} className="group p-4 border border-amber-200/30 rounded-lg bg-gradient-to-br from-amber-50/20 to-amber-100/30 hover:from-amber-50/40 hover:to-amber-100/50 transition-all duration-300 hover:shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-bl-full group-hover:scale-110 transition-transform duration-300"></div>
                  
                  <div className="flex items-start">
                    <div className="mr-3 h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300 relative">
                      <Award className="h-4 w-4" />
                      <div className="absolute inset-0 rounded-full animate-pulse bg-white/10"></div>
                      <span className="absolute -top-0.5 -right-0.5">
                        <Zap size={8} className="text-yellow-300 animate-pulse" />
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800 group-hover:text-amber-900 transition-colors duration-300">
                        {typeof cert === 'string' ? 
                          cert : 
                          cert.name || cert.title || 'Certification sans titre'}
                      </h3>
                      {cert && cert.issuer && <p className="text-sm text-amber-700">{cert.issuer}</p>}
                      {cert && cert.date && <p className="text-xs text-muted-foreground mt-1">{cert.date}</p>}
                      {cert && cert.description && <p className="text-sm text-navy-dark mt-2 bg-amber-50/50 p-2 rounded-md border border-amber-100/30">{cert.description}</p>}
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
