
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Briefcase, Zap, Code } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray, isUndefinedObject } from '@/utils/candidateUtils';

interface ExperienceTabProps {
  candidate: CandidateData;
}

const ExperienceTab: React.FC<ExperienceTabProps> = ({ candidate }) => {
  console.log("ExperienceTab - candidate.experiences:", candidate.experiences);
  
  // Filter out any undefined objects
  const experiences = ensureArray<any>(candidate.experiences);
  const projects = ensureArray<any>(candidate.projects);
  
  console.log("ExperienceTab - processed experiences:", experiences);
  console.log("ExperienceTab - processed projects:", projects);

  return (
    <div className="space-y-6">
      <Card className="ai-card border-0 shadow-md">
        <div className="absolute ai-card-accent ai-card-accent-1 opacity-20 ai-pulse"></div>
        <div className="absolute ai-card-accent ai-card-accent-2 opacity-20 ai-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute inset-0 ai-grid-bg opacity-5 pointer-events-none"></div>
        
        <CardHeader className="relative border-b border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full"></div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400/20 blur-md rounded-full"></div>
              <Briefcase className="h-5 w-5 text-indigo-600 relative z-10" />
            </div>
            <CardTitle>Expérience professionnelle</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {experiences.length > 0 ? (
            <div className="space-y-6">
              {experiences.map((exp: any, idx: number) => (
                <div key={idx} className="relative pl-6 pb-6 border-l-2 border-indigo-400/30 last:border-0 last:pb-0 hover:border-indigo-500 transition-colors duration-300 group">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <div className="absolute inset-0 rounded-full animate-pulse bg-white/20"></div>
                  </div>
                  
                  <div className="mb-1">
                    <h3 className="text-lg font-semibold ai-gradient-text">{exp?.title || exp?.position || 'Poste non spécifié'}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                      <span className="font-medium text-indigo-700">{exp?.company || 'Entreprise non spécifiée'}</span>
                      {exp?.location && <span>• {exp.location}</span>}
                      {(exp?.startDate || exp?.start_date) && (
                        <span>
                          • {exp.startDate || exp.start_date} 
                          {(exp?.endDate || exp?.end_date) ? 
                            ` - ${exp.endDate || exp.end_date}` : 
                            " - Présent"}
                        </span>
                      )}
                    </div>
                  </div>
                  {exp?.description && (
                    <p className="mt-2 text-navy-dark bg-indigo-50/50 p-3 rounded-md border border-indigo-100/50 text-sm leading-relaxed">{exp.description}</p>
                  )}
                  {exp?.skills && Array.isArray(exp.skills) && exp.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {exp.skills.map((skill: string, skillIdx: number) => (
                        <span key={skillIdx} className="px-2 py-1 text-xs bg-indigo-100/50 text-indigo-700 rounded-full border border-indigo-200/30 flex items-center">
                          <Zap size={10} className="mr-1 text-indigo-500" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">Aucune expérience renseignée</p>
          )}
        </CardContent>
      </Card>
      
      {projects.length > 0 && (
        <Card className="ai-card border-0 shadow-md">
          <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-teal-400/10 blur-3xl ai-pulse"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-blue-400/10 blur-3xl ai-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-0 ai-grid-bg opacity-5 pointer-events-none"></div>
          
          <CardHeader className="relative border-b border-teal-100/50 bg-gradient-to-r from-teal-50/50 to-blue-50/50">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-bl-full"></div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-teal-400/20 blur-md rounded-full"></div>
                <Code className="h-5 w-5 text-teal-600 relative z-10" />
              </div>
              <CardTitle>Projets</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-6">
              {projects.map((project: any, idx: number) => (
                <div key={idx} className="p-4 border border-teal-200/30 rounded-lg bg-gradient-to-br from-teal-50/20 to-blue-50/30 hover:from-teal-50/40 hover:to-blue-50/50 transition-all duration-300 group hover:shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-teal-500/5 to-blue-500/5 rounded-bl-full group-hover:scale-110 transition-transform duration-300"></div>
                  
                  <h3 className="text-lg font-semibold ai-gradient-text from-teal-600 to-blue-600 mb-1">
                    {typeof project === 'string' ? 
                      project : 
                      project?.name || project?.title || 'Projet sans titre'}
                  </h3>
                  {project?.date && <p className="text-sm text-muted-foreground mb-2">{project.date}</p>}
                  {project?.description && <p className="text-navy-dark mb-3 bg-white/50 p-3 rounded-md border border-teal-100/30 text-sm">{project.description}</p>}
                  {project?.technologies && (
                    <div className="mb-2">
                      <h4 className="text-sm font-semibold mb-1 flex items-center">
                        <Code size={14} className="mr-1 text-teal-600" />
                        Technologies utilisées:
                      </h4>
                      <p className="text-sm text-teal-700 bg-teal-50/50 p-2 rounded-md border border-teal-100/30">{project.technologies}</p>
                    </div>
                  )}
                  {project?.role && (
                    <div className="mb-2">
                      <h4 className="text-sm font-semibold mb-1">Rôle:</h4>
                      <p className="text-sm text-navy bg-white/50 p-2 rounded-md border border-teal-100/30">{project.role}</p>
                    </div>
                  )}
                  {project?.url && (
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-teal-600 hover:text-teal-800 underline inline-flex items-center mt-2 group"
                    >
                      <Globe size={14} className="mr-1 group-hover:scale-110 transition-transform duration-300" />
                      Voir le projet
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExperienceTab;
