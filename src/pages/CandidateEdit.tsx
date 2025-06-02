import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { candidateService, CandidateData } from '@/services/data/candidateService';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Définir le schéma de validation pour le formulaire
const candidateSchema = z.object({
  first_name: z.string().min(1, { message: "Le prénom est requis" }),
  last_name: z.string().min(1, { message: "Le nom est requis" }),
  email: z.string().email({ message: "Email invalide" }).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  years_experience: z.union([z.number(), z.literal("")]).optional(),
  company: z.string().optional().or(z.literal("")),
  skills: z.array(z.any()).optional(),
  availability: z.string().optional().or(z.literal("")),
  salary_expectations: z.string().optional().or(z.literal("")),
  mobility: z.string().optional().or(z.literal("")),
  contract_type: z.string().optional().or(z.literal("")),
  remote_preference: z.string().optional().or(z.literal("")),
  travel_willingness: z.string().optional().or(z.literal("")),
  career_objectives: z.string().optional().or(z.literal("")),
  professional_values: z.string().optional().or(z.literal("")),
  work_authorization: z.string().optional().or(z.literal("")),
  interests: z.string().optional().or(z.literal(""))
});

type FormValues = z.infer<typeof candidateSchema>;

const CandidateEdit = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalCandidate, setOriginalCandidate] = useState<CandidateData | null>(null);
  const [skillsInput, setSkillsInput] = useState('');
  const [formKey, setFormKey] = useState(0);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      location: '',
      skills: [],
    }
  });

  // IMPROVED: Function to update form with candidate data preserving all values
  const updateFormWithData = (data: CandidateData) => {
    console.log('Updating form with fresh candidate data:', data);
    
    const formData = {
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      phone: data.phone || '',
      position: data.position || '',
      location: data.location || '',
      years_experience: data.years_experience || undefined,
      company: data.company || '',
      skills: data.skills || [],
      availability: data.availability || '',
      salary_expectations: data.salary_expectations || '',
      mobility: data.mobility || '',
      contract_type: data.contract_type || '',
      remote_preference: data.remote_preference || '',
      travel_willingness: data.travel_willingness || '',
      career_objectives: data.career_objectives || '',
      professional_values: data.professional_values || '',
      work_authorization: data.work_authorization || '',
      interests: data.interests || ''
    };
    
    console.log('Form data to set:', formData);
    console.log('IMPORTANT - Checking specific values:');
    console.log('- remote_preference:', data.remote_preference);
    console.log('- mobility:', data.mobility);
    console.log('- contract_type:', data.contract_type);
    console.log('- availability:', data.availability);
    console.log('- salary_expectations:', data.salary_expectations);
    
    // Reset the entire form with new data
    form.reset(formData);
    
    // Force a re-render to ensure Select components update
    setFormKey(prev => prev + 1);
    
    console.log('Form values after reset:', form.getValues());
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
        
        // Always fetch fresh data from the server to ensure we have the latest version
        const data = await candidateService.getCandidateById(candidateId);
        console.log('Fetched candidate data:', data);
        
        setOriginalCandidate(data);
        updateFormWithData(data);
        
      } catch (err: any) {
        console.error("Error loading candidate:", err);
        setError(`Une erreur s'est produite lors du chargement des données: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  // Re-fetch data when component becomes visible again (when user navigates back to edit)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && candidateId && originalCandidate) {
        try {
          console.log('Page became visible, refreshing candidate data');
          const freshData = await candidateService.getCandidateById(candidateId);
          console.log('Refreshed candidate data:', freshData);
          
          setOriginalCandidate(freshData);
          updateFormWithData(freshData);
        } catch (err: any) {
          console.error("Error refreshing candidate data:", err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [candidateId, originalCandidate]);

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

      // CRITICAL FIX: Prepare update data but DON'T include detailed_status
      // This ensures we preserve the existing status instead of potentially overwriting it
      const updateData = {
        id: candidateId,
        ...processedValues,
        // Preserve important system fields
        user_id: latestCandidate.user_id,
        resume_id: latestCandidate.resume_id,
        status: latestCandidate.status, // Keep the existing status
        // DON'T include detailed_status to preserve the current value
        score: latestCandidate.score,
        // Preserve all complex fields
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

  const handleAddSkill = () => {
    if (skillsInput.trim()) {
      const currentSkills = form.getValues('skills') || [];
      form.setValue('skills', [...currentSkills, skillsInput.trim()]);
      setSkillsInput('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    const currentSkills = form.getValues('skills') || [];
    form.setValue('skills', currentSkills.filter((_, i) => i !== index));
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
            <form key={formKey} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom <span className="text-red-500">*</span></Label>
                  <Input
                    id="first_name"
                    {...form.register('first_name')}
                    placeholder="Prénom"
                    className="border-navy/20"
                  />
                  {form.formState.errors.first_name && (
                    <p className="text-sm text-red-500">{form.formState.errors.first_name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom <span className="text-red-500">*</span></Label>
                  <Input
                    id="last_name"
                    {...form.register('last_name')}
                    placeholder="Nom"
                    className="border-navy/20"
                  />
                  {form.formState.errors.last_name && (
                    <p className="text-sm text-red-500">{form.formState.errors.last_name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="Email"
                    className="border-navy/20"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    {...form.register('phone')}
                    placeholder="Téléphone"
                    className="border-navy/20"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="position">Poste</Label>
                  <Input
                    id="position"
                    {...form.register('position')}
                    placeholder="Poste actuel ou recherché"
                    className="border-navy/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    {...form.register('location')}
                    placeholder="Ville, Pays"
                    className="border-navy/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Entreprise</Label>
                  <Input
                    id="company"
                    {...form.register('company')}
                    placeholder="Entreprise actuelle"
                    className="border-navy/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="years_experience">Années d'expérience</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    {...form.register('years_experience', {
                      setValueAs: (v) => v === "" 
                        ? undefined 
                        : typeof v === "string"
                          ? parseInt(v, 10) 
                          : v
                    })}
                    placeholder="Nombre d'années"
                    className="border-navy/20"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Compétences</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.watch('skills')?.map((skill, index) => (
                    <div key={index} className="bg-navy/10 px-3 py-1 rounded-full flex items-center">
                      <span>{skill}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSkill(index)} 
                        className="ml-2 text-navy/60 hover:text-navy/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="Ajouter une compétence"
                    className="border-navy/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddSkill}
                    variant="outline"
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="availability">Disponibilité</Label>
                <Input
                  id="availability"
                  {...form.register('availability')}
                  placeholder="Disponibilité"
                  className="border-navy/20"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="salary_expectations">Prétentions salariales</Label>
                  <Input
                    id="salary_expectations"
                    {...form.register('salary_expectations')}
                    placeholder="Prétentions salariales"
                    className="border-navy/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mobility">Mobilité</Label>
                  <Input
                    id="mobility"
                    {...form.register('mobility')}
                    placeholder="Mobilité géographique"
                    className="border-navy/20"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contract_type">Type de contrat</Label>
                  <Select
                    value={form.watch('contract_type') || ''}
                    onValueChange={(value) => {
                      console.log('Setting contract_type to:', value);
                      form.setValue('contract_type', value);
                    }}
                  >
                    <SelectTrigger className="border-navy/20">
                      <SelectValue placeholder="Sélectionnez un type de contrat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDI">CDI</SelectItem>
                      <SelectItem value="CDD">CDD</SelectItem>
                      <SelectItem value="Freelance">Freelance</SelectItem>
                      <SelectItem value="Stage">Stage</SelectItem>
                      <SelectItem value="Alternance">Alternance</SelectItem>
                      <SelectItem value="Intérim">Intérim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="remote_preference">Préférence de télétravail</Label>
                  <Select
                    value={form.watch('remote_preference') || ''}
                    onValueChange={(value) => {
                      console.log('Setting remote_preference to:', value);
                      form.setValue('remote_preference', value);
                    }}
                  >
                    <SelectTrigger className="border-navy/20">
                      <SelectValue placeholder="Sélectionnez une préférence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sur site">Sur site</SelectItem>
                      <SelectItem value="Hybride">Hybride</SelectItem>
                      <SelectItem value="Full remote">Full remote</SelectItem>
                      <SelectItem value="Flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interests">Centres d'intérêt</Label>
                <Textarea
                  id="interests"
                  {...form.register('interests')}
                  placeholder="Centres d'intérêt"
                  className="border-navy/20 min-h-24"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="career_objectives">Objectifs de carrière</Label>
                <Textarea
                  id="career_objectives"
                  {...form.register('career_objectives')}
                  placeholder="Objectifs de carrière"
                  className="border-navy/20 min-h-24"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="professional_values">Valeurs professionnelles</Label>
                <Textarea
                  id="professional_values"
                  {...form.register('professional_values')}
                  placeholder="Valeurs professionnelles"
                  className="border-navy/20 min-h-24"
                />
              </div>
              
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
