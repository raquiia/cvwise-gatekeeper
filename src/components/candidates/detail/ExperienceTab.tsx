
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { CandidateData } from '@/services/data/resumeDataService';
import { ensureArray } from '@/utils/candidateUtils';

interface ExperienceTabProps {
  candidate: CandidateData;
}

const ExperienceTab: React.FC<ExperienceTabProps> = ({ candidate }) => {
  const experiences = ensureArray<any>(candidate.experiences);
  const projects = ensureArray<any>(candidate.projects);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Expérience professionnelle</CardTitle>
        </CardHeader>
        <CardContent>
          {experiences.length > 0 ? (
            <div className="space-y-6">
              {experiences.map((exp: any, idx: number) => (
                <div key={idx} className="relative pl-6 pb-6 border-l-2 border-navy/20 last:border-0 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-navy"></div>
                  <div className="mb-1">
                    <h3 className="text-lg font-semibold text-navy-dark">{exp.title || exp.position}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                      <span className="font-medium text-navy">{exp.company}</span>
                      {exp.location && <span>• {exp.location}</span>}
                      {(exp.startDate || exp.start_date) && (
                        <span>
                          • {exp.startDate || exp.start_date} 
                          {(exp.endDate || exp.end_date) ? 
                            ` - ${exp.endDate || exp.end_date}` : 
                            " - Présent"}
                        </span>
                      )}
                    </div>
                  </div>
                  {(exp.description) && (
                    <p className="mt-2 text-navy-dark">{exp.description}</p>
                  )}
                  {exp.skills && Array.isArray(exp.skills) && exp.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {exp.skills.map((skill: string, skillIdx: number) => (
                        <span key={skillIdx} className="px-2 py-1 text-xs bg-navy/10 text-navy-dark rounded-full">
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
        <Card>
          <CardHeader>
            <CardTitle>Projets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {projects.map((project: any, idx: number) => (
                <div key={idx} className="p-4 border border-border rounded-lg">
                  <h3 className="text-lg font-semibold text-navy-dark mb-1">
                    {typeof project === 'string' ? 
                      project : 
                      project.name || project.title || 'Projet sans titre'}
                  </h3>
                  {project.date && <p className="text-sm text-muted-foreground mb-2">{project.date}</p>}
                  {project.description && <p className="text-navy-dark mb-3">{project.description}</p>}
                  {project.technologies && (
                    <div className="mb-2">
                      <h4 className="text-sm font-semibold mb-1">Technologies utilisées:</h4>
                      <p className="text-sm text-navy">{project.technologies}</p>
                    </div>
                  )}
                  {project.role && (
                    <div className="mb-2">
                      <h4 className="text-sm font-semibold mb-1">Rôle:</h4>
                      <p className="text-sm text-navy">{project.role}</p>
                    </div>
                  )}
                  {project.url && (
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-navy underline inline-flex items-center mt-2"
                    >
                      <Globe size={14} className="mr-1" />
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
