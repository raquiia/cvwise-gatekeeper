import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, Info } from 'lucide-react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from '@/hooks/use-toast';
import { jobOfferService } from '@/services/data/jobOfferService';
import { candidateMatchingService, JobOfferSuggestion } from '@/services/data/candidateMatchingService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { JobOffer } from '@/services/data/jobOfferService';

const jobOfferSchema = z.object({
  title: z.string().min(3, { message: "Le titre doit comporter au moins 3 caractères" }),
  company: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  contract_type: z.string().optional(),
  remote_preference: z.string().optional(),
  experience_years_min: z.coerce.number().min(0).optional(),
  experience_years_max: z.coerce.number().min(0).optional(),
  education_level: z.string().optional(),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  salary_currency: z.string().default("EUR"),
  status: z.string().default("active"),
  required_skills: z.array(z.string()).default([]),
  preferred_skills: z.array(z.string()).default([]),
  required_languages: z.array(z.object({
    language: z.string(),
    level: z.string()
  })).default([]),
  mobility: z.string().optional(),
  benefits: z.array(z.string()).default([]),
});

type JobOfferFormValues = z.infer<typeof jobOfferSchema>;

interface JobOfferFormProps {
  jobOfferId?: string;
  isEditing?: boolean;
}

const JobOfferForm: React.FC<JobOfferFormProps> = ({ jobOfferId, isEditing = false }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [skillInput, setSkillInput] = useState('');
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [suggestion, setSuggestion] = useState<JobOfferSuggestion | null>(null);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<JobOfferFormValues>({
    resolver: zodResolver(jobOfferSchema),
    defaultValues: {
      title: "",
      contract_type: "CDI",
      remote_preference: "Sur site",
      status: "active",
      required_skills: [],
      preferred_skills: [],
      required_languages: [],
      benefits: [],
      salary_currency: "EUR",
    },
  });
  
  useEffect(() => {
    const fetchJobOffer = async () => {
      if (!isEditing || !jobOfferId) return;
      
      try {
        setInitialLoading(true);
        const jobOffer = await jobOfferService.getJobOfferById(jobOfferId);
        
        if (jobOffer) {
          form.reset({
            title: jobOffer.title || "",
            company: jobOffer.company || "",
            location: jobOffer.location || "",
            description: jobOffer.description || "",
            contract_type: jobOffer.contract_type || "CDI",
            remote_preference: jobOffer.remote_preference || "Sur site",
            experience_years_min: jobOffer.experience_years_min || 0,
            experience_years_max: jobOffer.experience_years_max || 0,
            education_level: jobOffer.education_level || "",
            salary_min: jobOffer.salary_min || 0,
            salary_max: jobOffer.salary_max || 0,
            salary_currency: jobOffer.salary_currency || "EUR",
            status: jobOffer.status || "active",
            required_skills: Array.isArray(jobOffer.required_skills) 
              ? jobOffer.required_skills.map(skill => String(skill))
              : Object.values(jobOffer.required_skills || {}).map(skill => String(skill)),
            preferred_skills: Array.isArray(jobOffer.preferred_skills)
              ? jobOffer.preferred_skills.map(skill => String(skill))
              : Object.values(jobOffer.preferred_skills || {}).map(skill => String(skill)),
            required_languages: Array.isArray(jobOffer.required_languages)
              ? jobOffer.required_languages.map(lang => typeof lang === 'object' ? lang : { language: String(lang), level: 'Courant' })
              : Object.values(jobOffer.required_languages || {}).map(lang => typeof lang === 'object' ? lang : { language: String(lang), level: 'Courant' }),
            mobility: jobOffer.mobility || "",
            benefits: Array.isArray(jobOffer.benefits) ? jobOffer.benefits : [],
          });
        }
      } catch (error: any) {
        console.error('Error fetching job offer:', error);
        toast({
          title: "Erreur",
          description: error?.message || "Impossible de récupérer l'offre d'emploi",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchJobOffer();
  }, [isEditing, jobOfferId, form]);
  
  const onSubmit = async (values: JobOfferFormValues) => {
    try {
      setLoading(true);
      
      if (!values.title) {
        throw new Error("Le titre est requis");
      }
      
      if (isEditing && jobOfferId) {
        await jobOfferService.updateJobOffer(jobOfferId, values);
        toast({
          title: "Offre d'emploi mise à jour",
          description: "L'offre d'emploi a été mise à jour avec succès",
        });
      } else {
        const newJobOffer = await jobOfferService.createJobOffer(values as Omit<JobOffer, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
        toast({
          title: "Offre d'emploi créée",
          description: "L'offre d'emploi a été créée avec succès",
        });
      }
      
      navigate('/job-offers');
    } catch (error: any) {
      console.error('Error saving job offer:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de sauvegarder l'offre d'emploi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const addRequiredSkill = () => {
    if (!skillInput.trim()) return;
    
    const currentSkills = form.getValues('required_skills') || [];
    if (!currentSkills.includes(skillInput.trim())) {
      form.setValue('required_skills', [...currentSkills, skillInput.trim()]);
    }
    setSkillInput('');
  };
  
  const removeRequiredSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues('required_skills') || [];
    form.setValue('required_skills', currentSkills.filter(skill => skill !== skillToRemove));
  };

  const generateSuggestions = async () => {
    const jobTitle = form.getValues('title');
    
    if (!jobTitle || jobTitle.length < 3) {
      toast({
        title: "Information requise",
        description: "Veuillez d'abord saisir un titre de poste d'au moins 3 caractères",
      });
      return;
    }
    
    try {
      setLoadingAiSuggestions(true);
      const suggestions = await candidateMatchingService.generateJobOfferSuggestions(jobTitle);
      setSuggestion(suggestions);
      setShowSuggestionDialog(true);
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de générer des suggestions",
        variant: "destructive",
      });
    } finally {
      setLoadingAiSuggestions(false);
    }
  };

  const applySuggestions = () => {
    if (!suggestion) return;
    
    if (suggestion.description) {
      form.setValue('description', suggestion.description);
    }
    
    if (suggestion.requiredSkills && suggestion.requiredSkills.length > 0) {
      form.setValue('required_skills', suggestion.requiredSkills);
    }
    
    if (suggestion.education) {
      form.setValue('education_level', suggestion.education);
    }
    
    if (suggestion.experience) {
      if (suggestion.experience.min !== undefined) {
        form.setValue('experience_years_min', suggestion.experience.min);
      }
      if (suggestion.experience.max !== undefined) {
        form.setValue('experience_years_max', suggestion.experience.max);
      }
    }
    
    if (suggestion.contractType) {
      form.setValue('contract_type', suggestion.contractType);
    }
    
    if (suggestion.remotePreference) {
      form.setValue('remote_preference', suggestion.remotePreference);
    }
    
    if (suggestion.salary) {
      if (suggestion.salary.min !== undefined) {
        form.setValue('salary_min', suggestion.salary.min);
      }
      if (suggestion.salary.max !== undefined) {
        form.setValue('salary_max', suggestion.salary.max);
      }
      if (suggestion.salary.currency) {
        form.setValue('salary_currency', suggestion.salary.currency);
      }
    }
    
    setShowSuggestionDialog(false);
    toast({
      title: "Suggestions appliquées",
      description: "Les suggestions complètes ont été appliquées avec succès",
    });
  };
  
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
        <span className="ml-2">Chargement des données...</span>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-navy">Détails de l'offre</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:bg-blue-100"
                  onClick={generateSuggestions}
                  disabled={loadingAiSuggestions}
                >
                  {loadingAiSuggestions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="text-blue-700">Assistant IA</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Obtenez des suggestions détaillées pour améliorer votre offre d'emploi</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du poste *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="ex: Développeur Frontend React" {...field} />
                    </FormControl>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Un titre précis améliore la qualité du matching avec les candidats</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entreprise</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Ma Société" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localisation</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Paris, France" {...field} />
                    </FormControl>
                    <FormDescription>
                      Important pour le matching géographique
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description du poste</FormLabel>
                  <div className="flex flex-col">
                    <FormControl>
                      <Textarea 
                        placeholder="Décrivez le poste, les responsabilités, etc."
                        rows={5}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Une description détaillée améliore la qualité du matching
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contract_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de contrat</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Type de contrat" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CDI">CDI</SelectItem>
                        <SelectItem value="CDD">CDD</SelectItem>
                        <SelectItem value="Intérim">Intérim</SelectItem>
                        <SelectItem value="Stage">Stage</SelectItem>
                        <SelectItem value="Alternance">Alternance</SelectItem>
                        <SelectItem value="Freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="remote_preference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Télétravail</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Politique de télétravail" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sur site">Sur site</SelectItem>
                        <SelectItem value="Hybride">Hybride</SelectItem>
                        <SelectItem value="Full remote">Full remote</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="experience_years_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expérience min. (années)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="experience_years_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expérience max. (années)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="required_skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compétences requises</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="ex: JavaScript"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addRequiredSkill();
                          }
                        }}
                      />
                    </FormControl>
                    <Button type="button" onClick={addRequiredSkill}>
                      Ajouter
                    </Button>
                  </div>
                  <FormDescription className="mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Les compétences sont essentielles pour un bon matching avec les candidats
                  </FormDescription>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {field.value?.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeRequiredSkill(skill)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="education_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau d'éducation</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Niveau d'études requis" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Bac">Bac</SelectItem>
                        <SelectItem value="Bac+2">Bac+2</SelectItem>
                        <SelectItem value="Bac+3">Bac+3</SelectItem>
                        <SelectItem value="Bac+5">Bac+5</SelectItem>
                        <SelectItem value="Doctorat">Doctorat</SelectItem>
                        <SelectItem value="Pas de diplôme requis">Pas de diplôme requis</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut de l'offre</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="closed">Fermée</SelectItem>
                        <SelectItem value="filled">Pourvue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="salary_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salaire min.</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="salary_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salaire max.</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="salary_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Devise</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Devise" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CHF">CHF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/job-offers')}
          >
            Annuler
          </Button>
          
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Mettre à jour" : "Créer l'offre"}
          </Button>
        </div>
      </form>

      <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-6 w-6 text-blue-500" />
              Suggestions IA pour votre offre d'emploi
            </DialogTitle>
            <DialogDescription>
              Notre IA a généré des suggestions détaillées pour votre offre. Examinez-les et appliquez celles qui correspondent le mieux à vos besoins.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {suggestion && (
              <>
                <div>
                  <h3 className="font-semibold text-navy text-lg">Description suggérée</h3>
                  <div className="bg-muted/30 p-4 rounded-md mt-2 whitespace-pre-wrap prose prose-sm max-w-none">
                    {suggestion.description}
                  </div>
                </div>

                {suggestion.requiredSkills && suggestion.requiredSkills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-navy text-lg">Compétences techniques suggérées</h3>
                    <div className="mt-2 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {suggestion.requiredSkills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-1">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ces compétences sont cruciales pour un matching optimal avec les candidats qualifiés.
                      </p>
                    </div>
                  </div>
                )}
                  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {suggestion.education && (
                    <div>
                      <h3 className="font-semibold text-navy">Niveau d'éducation suggéré</h3>
                      <div className="bg-muted/30 p-3 rounded-md mt-1">
                        {suggestion.education}
                      </div>
                    </div>
                  )}
                    
                  {suggestion.contractType && (
                    <div>
                      <h3 className="font-semibold text-navy">Type de contrat suggéré</h3>
                      <div className="bg-muted/30 p-3 rounded-md mt-1">
                        {suggestion.contractType}
                      </div>
                    </div>
                  )}
                    
                  {suggestion.remotePreference && (
                    <div>
                      <h3 className="font-semibold text-navy">Mode de travail suggéré</h3>
                      <div className="bg-muted/30 p-3 rounded-md mt-1">
                        {suggestion.remotePreference}
                      </div>
                    </div>
                  )}
                    
                  {suggestion.experience && (suggestion.experience.min !== undefined || suggestion.experience.max !== undefined) && (
                    <div>
                      <h3 className="font-semibold text-navy">Expérience suggérée</h3>
                      <div className="bg-muted/30 p-3 rounded-md mt-1">
                        {suggestion.experience.min !== undefined && suggestion.experience.max !== undefined
                          ? `${suggestion.experience.min} à ${suggestion.experience.max} ans`
                          : suggestion.experience.min !== undefined
                          ? `Minimum ${suggestion.experience.min} ans`
                          : `Maximum ${suggestion.experience.max} ans`}
                      </div>
                    </div>
                  )}
                    
                  {suggestion.salary && (suggestion.salary.min !== undefined || suggestion.salary.max !== undefined) && (
                    <div>
                      <h3 className="font-semibold text-navy">Salaire suggéré</h3>
                      <div className="bg-muted/30 p-3 rounded-md mt-1">
                        {suggestion.salary.min !== undefined && suggestion.salary.max !== undefined
                          ? `${suggestion.salary.min.toLocaleString()} à ${suggestion.salary.max.toLocaleString()} ${suggestion.salary.currency || 'EUR'}`
                          : suggestion.salary.min !== undefined
                          ? `Minimum ${suggestion.salary.min.toLocaleString()} ${suggestion.salary.currency || 'EUR'}`
                          : `Maximum ${suggestion.salary.max?.toLocaleString()} ${suggestion.salary.currency || 'EUR'}`}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSuggestionDialog(false)}>
                    Ignorer
                  </Button>
                  <Button onClick={applySuggestions} className="bg-blue-600 hover:bg-blue-700">
                    Appliquer toutes les suggestions
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
};

export default JobOfferForm;
