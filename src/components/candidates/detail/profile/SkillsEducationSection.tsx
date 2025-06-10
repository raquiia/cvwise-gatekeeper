
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, GraduationCap, Award, Star } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';

interface SkillsEducationSectionProps {
  candidate: CandidateData;
}

const SkillsEducationSection: React.FC<SkillsEducationSectionProps> = ({ candidate }) => {
  const skills = ensureArray<any>(candidate.skills);
  const education = ensureArray<any>(candidate.education);
  const certifications = ensureArray<any>(candidate.certifications);

  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <Lightbulb className="w-5 h-5" />
          </div>
          Compétences & Formation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {/* Compétences */}
          {skills.length > 0 && (
            <AccordionItem value="skills">
              <AccordionTrigger className="text-navy-dark font-semibold">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold" />
                  Compétences ({skills.length})
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: any, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="px-3 py-1.5 text-sm bg-gradient-to-r from-navy/10 to-navy/20 text-navy-dark border-navy/20"
                    >
                      <Star className="w-3 h-3 mr-1.5 text-gold" />
                      {typeof skill === 'string' ? skill : skill.name || skill.skill || 'Compétence'}
                      {skill.level && (
                        <span className="ml-2 text-xs bg-navy/20 px-1.5 py-0.5 rounded">
                          {skill.level}
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Formation */}
          {education.length > 0 && (
            <AccordionItem value="education">
              <AccordionTrigger className="text-navy-dark font-semibold">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-navy" />
                  Formation académique ({education.length})
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-4">
                  {education.map((edu: any, idx: number) => (
                    <div key={idx} className="relative pl-6 pb-4 border-l-2 border-navy/20 last:border-0 last:pb-0">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-navy"></div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-navy-dark">
                          {edu.degree || edu.diploma || 'Formation'}
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="font-medium text-navy">
                            {edu.institution || edu.school || 'Institution'}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {edu.location && (
                              <span className="bg-muted px-2 py-1 rounded">{edu.location}</span>
                            )}
                            {(edu.start_date || edu.startDate) && (
                              <span className="bg-muted px-2 py-1 rounded">
                                {edu.start_date || edu.startDate}
                                {(edu.end_date || edu.endDate) ? ` - ${edu.end_date || edu.endDate}` : ""}
                              </span>
                            )}
                            {!edu.start_date && !edu.startDate && edu.year && (
                              <span className="bg-muted px-2 py-1 rounded">{edu.year}</span>
                            )}
                          </div>
                        </div>
                        {edu.description && (
                          <p className="text-sm text-navy-dark mt-2">{edu.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <AccordionItem value="certifications">
              <AccordionTrigger className="text-navy-dark font-semibold">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gold" />
                  Certifications ({certifications.length})
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certifications.map((cert: any, idx: number) => (
                    <div key={idx} className="p-4 border border-border rounded-lg bg-muted/20">
                      <div className="flex items-start">
                        <Award className="mr-3 text-gold h-5 w-5 mt-1" />
                        <div className="space-y-1">
                          <h4 className="font-semibold text-navy-dark">
                            {typeof cert === 'string' ? 
                              cert : 
                              cert.name || cert.title || 'Certification'}
                          </h4>
                          {cert && cert.issuer && (
                            <p className="text-sm text-navy font-medium">{cert.issuer}</p>
                          )}
                          {cert && cert.date && (
                            <p className="text-xs text-muted-foreground">{cert.date}</p>
                          )}
                          {cert && cert.description && (
                            <p className="text-sm text-navy-dark mt-2">{cert.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default SkillsEducationSection;
