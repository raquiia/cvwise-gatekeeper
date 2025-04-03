
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { candidateDataService } from '@/services/data/candidateDataService';
import { CandidateData } from '@/services/data/resumeDataService';
import { ArrowLeft, User, MapPin, Phone, Mail, Briefcase, Award, Calendar, FileText, Loader2 } from 'lucide-react';

const CandidateDetail = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!candidateId) return;

      try {
        setLoading(true);
        const data = await candidateDataService.getCandidateById(candidateId);
        
        if (!data) {
          setError("Candidat non trouvé");
        } else {
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
        
        {/* Candidate Profile */}
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CandidateDetail;
