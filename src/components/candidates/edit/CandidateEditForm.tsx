
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { candidateService, CandidateData } from '@/services/data/candidateService';
import { candidateSchema, FormValues } from './candidateEditSchema';
import { extractCandidateFormData } from './dataExtractionUtils';
import PersonalInfoSection from './PersonalInfoSection';
import ProfessionalInfoSection from './ProfessionalInfoSection';
import SkillsSection from './SkillsSection';
import PreferencesSection from './PreferencesSection';
import AdditionalInfoSection from './AdditionalInfoSection';

interface CandidateEditFormProps {
  candidateId: string;
  onSave: () => void;
  onCancel: () => void;
}

const CandidateEditForm: React.FC<CandidateEditFormProps> = ({ 
  candidateId, 
  onSave, 
  onCancel 
}) => {
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const loadCandidateData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading candidate data for editing:', candidateId);
        
        const data = await candidateService.getCandidateById(candidateId);
        console.log('📥 Loaded candidate data:', JSON.stringify(data, null, 2));
        
        setOriginalCandidate(data);
        
        // Extraire les données avec notre fonction d'extraction
        const formData = extractCandidateFormData(data);
        console.log('🎯 Form data extracted:', JSON.stringify(formData, null, 2));
        
        // CORRECTION CRITIQUE: Réinitialiser le formulaire de manière plus robuste
        Object.keys(formData).forEach(key => {
          const value = formData[key as keyof FormValues];
          console.log(`Setting form field ${key} to:`, value);
          form.setValue(key as keyof FormValues, value);
        });
        
        // Force trigger de la validation et du rendu
        await form.trigger();
        
        console.log('✅ Form reset complete. Final form values:', form.getValues());
        
      } catch (err: any) {
        console.error("❌ Error loading candidate:", err);
        toast({
          title: "Erreur",
          description: `Impossible de charger les données: ${err.message}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCandidateData();
  }, [candidateId, form]);

  const handleSubmit = async (values: FormValues) => {
    if (!originalCandidate) {
      toast({
        title: "Erreur",
        description: "Données du candidat manquantes",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('💾 Submitting form with values:', JSON.stringify(values, null, 2));
      console.log('📋 Original candidate status:', originalCandidate.detailed_status);
      
      // CORRECTION CRITIQUE: Ne pas envoyer detailed_status dans les données de mise à jour
      // pour éviter d'écraser le statut existant
      const updateData = {
        id: candidateId,
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email || '',
        phone: values.phone || '',
        position: values.position || '',
        location: values.location || '',
        company: values.company || '',
        skills: values.skills || [],
        availability: values.availability || '',
        salary_expectations: values.salary_expectations || '',
        mobility: values.mobility || '',
        contract_type: values.contract_type || '',
        remote_preference: values.remote_preference || '',
        travel_willingness: values.travel_willingness || '',
        career_objectives: values.career_objectives || '',
        professional_values: values.professional_values || '',
        work_authorization: values.work_authorization || '',
        interests: values.interests || '',
        years_experience: typeof values.years_experience === 'number' ? values.years_experience : undefined,
        // Préserver TOUS les champs système et ne PAS inclure detailed_status
        user_id: originalCandidate.user_id,
        resume_id: originalCandidate.resume_id,
        status: originalCandidate.status,
        // IMPORTANT: On ne touche PAS au detailed_status
        score: originalCandidate.score,
        experiences: originalCandidate.experiences,
        education: originalCandidate.education,
        certifications: originalCandidate.certifications,
        languages: originalCandidate.languages,
        publications: originalCandidate.publications,
        professional_references: originalCandidate.professional_references,
        professional_networks: originalCandidate.professional_networks,
        continuous_training: originalCandidate.continuous_training,
        special_permits: originalCandidate.special_permits,
        industries: originalCandidate.industries,
        projects: originalCandidate.projects,
        profile_completeness: originalCandidate.profile_completeness
      };

      console.log('🚀 Final update data being sent (without detailed_status):', JSON.stringify(updateData, null, 2));

      const updatedCandidate = await candidateService.updateCandidate(updateData);
      console.log('✅ Update successful, result:', JSON.stringify(updatedCandidate, null, 2));
      
      toast({
        title: "Succès",
        description: "Les informations du candidat ont été mises à jour",
      });
      
      onSave();
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: `Échec de la mise à jour: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const formValues = form.watch();

  return (
    <Card className="bg-white/70 backdrop-blur-sm border border-navy/10 shadow-md overflow-hidden">
      <CardHeader>
        <CardTitle>Informations du candidat</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <PersonalInfoSection form={form} formValues={formValues} />
          <ProfessionalInfoSection form={form} formValues={formValues} />
          <SkillsSection form={form} formValues={formValues} />
          <PreferencesSection form={form} formValues={formValues} />
          <AdditionalInfoSection form={form} formValues={formValues} />
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
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
  );
};

export default CandidateEditForm;
