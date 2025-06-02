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

  // IMPROVED: Better data extraction function that handles special object format
  const extractValue = (field: any): string => {
    console.log('Extracting value from field:', field, 'Type:', typeof field);
    
    // If null or undefined, return empty string
    if (field === null || field === undefined) {
      return '';
    }
    
    // If it's already a string, return it directly
    if (typeof field === 'string') {
      return field;
    }
    
    // Handle the special object format {_type: "undefined", value: "undefined"} or {value: "something"}
    if (typeof field === 'object' && !Array.isArray(field)) {
      // If it has the _type: "undefined" structure, check if there's a real value
      if (field._type === 'undefined') {
        // If the value is also "undefined" string, return empty
        if (field.value === 'undefined' || field.value === undefined || field.value === null) {
          return '';
        }
        // Otherwise return the actual value
        return String(field.value);
      }
      
      // If it has a value property, use it
      if (field.hasOwnProperty('value')) {
        if (field.value === 'undefined' || field.value === undefined || field.value === null) {
          return '';
        }
        return String(field.value);
      }
      
      // Try to stringify the object if it's not empty
      try {
        const stringified = JSON.stringify(field);
        if (stringified !== '{}' && stringified !== 'null') {
          return stringified;
        }
      } catch (e) {
        console.error('Error stringifying field:', e);
      }
      
      return '';
    }
    
    // For any other type, convert to string
    return String(field);
  };

  // CRITICAL FIX: Properly populate form with candidate data
  const populateFormWithCandidateData = (data: CandidateData) => {
    console.log('Populating form with candidate data:', data);
    
    // Helper function to safely get number values  
    const safeNumber = (value: any): number | undefined => {
      if (value === null || value === undefined) return undefined;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      if (typeof value === 'object' && value.value !== undefined) {
        const parsed = parseInt(String(value.value), 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    };

    // Helper function to safely get array values
    const safeArray = (value: any): any[] => {
      if (Array.isArray(value)) return value;
      if (value === null || value === undefined) return [];
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [value];
        }
      }
      return [];
    };
    
    // Extract values using the improved extraction function
    const formData = {
      first_name: extractValue(data.first_name),
      last_name: extractValue(data.last_name),
      email: extractValue(data.email),
      phone: extractValue(data.phone),
      position: extractValue(data.position),
      location: extractValue(data.location),
      years_experience: safeNumber(data.years_experience),
      company: extractValue(data.company),
      skills: safeArray(data.skills),
      availability: extractValue(data.availability),
      salary_expectations: extractValue(data.salary_expectations),
      mobility: extractValue(data.mobility),
      contract_type: extractValue(data.contract_type),
      remote_preference: extractValue(data.remote_preference),
      travel_willingness: extractValue(data.travel_willingness),
      career_objectives: extractValue(data.career_objectives),
      professional_values: extractValue(data.professional_values),
      work_authorization: extractValue(data.work_authorization),
      interests: extractValue(data.interests)
    };
    
    console.log('Extracted form data:', formData);
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom <span className="text-red-500">*</span></Label>
                  <Input
                    id="first_name"
                    {...form.register('first_name')}
                    value={formValues.first_name || ''}
                    onChange={(e) => form.setValue('first_name', e.target.value)}
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
                    value={formValues.last_name || ''}
                    onChange={(e) => form.setValue('last_name', e.target.value)}
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
                    value={formValues.email || ''}
                    onChange={(e) => form.setValue('email', e.target.value)}
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
                    value={formValues.phone || ''}
                    onChange={(e) => form.setValue('phone', e.target.value)}
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
                    value={formValues.position || ''}
                    onChange={(e) => form.setValue('position', e.target.value)}
                    placeholder="Poste actuel ou recherché"
                    className="border-navy/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    {...form.register('location')}
                    value={formValues.location || ''}
                    onChange={(e) => form.setValue('location', e.target.value)}
                    placeholder="Ville, Pays"
                    className="border-navy/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Entreprise</Label>
                  <Input
                    id="company"
                    {...form.register('company')}
                    value={formValues.company || ''}
                    onChange={(e) => form.setValue('company', e.target.value)}
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
                    value={formValues.years_experience || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      form.setValue('years_experience', value);
                    }}
                    placeholder="Nombre d'années"
                    className="border-navy/20"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Compétences</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formValues.skills?.map((skill, index) => (
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
                  value={formValues.availability || ''}
                  onChange={(e) => form.setValue('availability', e.target.value)}
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
                    value={formValues.salary_expectations || ''}
                    onChange={(e) => form.setValue('salary_expectations', e.target.value)}
                    placeholder="Prétentions salariales"
                    className="border-navy/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mobility">Mobilité</Label>
                  <Input
                    id="mobility"
                    {...form.register('mobility')}
                    value={formValues.mobility || ''}
                    onChange={(e) => form.setValue('mobility', e.target.value)}
                    placeholder="Mobilité géographique"
                    className="border-navy/20"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contract_type">Type de contrat</Label>
                  <Select
                    value={formValues.contract_type || ''}
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
                    value={formValues.remote_preference || ''}
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
                  value={formValues.interests || ''}
                  onChange={(e) => form.setValue('interests', e.target.value)}
                  placeholder="Centres d'intérêt"
                  className="border-navy/20 min-h-24"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="career_objectives">Objectifs de carrière</Label>
                <Textarea
                  id="career_objectives"
                  {...form.register('career_objectives')}
                  value={formValues.career_objectives || ''}
                  onChange={(e) => form.setValue('career_objectives', e.target.value)}
                  placeholder="Objectifs de carrière"
                  className="border-navy/20 min-h-24"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="professional_values">Valeurs professionnelles</Label>
                <Textarea
                  id="professional_values"
                  {...form.register('professional_values')}
                  value={formValues.professional_values || ''}
                  onChange={(e) => form.setValue('professional_values', e.target.value)}
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
