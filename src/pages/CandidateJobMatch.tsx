
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Briefcase } from 'lucide-react';
import JobMatchingView from '@/components/resume/JobMatchingView';

interface JobPosition {
  id: string;
  title: string;
  description?: string;
  skills?: string[];
  requirements?: string;
}

const CandidateJobMatch = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [candidateData, setCandidateData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!candidateId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch candidate data
        const { data: candidate, error: candidateError } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', candidateId)
          .single();
          
        if (candidateError) throw candidateError;
        setCandidateData(candidate);
        
        // Fetch job positions
        const { data: jobs, error: jobsError } = await supabase
          .from('job_positions')
          .select('*');
          
        if (jobsError) throw jobsError;
        setJobPositions(jobs || []);
        
        // Set default selected job if any jobs exist
        if (jobs && jobs.length > 0) {
          setSelectedJobId(jobs[0].id);
        }
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(error.message || "Une erreur s'est produite lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [candidateId]);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 size={40} className="animate-spin text-navy mb-4" />
            <p className="text-navy-dark">Chargement des données...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || !candidateData) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Briefcase size={24} className="text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-navy-dark mb-2">
              {error || "Candidat non trouvé"}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Impossible de charger les informations du candidat ou des offres d'emploi.
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft size={16} className="mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} className="mr-1" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-navy-dark">
            Match d'emploi
          </h1>
        </div>
        
        <div className="mb-6">
          <p className="text-muted-foreground">
            Compatibilité de {candidateData.first_name} {candidateData.last_name} 
            avec les offres d'emploi
          </p>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-sand mr-3">
                  <span>
                    {candidateData.first_name?.[0]}{candidateData.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold">
                    {candidateData.first_name} {candidateData.last_name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {candidateData.position || "Candidat"}
                  </p>
                </div>
              </div>
              
              <div className="flex-1 md:ml-4">
                <div className="md:max-w-md ml-auto">
                  <label className="text-sm font-medium text-navy-dark mb-1.5 block">
                    Sélectionner une offre d'emploi
                  </label>
                  <Select
                    value={selectedJobId || undefined}
                    onValueChange={(value) => setSelectedJobId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une offre d'emploi" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobPositions.map(job => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {selectedJobId && candidateId && (
          <JobMatchingView 
            candidateId={candidateId} 
            jobPositionId={selectedJobId} 
          />
        )}
      </div>
    </Layout>
  );
};

export default CandidateJobMatch;
