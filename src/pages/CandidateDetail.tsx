
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { candidateService, CandidateData } from '@/services/data/candidateService';

// Import des composants d'onglets
import ProfileTab from '@/components/candidates/detail/ProfileTab';
import DetailsTab from '@/components/candidates/detail/DetailsTab';
import ExperienceTab from '@/components/candidates/detail/ExperienceTab';
import EducationTab from '@/components/candidates/detail/EducationTab';
import NotesTab from '@/components/candidates/detail/NotesTab';
import AIAnalysisTab from '@/components/candidates/detail/AIAnalysisTab';

// Import des composants d'état
import CandidateLoading from '@/components/candidates/detail/CandidateLoading';
import CandidateError from '@/components/candidates/detail/CandidateError';

// Import des icônes
import { ArrowLeft, User, FileText, Briefcase, GraduationCap, StickyNote, Brain } from 'lucide-react';

const CandidateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'not_found' | 'access_denied' | 'generic'>('generic');

  const fetchCandidate = async () => {
    if (!id) {
      setError("Identifiant de candidat manquant");
      setErrorType('not_found');
      setLoading(false);
      return;
    }

    if (!user) {
      setError("Vous devez être connecté pour voir ce candidat");
      setErrorType('access_denied');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching candidate with ID:', id);
      console.log('Current user:', user.id);
      console.log('Is admin:', isAdmin);
      
      const candidateData = await candidateService.getCandidateById(id);
      
      if (!candidateData) {
        setError("Candidat non trouvé");
        setErrorType('not_found');
        return;
      }

      console.log('Retrieved candidate:', candidateData);
      console.log('Candidate user_id:', candidateData.user_id);
      
      // Vérifier les permissions d'accès
      if (!isAdmin && candidateData.user_id !== user.id) {
        console.log('Access denied: User is not owner and not admin');
        setError("Vous n'avez pas l'autorisation de voir ce candidat");
        setErrorType('access_denied');
        return;
      }

      setCandidate(candidateData);
    } catch (error: any) {
      console.error('Error fetching candidate:', error);
      
      // Analyser le type d'erreur
      if (error.message?.includes('not found') || error.message?.includes('non trouvé')) {
        setError("Candidat non trouvé");
        setErrorType('not_found');
      } else if (error.message?.includes('access denied') || error.message?.includes('accès refusé')) {
        setError("Accès refusé à ce candidat");
        setErrorType('access_denied');
      } else {
        setError(error.message || "Erreur lors du chargement du candidat");
        setErrorType('generic');
      }
      
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger le candidat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [id, user]);

  const handleRefresh = () => {
    fetchCandidate();
  };

  if (loading) {
    return (
      <Layout>
        <CandidateLoading />
      </Layout>
    );
  }

  if (error || !candidate) {
    return (
      <Layout>
        <CandidateError errorMessage={error} errorType={errorType} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header avec navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/candidates')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux candidats
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {candidate.first_name} {candidate.last_name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {candidate.position || 'Poste non spécifié'}
              </p>
              {isAdmin && candidate.user_id !== user?.id && (
                <p className="text-sm text-amber-600 font-medium mt-1">
                  ⚠️ Candidat d'un autre utilisateur (ID: {candidate.user_id?.substring(0, 8)}...)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Onglets principaux */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <FileText className="h-4 w-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="experience" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Expérience
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Formation
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <StickyNote className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="gap-2">
              <Brain className="h-4 w-4" />
              Analyse IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab 
              candidate={candidate} 
              isLoading={loading}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="details">
            <DetailsTab candidate={candidate} />
          </TabsContent>

          <TabsContent value="experience">
            <ExperienceTab candidate={candidate} />
          </TabsContent>

          <TabsContent value="education">
            <EducationTab candidate={candidate} />
          </TabsContent>

          <TabsContent value="notes">
            <NotesTab candidateId={candidate.id!} />
          </TabsContent>

          <TabsContent value="ai-analysis">
            <AIAnalysisTab candidate={candidate} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CandidateDetail;
