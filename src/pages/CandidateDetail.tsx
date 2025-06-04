
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Briefcase, GraduationCap, FileText, MessageSquare, Settings } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import CandidateLoading from '@/components/candidates/detail/CandidateLoading';
import CandidateError from '@/components/candidates/detail/CandidateError';
import ProfileTab from '@/components/candidates/detail/ProfileTab';
import DetailsTab from '@/components/candidates/detail/DetailsTab';
import ExperienceTab from '@/components/candidates/detail/ExperienceTab';
import EducationTab from '@/components/candidates/detail/EducationTab';
import NotesTab from '@/components/candidates/detail/NotesTab';
import StatusSelector from '@/components/candidates/detail/StatusSelector';
import EnhancedScoreDisplay from '@/components/candidates/detail/EnhancedScoreDisplay';
import ExportProfileButton from '@/components/candidates/detail/ExportProfileButton';
import { getCompleteCandidateData } from '@/services/resume/candidateDataService';
import { CandidateData } from '@/services/data/candidateService';
import { useCandidateData } from '@/context/CandidateDataContext';

const CandidateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const { onCandidateUpdated } = useCandidateData();

  const loadCandidateData = async () => {
    if (!id) {
      setError('Aucun ID de candidat spécifié');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching candidate data for ID:', id);
      setLoading(true);
      const candidateData = await getCompleteCandidateData(id);
      console.log('📥 Received candidate data:', candidateData);
      
      if (!candidateData) {
        setError('Candidat non trouvé');
      } else {
        // Convert the data to match our expected CandidateData type with safe type conversion
        const formattedCandidate: CandidateData = {
          ...candidateData,
          detailed_status: candidateData.detailed_status || 'contact',
          skills: Array.isArray(candidateData.skills) ? candidateData.skills : [],
          experiences: Array.isArray(candidateData.experiences) ? candidateData.experiences : [],
          education: Array.isArray(candidateData.education) ? candidateData.education : [],
          certifications: Array.isArray(candidateData.certifications) ? candidateData.certifications : [],
          languages: Array.isArray(candidateData.languages) ? candidateData.languages : [],
          publications: Array.isArray(candidateData.publications) ? candidateData.publications : [],
          professional_references: Array.isArray(candidateData.professional_references) ? candidateData.professional_references : [],
          professional_networks: Array.isArray(candidateData.professional_networks) ? candidateData.professional_networks : [],
          continuous_training: Array.isArray(candidateData.continuous_training) ? candidateData.continuous_training : [],
          special_permits: Array.isArray(candidateData.special_permits) ? candidateData.special_permits : [],
          industries: Array.isArray(candidateData.industries) ? candidateData.industries : [],
          projects: Array.isArray(candidateData.projects) ? candidateData.projects : []
        };
        setCandidate(formattedCandidate);
        setError(null);
      }
    } catch (error: any) {
      console.error('❌ Error fetching candidate:', error);
      setError(error.message || 'Erreur lors du chargement du candidat');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // Refresh candidate data locally
    console.log(`🟢 Status changed for candidate ${id}: ${newStatus}`);
    
    // Update local state first
    if (candidate) {
      setCandidate({
        ...candidate,
        detailed_status: newStatus
      });
    }

    // Then refresh the global candidate list
    await onCandidateUpdated();
  };

  // Load candidate data on component mount
  useEffect(() => {
    loadCandidateData();
  }, [id]);

  // Handle loading and error states
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
        <CandidateError errorMessage={error || 'Candidat introuvable'} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        {/* Header with navigation and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate('/candidates')}>
              <ArrowLeft size={16} />
            </Button>
            <h1 className="text-2xl font-bold">
              {candidate.first_name} {candidate.last_name}
            </h1>
            <Badge variant="outline" className="ml-2">
              {candidate.position || 'Non spécifié'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Status Selector with global refresh capability */}
            <StatusSelector 
              candidateId={id || ''} 
              currentStatus={candidate.detailed_status || 'contact'} 
              onStatusChange={handleStatusChange}
              onGlobalRefresh={onCandidateUpdated}
            />
            
            <ExportProfileButton candidate={candidate} />
          </div>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with score */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Score du candidat</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedScoreDisplay candidate={candidate} />
              </CardContent>
            </Card>
            
            {/* Navigation tabs for mobile */}
            <div className="block lg:hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 w-full mb-4">
                  <TabsTrigger value="profile" className="flex flex-col items-center py-2">
                    <User size={16} />
                    <span className="text-xs mt-1">Profil</span>
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex flex-col items-center py-2">
                    <Settings size={16} />
                    <span className="text-xs mt-1">Détails</span>
                  </TabsTrigger>
                  <TabsTrigger value="experience" className="flex flex-col items-center py-2">
                    <Briefcase size={16} />
                    <span className="text-xs mt-1">Expériences</span>
                  </TabsTrigger>
                  <TabsTrigger value="education" className="flex flex-col items-center py-2">
                    <GraduationCap size={16} />
                    <span className="text-xs mt-1">Formation</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex flex-col items-center py-2">
                    <MessageSquare size={16} />
                    <span className="text-xs mt-1">Notes</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Desktop sidebar navigation */}
            <div className="hidden lg:block">
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-1 py-2">
                    <Button 
                      variant={activeTab === 'profile' ? 'default' : 'ghost'} 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab('profile')}
                    >
                      <User size={16} className="mr-2" />
                      Profil
                    </Button>
                    <Button 
                      variant={activeTab === 'details' ? 'default' : 'ghost'} 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab('details')}
                    >
                      <Settings size={16} className="mr-2" />
                      Détails
                    </Button>
                    <Button 
                      variant={activeTab === 'experience' ? 'default' : 'ghost'} 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab('experience')}
                    >
                      <Briefcase size={16} className="mr-2" />
                      Expériences
                    </Button>
                    <Button 
                      variant={activeTab === 'education' ? 'default' : 'ghost'} 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab('education')}
                    >
                      <GraduationCap size={16} className="mr-2" />
                      Formation
                    </Button>
                    <Button 
                      variant={activeTab === 'notes' ? 'default' : 'ghost'} 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab('notes')}
                    >
                      <MessageSquare size={16} className="mr-2" />
                      Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Mobile tabs content */}
            <div className="block lg:hidden">
              <Tabs value={activeTab} className="w-full">
                <TabsContent value="profile">
                  <ProfileTab candidate={candidate} />
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
                  <NotesTab candidate={candidate} onDataUpdate={loadCandidateData} />
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Desktop content */}
            <div className="hidden lg:block">
              {activeTab === 'profile' && (
                <ProfileTab candidate={candidate} />
              )}
              {activeTab === 'details' && (
                <DetailsTab candidate={candidate} />
              )}
              {activeTab === 'experience' && (
                <ExperienceTab candidate={candidate} />
              )}
              {activeTab === 'education' && (
                <EducationTab candidate={candidate} />
              )}
              {activeTab === 'notes' && (
                <NotesTab candidate={candidate} onDataUpdate={loadCandidateData} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CandidateDetail;
