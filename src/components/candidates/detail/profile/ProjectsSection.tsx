
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Globe, Calendar, Code } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';

interface ProjectsSectionProps {
  candidate: CandidateData;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ candidate }) => {
  const projects = ensureArray<any>(candidate.projects);

  if (projects.length === 0) {
    return null;
  }

  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <FolderOpen className="w-5 h-5" />
          </div>
          Projets & Réalisations ({projects.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project: any, idx: number) => (
            <div key={idx} className="p-4 border border-border rounded-lg bg-muted/20 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-navy-dark flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-navy" />
                  {typeof project === 'string' ? 
                    project : 
                    project?.name || project?.title || 'Projet sans titre'}
                </h3>
                
                {project?.date && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-1" />
                    {project.date}
                  </div>
                )}
              </div>

              {project?.description && (
                <div className="bg-muted/30 p-3 rounded">
                  <p className="text-navy-dark leading-relaxed">{project.description}</p>
                </div>
              )}

              <div className="space-y-3">
                {project?.role && (
                  <div>
                    <h4 className="text-sm font-semibold text-navy-dark mb-1">Rôle :</h4>
                    <p className="text-sm text-navy bg-navy/10 px-2 py-1 rounded inline-block">
                      {project.role}
                    </p>
                  </div>
                )}

                {project?.technologies && (
                  <div>
                    <h4 className="text-sm font-semibold text-navy-dark mb-2 flex items-center gap-1">
                      <Code className="w-4 h-4" />
                      Technologies utilisées :
                    </h4>
                    <div className="text-sm text-navy-dark bg-muted/30 p-2 rounded">
                      {Array.isArray(project.technologies) ? 
                        project.technologies.join(', ') : 
                        project.technologies}
                    </div>
                  </div>
                )}

                {project?.team_size && (
                  <div>
                    <h4 className="text-sm font-semibold text-navy-dark mb-1">Taille de l'équipe :</h4>
                    <p className="text-sm text-navy">{project.team_size}</p>
                  </div>
                )}

                {project?.achievements && Array.isArray(project.achievements) && project.achievements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-navy-dark mb-2">Réalisations :</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-navy-dark">
                      {project.achievements.map((achievement: string, achIdx: number) => (
                        <li key={achIdx}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {project?.url && (
                  <div className="pt-2 border-t border-border/50">
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-navy hover:underline inline-flex items-center gap-1"
                    >
                      <Globe className="w-4 h-4" />
                      Voir le projet
                    </a>
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

export default ProjectsSection;
