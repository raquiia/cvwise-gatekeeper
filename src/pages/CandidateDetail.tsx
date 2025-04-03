
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { candidateDataService } from '@/services/data/candidateDataService';
import { CandidateData } from '@/services/data/resumeDataService';
import { ArrowLeft, User, MapPin, Phone, Mail, Briefcase, Award, Calendar, FileText, Loader2, GraduationCap, Languages, Award as CertificateIcon, Book, Grid, Target, Briefcase as WorkIcon, Heart, Globe } from 'lucide-react';

const CandidateDetail = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!candidateId) return;

      try {
        setLoading(true);
        const data = await candidateDataService.getCandidateById(candidateId);
        
        if (!data) {
          setError("Candidat non trouvé");
        } else {
          console.log("Données du candidat:", data);
          setCandidate(data);
        }
      } catch (err) {
        console.error("Erreur lors du chargement du candidat:", err);
        setError("Une erreur s'est produite lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-navy" />
            <span className="ml-2">Chargement du profil...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !candidate) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <User size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-navy-dark mb-2">
              {error || "Candidat non trouvé"}
            </h2>
            <p className="text-muted-foreground mb-6">
              Le profil que vous recherchez n'existe pas ou n'est plus disponible.
            </p>
            <Button onClick={() => navigate('/candidates')}>
              Retour à la liste des candidats
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Formatage des données
  const education = Array.isArray(candidate.education) ? candidate.education : [];
  const experiences = Array.isArray(candidate.experiences) ? candidate.experiences : [];
  const certifications = Array.isArray(candidate.certifications) ? candidate.certifications : [];
  const languages = Array.isArray(candidate.languages) ? candidate.languages : [];
  const projects = Array.isArray(candidate.projects) ? candidate.projects : [];
  const industries = Array.isArray(candidate.industries) ? candidate.industries : [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header & Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground mb-4"
            onClick={() => navigate('/candidates')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Retour aux candidats
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <h1 className="text-2xl font-bold text-navy-dark">
              {candidate.first_name} {candidate.last_name}
            </h1>
            
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button 
                variant="outline"
                onClick={() => navigate(`/candidates/${candidateId}/job-match`)}
              >
                <Briefcase size={16} className="mr-2" />
                Match d'emploi
              </Button>
              <Button>
                <FileText size={16} className="mr-2" />
                Voir le CV
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full md:w-auto bg-navy/5 p-1 rounded-lg mb-6">
            <TabsTrigger value="profile" className="px-4 py-2 rounded">
              Profil
            </TabsTrigger>
            <TabsTrigger value="experience" className="px-4 py-2 rounded">
              Expérience
            </TabsTrigger>
            <TabsTrigger value="education" className="px-4 py-2 rounded">
              Formation
            </TabsTrigger>
            <TabsTrigger value="details" className="px-4 py-2 rounded">
              Détails
            </TabsTrigger>
          </TabsList>
          
          {/* Tab Content: Profil */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Profil du candidat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-full bg-navy flex items-center justify-center text-sand text-xl font-medium">
                          {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <h2 className="text-xl font-semibold mb-1">
                          {candidate.first_name} {candidate.last_name}
                        </h2>
                        <p className="text-navy mb-4">{candidate.position || "Poste non spécifié"}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          {candidate.location && (
                            <div className="flex items-center">
                              <MapPin size={18} className="text-muted-foreground mr-2" />
                              <span>{candidate.location}</span>
                            </div>
                          )}
                          
                          {candidate.phone && (
                            <div className="flex items-center">
                              <Phone size={18} className="text-muted-foreground mr-2" />
                              <span>{candidate.phone}</span>
                            </div>
                          )}
                          
                          {candidate.email && (
                            <div className="flex items-center">
                              <Mail size={18} className="text-muted-foreground mr-2" />
                              <span>{candidate.email}</span>
                            </div>
                          )}
                          
                          {candidate.years_experience && (
                            <div className="flex items-center">
                              <Calendar size={18} className="text-muted-foreground mr-2" />
                              <span>{candidate.years_experience} ans d'expérience</span>
                            </div>
                          )}
                          
                          {candidate.availability && (
                            <div className="flex items-center">
                              <Calendar size={18} className="text-muted-foreground mr-2" />
                              <span>Disponibilité: {candidate.availability}</span>
                            </div>
                          )}
                          
                          {candidate.contract_type && (
                            <div className="flex items-center">
                              <FileText size={18} className="text-muted-foreground mr-2" />
                              <span>Type de contrat: {candidate.contract_type}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div>
                      <h3 className="font-medium text-navy-dark mb-4">Compétences</h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills && candidate.skills.length > 0 ? (
                          candidate.skills.map((skill, idx) => (
                            <div 
                              key={idx}
                              className="px-3 py-1.5 bg-navy/10 text-navy-dark text-sm rounded-full"
                            >
                              {skill}
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">Aucune compétence renseignée</p>
                        )}
                      </div>
                    </div>
                    
                    {candidate.interests && (
                      <>
                        <Separator className="my-6" />
                        <div>
                          <h3 className="font-medium text-navy-dark mb-4">Centres d'intérêt</h3>
                          <p className="text-navy-dark">{candidate.interests}</p>
                        </div>
                      </>
                    )}
                    
                    {industries && industries.length > 0 && (
                      <>
                        <Separator className="my-6" />
                        <div>
                          <h3 className="font-medium text-navy-dark mb-4">Industries</h3>
                          <div className="flex flex-wrap gap-2">
                            {industries.map((industry: any, idx: number) => (
                              <div 
                                key={idx}
                                className="px-3 py-1.5 bg-navy/5 text-navy-dark text-sm rounded-full"
                              >
                                {typeof industry === 'string' ? industry : industry.name || ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {candidate.career_objectives && (
                      <>
                        <Separator className="my-6" />
                        <div>
                          <h3 className="font-medium text-navy-dark mb-4">Objectifs de carrière</h3>
                          <p className="text-navy-dark">{candidate.career_objectives}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Match Score */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Évaluation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 ${
                        candidate.score && candidate.score > 85 ? 'bg-emerald-500 border-emerald-300' : 
                        candidate.score && candidate.score > 65 ? 'bg-amber-500 border-amber-300' : 
                        'bg-red-500 border-red-300'
                      }`}>
                        {candidate.score || 0}%
                      </div>
                      
                      <p className="mt-4 text-center font-medium">
                        {candidate.score && candidate.score > 85 ? 'Excellent candidat' : 
                         candidate.score && candidate.score > 65 ? 'Bon candidat' : 
                         'Candidat à potentiel'}
                      </p>
                      
                      <Separator className="my-6" />
                      
                      <div className="w-full">
                        <h4 className="text-sm font-medium mb-2">Statut actuel</h4>
                        <div className={`p-2 rounded-md text-center ${
                          candidate.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          candidate.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {candidate.status === 'active' ? 'Actif' :
                           candidate.status === 'inactive' ? 'Inactif' :
                           candidate.status === 'qualification' ? 'En qualification' :
                           candidate.status === 'interview' ? 'En entretien' :
                           candidate.status === 'hired' ? 'Embauché' :
                           'Statut inconnu'}
                        </div>
                      </div>
                      
                      {(candidate.remote_preference || candidate.mobility || candidate.travel_willingness) && (
                        <>
                          <Separator className="my-6" />
                          <div className="w-full">
                            <h4 className="text-sm font-medium mb-2">Mobilité</h4>
                            <div className="space-y-2">
                              {candidate.remote_preference && (
                                <div className="p-2 bg-navy/5 rounded-md">
                                  <span className="text-sm">Télétravail: {candidate.remote_preference}</span>
                                </div>
                              )}
                              {candidate.mobility && (
                                <div className="p-2 bg-navy/5 rounded-md">
                                  <span className="text-sm">Mobilité: {candidate.mobility}</span>
                                </div>
                              )}
                              {candidate.travel_willingness && (
                                <div className="p-2 bg-navy/5 rounded-md">
                                  <span className="text-sm">Déplacements: {candidate.travel_willingness}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                      
                      {candidate.salary_expectations && (
                        <>
                          <Separator className="my-6" />
                          <div className="w-full">
                            <h4 className="text-sm font-medium mb-2">Rémunération souhaitée</h4>
                            <div className="p-2 bg-navy/5 rounded-md text-center">
                              <span className="text-sm font-medium">{candidate.salary_expectations}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Tab Content: Expérience */}
          <TabsContent value="experience" className="space-y-6">
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
                            {exp.start_date && <span>• {exp.start_date} {exp.end_date ? `- ${exp.end_date}` : "- Présent"}</span>}
                          </div>
                        </div>
                        {exp.description && (
                          <p className="mt-2 text-navy-dark">{exp.description}</p>
                        )}
                        {exp.skills && exp.skills.length > 0 && (
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
            
            {projects && projects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Projets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {projects.map((project: any, idx: number) => (
                      <div key={idx} className="p-4 border border-border rounded-lg">
                        <h3 className="text-lg font-semibold text-navy-dark mb-1">{project.name || project.title}</h3>
                        {project.date && <p className="text-sm text-muted-foreground mb-2">{project.date}</p>}
                        {project.description && <p className="text-navy-dark mb-3">{project.description}</p>}
                        {project.url && (
                          <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sm text-navy underline">
                            Voir le projet
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab Content: Education */}
          <TabsContent value="education" className="space-y-6">
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
                            {edu.start_date && <span>• {edu.start_date} {edu.end_date ? `- ${edu.end_date}` : ""}</span>}
                            {!edu.start_date && edu.year && <span>• {edu.year}</span>}
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
            
            {certifications && certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certifications.map((cert: any, idx: number) => (
                      <div key={idx} className="p-4 border border-border rounded-lg">
                        <div className="flex items-start">
                          <CertificateIcon className="mr-3 text-navy h-5 w-5 mt-1" />
                          <div>
                            <h3 className="font-semibold text-navy-dark">{cert.name || cert.title}</h3>
                            {cert.issuer && <p className="text-sm text-navy">{cert.issuer}</p>}
                            {cert.date && <p className="text-xs text-muted-foreground mt-1">{cert.date}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab Content: Détails */}
          <TabsContent value="details" className="space-y-6">
            {languages && languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Langues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {languages.map((lang: any, idx: number) => (
                      <div key={idx} className="flex items-center p-3 border border-border rounded-lg">
                        <Languages className="h-5 w-5 mr-3 text-navy" />
                        <div>
                          <p className="font-medium">{lang.language}</p>
                          {lang.level && <p className="text-sm text-muted-foreground">{lang.level}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Première colonne */}
              <div className="space-y-6">
                {candidate.professional_values && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Valeurs professionnelles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-navy-dark">{candidate.professional_values}</p>
                    </CardContent>
                  </Card>
                )}
                
                {candidate.work_authorization && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Autorisations de travail</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-navy-dark">{candidate.work_authorization}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Deuxième colonne */}
              <div className="space-y-6">
                {candidate.professional_references && Array.isArray(candidate.professional_references) && candidate.professional_references.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Références professionnelles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {candidate.professional_references.map((ref: any, idx: number) => (
                          <div key={idx} className="p-3 border border-border rounded-lg">
                            <h4 className="font-semibold">{ref.name}</h4>
                            {ref.position && <p className="text-sm text-navy">{ref.position}</p>}
                            {ref.company && <p className="text-sm text-muted-foreground">{ref.company}</p>}
                            {ref.contact && <p className="text-sm mt-1">{ref.contact}</p>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {candidate.professional_networks && Array.isArray(candidate.professional_networks) && candidate.professional_networks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Réseaux professionnels</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {candidate.professional_networks.map((network: any, idx: number) => (
                          <div key={idx} className="flex items-center">
                            <Globe className="h-4 w-4 mr-2 text-navy" />
                            <a 
                              href={network.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-navy hover:underline"
                            >
                              {network.name || network.platform}
                            </a>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CandidateDetail;
