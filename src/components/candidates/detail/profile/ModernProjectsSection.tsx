
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  ExternalLink, 
  Calendar, 
  Users, 
  Code,
  Award,
  TrendingUp
} from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';

interface ModernProjectsSectionProps {
  candidate: CandidateData;
}

const ModernProjectsSection: React.FC<ModernProjectsSectionProps> = ({ candidate }) => {
  const projects = ensureArray<any>(candidate.projects);

  if (projects.length === 0) {
    return (
      <Card className="border-navy/10 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3 text-navy-dark">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <Rocket className="w-6 h-6" />
            </div>
            Projets & Réalisations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Rocket className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium mb-2">Aucun projet enregistré</p>
            <p className="text-sm">Les projets et réalisations apparaîtront ici une fois le profil enrichi.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-navy/10 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl flex items-center gap-3 text-navy-dark">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <Rocket className="w-6 h-6" />
          </div>
          Projets & Réalisations
          <Badge variant="outline" className="ml-auto bg-orange-50 text-orange-700 border-orange-200">
            {projects.length} projet{projects.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project: any, idx: number) => (
            <div key={idx} className="group">
              <div className="bg-gradient-to-br from-white via-orange-50/30 to-red-50/30 rounded-xl p-6 border border-orange-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg">
                {/* Header du projet */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-navy-dark mb-2 group-hover:text-orange-600 transition-colors">
                      {project.name || project.title || 'Projet sans titre'}
                    </h3>
                    
                    {project.company && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Users className="w-4 h-4" />
                        {project.company}
                      </div>
                    )}
                    
                    {project.duration && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {project.duration}
                      </div>
                    )}
                  </div>
                  
                  {project.url && (
                    <a 
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Description */}
                {project.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {project.description}
                    </p>
                  </div>
                )}

                {/* Technologies utilisées */}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Technologies</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.slice(0, 4).map((tech: string, techIdx: number) => (
                        <Badge key={techIdx} variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                          {tech}
                        </Badge>
                      ))}
                      {project.technologies.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.technologies.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Réalisations/Résultats */}
                {project.achievements && project.achievements.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-gold" />
                      <span className="text-sm font-medium text-gray-700">Réalisations clés</span>
                    </div>
                    <ul className="space-y-1">
                      {project.achievements.slice(0, 2).map((achievement: string, achIdx: number) => (
                        <li key={achIdx} className="text-sm text-gray-600 flex items-start gap-2">
                          <TrendingUp className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Status du projet */}
                {project.status && (
                  <div className="mt-4 pt-4 border-t border-orange-100">
                    <Badge 
                      variant="outline" 
                      className={`${
                        project.status.toLowerCase() === 'completed' || project.status.toLowerCase() === 'terminé'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : project.status.toLowerCase() === 'in progress' || project.status.toLowerCase() === 'en cours'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {project.status}
                    </Badge>
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

export default ModernProjectsSection;
