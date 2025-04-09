import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Edit, RefreshCw, FileText, User, Briefcase, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { candidateMatchingService } from '@/services/data/candidateMatchingService';
import { generateMockMatches } from '@/services/data/mocks/candidateMatchMocks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import MockDataAlert from '@/components/candidates/MockDataAlert';
import type { JobOffer } from '@/services/data/job-offers/types';
import type { CandidateJobMatch, CandidateMatch } from '@/services/data/candidateMatchingService';

const JobOfferDetail = () => {
  const { jobOfferId } = useParams<{ jobOfferId: string }>();
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [candidateMatches, setCandidateMatches] = useState<CandidateMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!jobOfferId) {
      setError("ID d'offre d'emploi manquant");
      setLoading(false);
      return;
    }
    
    fetchJobOffer();
  }, [jobOfferId]);
  
  const fetchJobOffer = async () => {
    if (!jobOfferId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await jobOfferService.getJobOfferById(jobOfferId);
      
      if (!data) {
        setError("Offre d'emploi non trouvée");
        setLoading(false);
        return;
      }
      
      setJobOffer(data);
      
      await fetchCandidateMatches();
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching job offer:', error);
      setError(error?.message || "Impossible de récupérer l'offre d'emploi");
      
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de récupérer l'offre d'emploi",
        variant: "destructive",
      });
      
      setLoading(false);
    }
  };
  
  const fetchCandidateMatches = async () => {
    if (!jobOfferId) return;
    
    try {
      setUsingMockData(false);
      
      try {
        const matches = await candidateMatchingService.getMatchesForJobOffer(jobOfferId);
        
        if (matches && matches.length > 0) {
          setCandidateMatches(matches);
        } else {
          console.log("No real matches found, using mock data");
          const mockMatches = generateMockMatches(jobOfferId, 8);
          setCandidateMatches(mockMatches);
          setUsingMockData(true);
        }
      } catch (error) {
        console.error('Error fetching candidate matches:', error);
        console.log("Error fetching matches, using mock data");
        const mockMatches = generateMockMatches(jobOfferId, 8);
        setCandidateMatches(mockMatches);
        setUsingMockData(true);
        
        toast({
          title: "Note",
          description: "Données de correspondance simulées affichées en raison d'un problème technique",
          variant: "default",
        });
      }
    } catch (outerError: any) {
      console.error('Outer error fetching candidate matches:', outerError);
      const mockMatches = generateMockMatches(jobOfferId, 8);
      setCandidateMatches(mockMatches);
      setUsingMockData(true);
    }
  };
  
  const handleRecalculateMatches = async () => {
    if (!jobOfferId) return;
    
    try {
      setMatchLoading(true);
      
      const success = await candidateMatchingService.calculateMatchesForJobOffer(jobOfferId);
      
      if (success) {
        toast({
          title: "Calcul terminé",
          description: "Les correspondances ont été recalculées avec succès",
        });
      } else {
        console.log("Match calculation failed, using mock data");
        const mockMatches = generateMockMatches(jobOfferId, 8);
        setCandidateMatches(mockMatches);
        setUsingMockData(true);
        
        toast({
          title: "Note",
          description: "Données de correspondance simulées affichées en raison d'un problème technique",
          variant: "default",
        });
      }
      
      await fetchCandidateMatches();
    } catch (error: any) {
      console.error('Error recalculating matches:', error);
      
      const mockMatches = generateMockMatches(jobOfferId, 8);
      setCandidateMatches(mockMatches);
      setUsingMockData(true);
      
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de recalculer les correspondances",
        variant: "destructive",
      });
    } finally {
      setMatchLoading(false);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  
  const handleViewCandidate = (candidateId: string) => {
    if (usingMockData) {
      toast({
        title: "Données de démonstration",
        description: "Ce candidat est fictif et sert à démontrer l'interface utilisateur.",
        variant: "default",
      });
      return;
    }
    navigate(`/candidates/${candidateId}`);
  };
  
  const handleEditJobOffer = () => {
    if (!jobOfferId) return;
    navigate(`/job-offers/${jobOfferId}/edit`);
  };
  
  const renderMatchedSkills = (match: CandidateJobMatch) => {
    const matchedSkills = match.match_details?.matchedSkills || 
                          match.match_details?.skills_details?.matchedSkills || 
                          [];
    
    if (matchedSkills.length > 0) {
      return matchedSkills.map((skill, index) => (
        <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-800 border-green-200">
          {skill}
        </Badge>
      ));
    } else {
      return <span className="text-xs text-gray-500 italic">Aucune compétence correspondante</span>;
    }
  };
  
  const renderMissingSkills = (match: CandidateJobMatch) => {
    const missingSkills = match.match_details?.missingSkills || 
                          match.match_details?.skills_details?.missingSkills || 
                          [];
    
    if (missingSkills.length > 0) {
      return missingSkills.map((skill, index) => (
        <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-800 border-red-200">
          {skill}
        </Badge>
      ));
    } else {
      return <span className="text-xs text-gray-500 italic">Aucune compétence manquante</span>;
    }
  };
  
  if (loading) {
    return (
      <Layout className="py-8 bg-sand/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-navy" />
            <span className="ml-2">Chargement des données...</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || !jobOffer) {
    return (
      <Layout className="py-8 bg-sand/30">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 p-6 rounded-lg">
            <h1 className="text-2xl font-bold text-red-700 mb-2">Erreur</h1>
            <p className="text-red-600">{error || "Offre d'emploi non trouvée."}</p>
            <Button 
              onClick={() => navigate('/job-offers')} 
              variant="outline" 
              className="mt-4"
            >
              Retour aux offres d'emploi
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy">{jobOffer.title}</h1>
            <div className="flex items-center text-gray-600 mt-1">
              {jobOffer.company && (
                <span className="mr-3">{jobOffer.company}</span>
              )}
              {jobOffer.location && (
                <span>{jobOffer.location}</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditJobOffer} className="gap-2">
              <Edit size={16} />
              Modifier
            </Button>
            
            <Button 
              variant="default" 
              onClick={handleRecalculateMatches} 
              disabled={matchLoading}
              className="gap-2"
            >
              {matchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />}
              Recalculer les matchings
            </Button>
          </div>
        </div>
        
        {usingMockData && <MockDataAlert />}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Détails de l'offre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobOffer.description && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="whitespace-pre-line text-gray-700">{jobOffer.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Informations générales</h3>
                    <div className="space-y-2">
                      {jobOffer.contract_type && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type de contrat:</span>
                          <span className="font-medium">{jobOffer.contract_type}</span>
                        </div>
                      )}
                      
                      {jobOffer.remote_preference && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Télétravail:</span>
                          <span className="font-medium">{jobOffer.remote_preference}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expérience requise:</span>
                        <span className="font-medium">
                          {jobOffer.experience_years_min || 0} - {jobOffer.experience_years_max || '∞'} ans
                        </span>
                      </div>
                      
                      {jobOffer.education_level && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Niveau d'éducation:</span>
                          <span className="font-medium">{jobOffer.education_level}</span>
                        </div>
                      )}
                      
                      {(jobOffer.salary_min || jobOffer.salary_max) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Salaire:</span>
                          <span className="font-medium">
                            {jobOffer.salary_min ? jobOffer.salary_min.toLocaleString() : '-'} - {jobOffer.salary_max ? jobOffer.salary_max.toLocaleString() : '-'} {jobOffer.salary_currency}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Détails supplémentaires</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Statut:</span>
                        <Badge variant={jobOffer.status === 'active' ? 'default' : 'secondary'}>
                          {jobOffer.status === 'active' ? 'Active' : jobOffer.status}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Création:</span>
                        <span className="font-medium">{formatDate(jobOffer.created_at)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mise à jour:</span>
                        <span className="font-medium">{formatDate(jobOffer.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {jobOffer.required_skills && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Compétences requises</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(jobOffer.required_skills) ? 
                        jobOffer.required_skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        ))
                        : 
                        Object.values(jobOffer.required_skills).map((skill, index) => (
                          <Badge key={index} variant="secondary">{String(skill)}</Badge>
                        ))
                      }
                      {(!jobOffer.required_skills || 
                        (Array.isArray(jobOffer.required_skills) && jobOffer.required_skills.length === 0) || 
                        (typeof jobOffer.required_skills === 'object' && Object.keys(jobOffer.required_skills).length === 0)) && (
                        <span className="text-gray-500 italic">Aucune compétence spécifiée</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Statistiques de matching</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Candidats matchés</span>
                    <span className="text-sm font-medium">{candidateMatches.length}</span>
                  </div>
                  
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Score moyen</span>
                    <span className="text-sm font-medium">
                      {candidateMatches.length > 0 
                        ? Math.round(candidateMatches.reduce((sum, match) => sum + match.match.match_score, 0) / candidateMatches.length)
                        : 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Meilleur score</span>
                    <span className="text-sm font-medium">
                      {candidateMatches.length > 0 
                        ? Math.max(...candidateMatches.map(match => match.match.match_score))
                        : 0}%
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">Distribution des scores</h3>
                  {candidateMatches.length > 0 ? (
                    <div className="space-y-3">
                      {[
                        { label: '90-100%', min: 90, max: 100 },
                        { label: '75-89%', min: 75, max: 89 },
                        { label: '50-74%', min: 50, max: 74 },
                        { label: '25-49%', min: 25, max: 49 },
                        { label: '0-24%', min: 0, max: 24 },
                      ].map((range) => {
                        const count = candidateMatches.filter(m => 
                          m.match.match_score >= range.min && m.match.match_score <= range.max
                        ).length;
                        const percentage = candidateMatches.length > 0 
                          ? Math.round((count / candidateMatches.length) * 100) 
                          : 0;
                        
                        return (
                          <div key={range.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{range.label}</span>
                              <span>{count} ({percentage}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 italic py-4">
                      Aucun candidat matchant disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mb-4">
          <h2 className="text-xl font-bold text-navy mb-4">Candidats correspondants</h2>
          
          <Tabs defaultValue="ranked">
            <TabsList className="mb-4">
              <TabsTrigger value="ranked">
                <User className="h-4 w-4 mr-2" />
                Par score global
              </TabsTrigger>
              <TabsTrigger value="skills">
                <FileText className="h-4 w-4 mr-2" />
                Par compétences
              </TabsTrigger>
              <TabsTrigger value="experience">
                <Briefcase className="h-4 w-4 mr-2" />
                Par expérience
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ranked">
              {candidateMatches.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {candidateMatches
                    .sort((a, b) => b.match.match_score - a.match.match_score)
                    .map((item) => (
                      <Card key={item.candidate.id} className="overflow-hidden">
                        <div className="flex">
                          <div className="w-24 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{item.match.match_score}%</div>
                              <div className="text-xs text-blue-100">Match</div>
                            </div>
                          </div>
                          
                          <CardContent className="flex-1 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                              <div className="md:col-span-2">
                                <h3 className="text-lg font-semibold">
                                  {item.candidate.first_name} {item.candidate.last_name}
                                </h3>
                                <p className="text-gray-600">{item.candidate.position || 'Aucun poste spécifié'}</p>
                                <p className="text-sm text-gray-500 mt-1">{item.candidate.location || 'Aucune localisation'}</p>
                                <div className="mt-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleViewCandidate(item.candidate.id)}
                                    className="gap-1"
                                  >
                                    <User size={14} />
                                    Voir profil
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="md:col-span-3">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                                  <div>
                                    <div className="text-sm text-gray-500">Compétences</div>
                                    <div className="flex items-center mt-1">
                                      <Progress value={item.match.skills_match_score} className="h-2 flex-1 mr-2" />
                                      <span className="text-sm font-medium">{item.match.skills_match_score}%</span>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-sm text-gray-500">Expérience</div>
                                    <div className="flex items-center mt-1">
                                      <Progress value={item.match.experience_match_score} className="h-2 flex-1 mr-2" />
                                      <span className="text-sm font-medium">{item.match.experience_match_score}%</span>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-sm text-gray-500">Éducation</div>
                                    <div className="flex items-center mt-1">
                                      <Progress value={item.match.education_match_score} className="h-2 flex-1 mr-2" />
                                      <span className="text-sm font-medium">{item.match.education_match_score}%</span>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-sm text-gray-500">Localisation</div>
                                    <div className="flex items-center mt-1">
                                      <Progress value={item.match.location_match_score} className="h-2 flex-1 mr-2" />
                                      <span className="text-sm font-medium">{item.match.location_match_score}%</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-3">
                                  <h4 className="text-sm font-semibold mb-1">Compétences correspondantes:</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {renderMatchedSkills(item.match)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-muted rounded-lg">
                  <h3 className="text-lg font-medium">Aucun candidat correspondant</h3>
                  <p className="text-muted-foreground mt-2">
                    Il n'y a actuellement aucun candidat qui corresponde à cette offre d'emploi.
                  </p>
                  <Button onClick={handleRecalculateMatches} className="mt-4 gap-2">
                    {matchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />}
                    Recalculer les correspondances
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="skills">
              {candidateMatches.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {candidateMatches
                    .sort((a, b) => b.match.skills_match_score - a.match.skills_match_score)
                    .map((item) => (
                      <Card key={item.candidate.id}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {item.candidate.first_name} {item.candidate.last_name}
                              </h3>
                              <p className="text-gray-600">{item.candidate.position || 'Aucun poste spécifié'}</p>
                              <p className="text-sm text-gray-500">{item.candidate.location || 'Aucune localisation'}</p>
                              <div className="mt-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleViewCandidate(item.candidate.id)}
                                  className="gap-1"
                                >
                                  <User size={14} />
                                  Voir profil
                                </Button>
                              </div>
                            </div>
                            
                            <div className="md:col-span-3">
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium">Match de compétences</span>
                                  <span className="font-bold text-lg">{item.match.skills_match_score}%</span>
                                </div>
                                <Progress value={item.match.skills_match_score} className="h-2" />
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Compétences correspondantes:</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {renderMatchedSkills(item.match)}
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Compétences manquantes:</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {renderMissingSkills(item.match)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-3">
                                <h4 className="text-sm font-semibold mb-1">Autres scores:</h4>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <div className="text-xs text-gray-500">Global: {item.match.match_score}%</div>
                                    <Progress value={item.match.match_score} className="h-1 mt-1" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500">Expérience: {item.match.experience_match_score}%</div>
                                    <Progress value={item.match.experience_match_score} className="h-1 mt-1" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500">Éducation: {item.match.education_match_score}%</div>
                                    <Progress value={item.match.education_match_score} className="h-1 mt-1" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-muted rounded-lg">
                  <h3 className="text-lg font-medium">Aucun candidat correspondant</h3>
                  <p className="text-muted-foreground mt-2">
                    Il n'y a actuellement aucun candidat qui corresponde à cette offre d'emploi.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="experience">
              {candidateMatches.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {candidateMatches
                    .sort((a, b) => b.match.experience_match_score - a.match.experience_match_score)
                    .map((item) => (
                      <Card key={item.candidate.id}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="md:col-span-2">
                              <h3 className="text-lg font-semibold">
                                {item.candidate.first_name} {item.candidate.last_name}
                              </h3>
                              <p className="text-gray-600">{item.candidate.position || 'Aucun poste spécifié'}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-gray-500">
                                  {item.candidate.years_experience || 0} an{item.candidate.years_experience !== 1 ? 's' : ''} d'expérience
                                </span>
                                <Badge variant="secondary">
                                  {item.match.experience_match_score}%
                                </Badge>
                              </div>
                              <div className="mt-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleViewCandidate(item.candidate.id)}
                                  className="gap-1"
                                >
                                  <User size={14} />
                                  Voir profil
                                </Button>
                              </div>
                            </div>
                            
                            <div className="md:col-span-4">
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium">Match d'expérience</span>
                                  <span className="font-bold text-lg">{item.match.experience_match_score}%</span>
                                </div>
                                <Progress value={item.match.experience_match_score} className="h-2" />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold mb-1">Expérience du candidat:</h4>
                                  <p className="text-sm">
                                    {item.candidate.years_experience || 0} an{item.candidate.years_experience !== 1 ? 's' : ''}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {item.candidate.experiences && Array.isArray(item.candidate.experiences) && item.candidate.experiences.length > 0 
                                      ? `${item.candidate.experiences.length} expérience(s) professionnelle(s)` 
                                      : 'Aucune expérience détaillée'}
                                  </p>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-semibold mb-1">Expérience requise:</h4>
                                  <p className="text-sm">
                                    {jobOffer.experience_years_min || 0} - {jobOffer.experience_years_max || '∞'} ans
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-3">
                                <h4 className="text-sm font-semibold mb-1">Autres scores:</h4>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <div className="text-xs text-gray-500">Global: {item.match.match_score}%</div>
                                    <Progress value={item.match.match_score} className="h-1 mt-1" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500">Compétences: {item.match.skills_match_score}%</div>
                                    <Progress value={item.match.skills_match_score} className="h-1 mt-1" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500">Éducation: {item.match.education_match_score}%</div>
                                    <Progress value={item.match.education_match_score} className="h-1 mt-1" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-muted rounded-lg">
                  <h3 className="text-lg font-medium">Aucun candidat correspondant</h3>
                  <p className="text-muted-foreground mt-2">
                    Il n'y a actuellement aucun candidat qui corresponde à cette offre d'emploi.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default JobOfferDetail;
