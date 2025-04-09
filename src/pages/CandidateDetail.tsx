
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { candidateService } from '@/services/data/candidateService';
import { CandidateData } from '@/services/data/candidateService';
import { ArrowLeft, Briefcase, FileText } from 'lucide-react';
import { processCandidateData } from '@/utils/candidateUtils';

// Import the component tabs
import ProfileTab from '@/components/candidates/detail/ProfileTab';
import ExperienceTab from '@/components/candidates/detail/ExperienceTab';
import EducationTab from '@/components/candidates/detail/EducationTab';
import DetailsTab from '@/components/candidates/detail/DetailsTab';
import CandidateLoading from '@/components/candidates/detail/CandidateLoading';
import CandidateError from '@/components/candidates/detail/CandidateError';

const CandidateDetail = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!candidateId) {
        console.error("No candidate ID provided");
        setError("Identifiant de candidat manquant");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching candidate with ID:", candidateId);
        
        // Use candidateService instead of candidateDataService
        const data = await candidateService.getCandidateById(candidateId);
        
        if (!data) {
          console.log("Candidate not found:", candidateId);
          setError("Candidat non trouvé");
        } else {
          console.log("Candidate data retrieved successfully:", data);
          console.log("Raw data type:", typeof data);
          
          if (typeof data === 'object') {
            console.log("Data has experiences:", Boolean(data.experiences));
            console.log("Data has education:", Boolean(data.education));
            
            if (data.experiences) {
              console.log("Experiences type:", typeof data.experiences);
              console.log("Experiences sample:", JSON.stringify(data.experiences).substring(0, 100) + "...");
            }
            
            if (data.education) {
              console.log("Education type:", typeof data.education);
              console.log("Education sample:", JSON.stringify(data.education).substring(0, 100) + "...");
            }
          }
          
          // Process the data to ensure arrays and properties are correctly formatted
          const processedData = processCandidateData(data);
          console.log("Processed candidate data:", processedData);
          
          // Additional logging to help debug
          console.log("Processed experiences:", processedData.experiences);
          console.log("Processed education:", processedData.education);
          console.log("Processed languages:", processedData.languages);
          console.log("Processed certifications:", processedData.certifications);
          
          setCandidate(processedData);
        }
      } catch (err: any) {
        console.error("Error loading candidate:", err);
        setError(`Une erreur s'est produite lors du chargement des données: ${err.message}`);
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
          <CandidateLoading />
        </div>
      </Layout>
    );
  }

  if (error || !candidate) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <CandidateError errorMessage={error} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
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
          
          <TabsContent value="profile">
            <ProfileTab candidate={candidate} />
          </TabsContent>
          
          <TabsContent value="experience">
            <ExperienceTab candidate={candidate} />
          </TabsContent>
          
          <TabsContent value="education">
            <EducationTab candidate={candidate} />
          </TabsContent>
          
          <TabsContent value="details">
            <DetailsTab candidate={candidate} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CandidateDetail;
