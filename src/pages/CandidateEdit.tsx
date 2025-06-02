
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { candidateService, CandidateData } from '@/services/data/candidateService';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { candidateSchema, FormValues } from '@/components/candidates/edit/candidateEditSchema';
import { extractFormDataFromCandidate } from '@/components/candidates/edit/dataExtraction';
import PersonalInfoSection from '@/components/candidates/edit/PersonalInfoSection';
import ProfessionalInfoSection from '@/components/candidates/edit/ProfessionalInfoSection';
import SkillsSection from '@/components/candidates/edit/SkillsSection';
import PreferencesSection from '@/components/candidates/edit/PreferencesSection';
import AdditionalInfoSection from '@/components/candidates/edit/AdditionalInfoSection';

const CandidateEdit = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalCandidate, setOriginalCandidate] = useState<CandidateData | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      location: '',
      company: '',
      skills: [],
      availability: '',
      salary_expectations: '',
      mobility: '',
      contract_type: '',
      remote_preference: '',
      travel_willingness: '',
      career_objectives: '',
      professional_values: '',
      work_authorization: '',
      interests: ''
    }
  });

  const populateFormWithCandidateData = (data: CandidateData) => {
    console.log('Populating form with candidate data:', data);
    
    const formData = extractFormDataFromCandidate(data);
    
    console.log('Company field extracted:', formData.company);
    console.log('Remote preference extracted:', formData.remote_preference);
    console.log('Contract type extracted:', formData.contract_type);
    
    // Use reset to populate the entire form at once
    form.reset(formData);
    
    // Force re-render by updating the form values
    setTimeout(() => {
      Object.keys(formData).forEach(key => {
        if (key !== 'skills' && key !== 'years_experience') {
          form.setValue(key as keyof FormValues, (formData as any)[key]);
        }
      });
    }, 100);
  };

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!candidateId) {
        setError("Identifiant de candidat manquant");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching candidate data for editing:', candidateId);
        
        const data = await candidateService.getCandidateById(candidateId);
        console.log('Raw fetched candidate data:', data);
        
        setOriginalCandidate(data);
        populateFormWithCandidateData(data);
        
      } catch (err: any) {
        console.error("Error loading candidate:", err);
        setError(`Une erreur s'est produite lors du chargement des données: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  const onSubmit = async (values: FormValues) => {
    if (!candidateId || !originalCandidate) {
      toast({
        title: "Erreur",
        description: "Données du candidat manquantes",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Submitting form with values:', values);
      console.log('Original candidate data:', originalCandidate);
      
      // Re-fetch the latest data to ensure we have the most current version
      const latestCandidate = await candidateService.getCandidateById(candidateId);
      console.log('Latest candidate data before update:', latestCandidate);
      
      // Fix for the TypeScript error: ensure years_experience is properly typed
      const processedValues = {
        ...values,
        years_experience: values.years_experience === "" 
          ? undefined 
          : typeof values.years_experience === "string"
            ? parseInt(values.years_experience, 10) 
            : values.years_experience
      };

      // CRITICAL FIX: Prepare update data preserving existing values that aren't being updated
      const updateData = {
        id: candidateId,
        ...processedValues,
        // Preserve important system fields from latest data
        user_id: latestCandidate.user_id,
        resume_id: latestCandidate.resume_id,
        status: latestCandidate.status,
        detailed_status: latestCandidate.detailed_status, // Preserve existing detailed_status
        score: latestCandidate.score,
        // Preserve all complex fields that aren't in the form
        experiences: latestCandidate.experiences,
        education: latestCandidate.education,
        certifications: latestCandidate.certifications,
        languages: latestCandidate.languages,
        publications: latestCandidate.publications,
        professional_references: latestCandidate.professional_references,
        professional_networks: latestCandidate.professional_networks,
        continuous_training: latestCandidate.continuous_training,
        special_permits: latestCandidate.special_permits,
        industries: latestCandidate.industries,
        projects: latestCandidate.projects,
        profile_completeness: latestCandidate.profile_completeness
      };

      console.log('Final update data being sent:', updateData);

      const updatedCandidate = await candidateService.updateCandidate(updateData);
      console.log('Update successful, result:', updatedCandidate);
      
      toast({
        title: "Succès",
        description: "Les informations du candidat ont été mises à jour",
      });
      
      navigate(`/candidates/${candidateId}`);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: `Échec de la mise à jour: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-700">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => navigate('/candidates')}
            >
              Retour à la liste des candidats
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Get current form values for controlled components
  const formValues = form.watch();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground mb-4 hover:bg-navy/5 transition-all duration-300 group"
            onClick={() => navigate(`/candidates/${candidateId}`)}
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="border-b border-transparent group-hover:border-muted-foreground transition-colors duration-300">Retour au profil</span>
          </Button>
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between">
            <div className="relative animate-fade-in">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700">
                Modifier le profil candidat
              </h1>
              <div className="absolute -bottom-1 left-0 w-1/4 h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
            </div>
          </div>
        </div>

        <Card className="bg-white/70 backdrop-blur-sm border border-navy/10 shadow-md overflow-hidden mb-8">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <PersonalInfoSection form={form} formValues={formValues} />
              <ProfessionalInfoSection form={form} formValues={formValues} />
              <SkillsSection form={form} formValues={formValues} />
              <PreferencesSection form={form} formValues={formValues} />
              <AdditionalInfoSection form={form} formValues={formValues} />
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/candidates/${candidateId}`)}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  <Save size={16} className="mr-2" />
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CandidateEdit;
