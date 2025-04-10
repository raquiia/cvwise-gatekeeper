import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, Info, Plus, Wand2 } from 'lucide-react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from '@/hooks/use-toast';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { candidateMatchingService } from '@/services/data/candidateMatchingService';
import type { JobOfferSuggestion } from '@/services/data/candidate-matching/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobOffer } from '@/services/data/job-offers/types';

const jobOfferSchema = z.object({
  title: z.string().min(3, { message: "Le titre doit comporter au moins 3 caractères" }),
  company: z.string().optional(),
  custom_company: z.string().optional(),
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

const PREDEFINED_COMPANIES = [
  "MIGSO-PCUBED",
  "Autre"
];

const JobOfferForm: React.FC<JobOfferFormProps> = ({ jobOfferId, isEditing = false }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [skillInput, setSkillInput] = useState('');
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [suggestion, setSuggestion] = useState<JobOfferSuggestion | null>(null);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [freeformInput, setFreeformInput] = useState('');
  const [activeTab, setActiveTab] = useState<string>('standard');
  
  const navigate = useNavigate();
  
  const form = useForm<JobOfferFormValues>({
    resolver: zodResolver(jobOfferSchema),
    defaultValues: {
      title: "",
      company: "MIGSO-PCUBED",
      custom_company: "",
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
    const subscription = form.watch((value, { name }) => {
      if (name === 'company' && value.company === 'Autre') {
        setIsCustomCompany(true);
      } else if (name === 'company') {
        setIsCustomCompany(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);
  
  useEffect(() => {
    const fetchJobOffer = async () => {
      if (!isEditing || !jobOfferId) return;
      
      try {
        setInitialLoading(true);
        const jobOffer = await jobOfferService.getJobOfferById(jobOfferId);
        
        if (jobOffer) {
          const companyValue = PREDEFINED_COMPANIES.includes(jobOffer.company || "") 
            ? jobOffer.company 
            : "Autre";
          
          const customCompanyValue = !PREDEFINED_COMPANIES.includes(jobOffer.company || "") && jobOffer.company
            ? jobOffer.company
            : "";
          
          setIsCustomCompany(companyValue === "Autre");
          
          form.reset({
            title: jobOffer.title || "",
            company: companyValue || "MIGSO-PCUBED",
            custom_company: customCompanyValue || "",
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
      
      const finalCompany = values.company === "Autre" ? values.custom_company : values.company;
      
      const formattedValues = {
        ...values,
        company: finalCompany
      };
      
      delete formattedValues.custom_company;
      
      if (isEditing && jobOfferId) {
        await jobOfferService.updateJobOffer(jobOfferId, formattedValues);
        toast({
          title: "Offre d'emploi mise à jour",
          description: "L'offre d'emploi a été mise à jour avec succès",
        });
      } else {
        const newJobOffer = await jobOfferService.createJobOffer(formattedValues as Omit<JobOffer, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
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
    const location = form.getValues('location');
    
    if (!jobTitle || jobTitle.length < 3) {
      toast({
        title: "Information requise",
        description: "Veuillez d'abord saisir un titre de poste d'au moins 3 caractères",
      });
      return;
    }
    
    try {
      setLoadingAiSuggestions(true);
      const suggestions = await candidateMatchingService.generateJobOfferSuggestions(jobTitle, location);
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
    
    if (suggestion.title) {
      form.setValue('title', suggestion.title);
    }
    
    if (suggestion.location) {
      form.setValue('location', suggestion.location);
    }
    
    if (suggestion.description) {
      form.setValue('description', suggestion.description);
    }
    
    if (suggestion.requiredSkills && suggestion.requiredSkills.length > 0) {
      form.setValue('required_skills', suggestion.requiredSkills);
    }
    
    if (suggestion.softSkills && suggestion.softSkills.length > 0) {
      const currentSkills = form.getValues('required_skills') || [];
      const newSkills = [...currentSkills];
      
      suggestion.softSkills.forEach(softSkill => {
        if (!newSkills.includes(softSkill)) {
          newSkills.push(softSkill);
        }
      });
      
      form.setValue('required_skills', newSkills);
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
    setActiveTab('standard');
    
    toast({
      title: "Suggestions appliquées",
      description: "Les suggestions complètes ont été appliquées avec succès",
    });
  };
  
  const generateFromFreeform = async () => {
    if (!freeformInput || freeformInput.trim().length < 10) {
      toast({
        title: "Information insuffisante",
        description: "Veuillez saisir plus d'informations pour générer des suggestions pertinentes.",
      });
      return;
    }
    
    try {
      setLoadingAiSuggestions(true);
      
      console.log("Generating suggestions from freeform text:", freeformInput.substring(0, 100) + "...");
      
      const firstLine = freeformInput.split('\n')[0].trim();
      const possibleTitle = firstLine.length < 100 ? firstLine : freeformInput.split('.')[0].trim();
      const jobTitle = possibleTitle.length < 100 ? possibleTitle : "Offre d'emploi";
      
      const locationMatch = freeformInput.match(/\b(?:à|en|sur|dans|près de|proche de)\s+([A-Z][a-zÀ-ÿ-]+(?:\s+[A-Z][a-zÀ-ÿ-]+)*)/);
      const location = locationMatch ? locationMatch[1] : "";
      
      const suggestions = await candidateMatchingService.generateJobOfferSuggestions(jobTitle, location, freeformInput);
      setSuggestion(suggestions);
      
      if (suggestions) {
        if (suggestions.title) {
          form.setValue('title', suggestions.title);
        }
        
        if (suggestion.location) {
          form.setValue('location', suggestions.location);
        }
        
        if (suggestion.description) {
          form.setValue('description', suggestions.description);
        }
        
        if (suggestion.requiredSkills && suggestion.requiredSkills.length > 0) {
          form.setValue('required_skills', suggestion.requiredSkills);
        }
        
        if (suggestion.softSkills && suggestion.softSkills.length > 0) {
          const currentSkills = form.getValues('required_skills') || [];
          const newSkills = [...currentSkills];
          
          suggestions.softSkills.forEach(softSkill => {
            if (!newSkills.includes(softSkill)) {
              newSkills.push(softSkill);
            }
          });
          
          form.setValue('required_skills', newSkills);
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
      }
      
      setShowSuggestionDialog(true);
      
      toast({
        title: "Analyse terminée",
        description: "Les suggestions ont été générées à partir de votre description."
      });
    } catch (error: any) {
      console.error('Error generating suggestions from freeform input:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de générer des suggestions à partir de votre description",
        variant: "destructive",
      });
    } finally {
      setLoadingAiSuggestions(false);
    }
  };
  
  const isSoftSkill = (skill: string): boolean => {
    const softSkills = [
      "Communication", "Travail d'équipe", "Teamwork", "Leadership", "Adaptabilité", "Adaptability",
      "Résolution de problèmes", "Problem Solving", "Créativité", "Creativity", "Organisation",
      "Gestion du temps", "Time Management", "Esprit critique", "Critical Thinking", "Négociation",
      "Negotiation", "Empathie", "Empathy", "Résilience", "Resilience", "Prise de décision",
      "Decision Making", "Gestion du stress", "Stress Management", "Autonomie", "Autonomy",
      "Flexibilité", "Flexibility", "Collaboration", "Collaboration", "Écoute active", "Active Listening",
      "Intelligence émotionnelle", "Emotional Intelligence", "Sens des responsabilités", "Responsibility",
      "Capacité d'analyse", "Analytical Skills", "Curiosité", "Curiosity", "Proactivité", "Proactivity",
      "Persévérance", "Perseverance", "Rigueur", "Rigor", "Diplomatie", "Diplomacy", "Motivation",
      "Motivation", "Pédagogie", "Pedagogy", "Assertivité", "Assertiveness", "Confiance en soi",
      "Self-confidence", "Sens de l'initiative", "Initiative", "Apprentissage continu", "Continuous Learning",
      "Polyvalence", "Versatility", "Sens du détail", "Attention to Detail", "Ponctualité", "Punctuality"
    ];

    return softSkills.some(softSkill => 
      skill.toLowerCase().includes(softSkill.toLowerCase()) || 
      softSkill.toLowerCase().includes(skill.toLowerCase())
    );
  };

  const getToolsAndTechnologies = (description?: string): string[] => {
    if (!description) return [];
    
    const techToolsPatterns = [
      // Common technologies
      /\b(React|Angular|Vue\.js|Node\.js|Express|Django|Flask|Laravel|Spring|ASP\.NET|Rails)\b/g,
      // Programming languages
      /\b(JavaScript|TypeScript|Python|Java|C#|C\+\+|PHP|Ruby|Swift|Kotlin|Go|Rust)\b/g,
      // Databases
      /\b(MySQL|PostgreSQL|MongoDB|SQL Server|Oracle|SQLite|Firebase|Cassandra|Redis|Elasticsearch)\b/g,
      // Cloud platforms
      /\b(AWS|Azure|Google Cloud|GCP|Heroku|Netlify|Vercel|DigitalOcean)\b/g,
      // DevOps tools
      /\b(Docker|Kubernetes|Jenkins|Travis CI|CircleCI|Git|GitHub|GitLab|Bitbucket)\b/g,
      // Design tools
      /\b(Figma|Sketch|Adobe XD|Photoshop|Illustrator|InDesign)\b/g,
      // Project management tools
      /\b(Jira|Trello|Asana|Monday|Notion|Confluence|Slack|Teams|Zoom)\b/g,
      // Other common tools
      /\b(Excel|PowerPoint|Word|Outlook|Salesforce|SAP|Tableau|Power BI|WordPress)\b/g
    ];
    
    const tools = new Set<string>();
    
    techToolsPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        matches.forEach(match => tools.add(match));
      }
    });
    
    return Array.from(tools);
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
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-navy">Détails de l'offre</h2>
        <div className="flex gap-2">
          <TabsList>
            <TabsTrigger value="standard">Formulaire Standard</TabsTrigger>
            <TabsTrigger value="freeform">Mode Libre</TabsTrigger>
          </TabsList>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:bg-blue-100"
                  onClick={activeTab === 'standard' ? generateSuggestions : generateFromFreeform}
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
      </div>
      
      <TabsContent value="freeform">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-blue-500" />
              Mode description libre
            </CardTitle>
            <CardDescription>
              Décrivez librement le poste avec vos propres mots. Notre IA analysera votre texte pour générer une offre d'emploi complète.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Textarea
                  placeholder="Décrivez le poste, les responsabilités, compétences requises, localisation, type de contrat, expérience souhaitée, etc. 
                  
Exemple: Recherche développeur React senior à Paris, 5 ans d'expérience minimum, télétravail partiel possible, maîtrise de TypeScript et NextJS requise. Besoin de bonnes compétences en communication et résolution de problèmes. Salaire entre 55K et 65K."
                  rows={12}
                  value={freeformInput}
                  onChange={(e) => setFreeformInput(e.target.value)}
                  className="font-medium"
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-blue-700 font-medium mb-2 flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  Conseils pour obtenir les meilleures suggestions
                </h3>
                <ul className="space-y-1.5 text-blue-600 text-sm">
                  <li className="flex gap-1.5">
                    <span>•</span> 
                    <span>Mentionnez le <strong>titre du poste</strong> et la <strong>localisation précise</strong> (ville, pays)</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span>•</span> 
                    <span>Incluez les <strong>compétences techniques</strong> (hard skills) et <strong>comportementales</strong> (soft skills)</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span>•</span> 
                    <span>Précisez les <strong>outils</strong> et <strong>technologies</strong> utilisés dans le poste</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span>•</span> 
                    <span>Ajoutez vos attentes en termes de <strong>télétravail</strong> et <strong>salaire</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={generateFromFreeform}
              disabled={loadingAiSuggestions || freeformInput.trim().length < 10}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loadingAiSuggestions ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Générer l'offre complète
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="standard">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une entreprise" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PREDEFINED_COMPANIES.map((company) => (
                              <SelectItem key={company} value={company}>
                                {company}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {isCustomCompany && (
                    <FormField
                      control={form.control}
                      name="custom_company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de l'entreprise</FormLabel>
                          <FormControl>
                            <Input placeholder="Saisir le nom de l'entreprise" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {!isCustomCompany && (
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
                  )}
                </div>
                
                {isCustomCompany && (
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
                )}
                
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
                            <SelectItem value="Bac+8">Bac+8</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="CAD">CAD (C$)</SelectItem>
                            <SelectItem value="CHF">CHF (Fr)</SelectItem>
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
                    name="salary_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salaire min. annuel</FormLabel>
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
                        <FormLabel>Salaire max. annuel</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditing ? "Mise à jour en cours..." : "Création en cours..."}
                      </>
                    ) : (
                      <>
                        {isEditing ? "Mettre à jour l'offre" : "Créer l'offre"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </TabsContent>
      
      <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Suggestions pour votre offre d'emploi</DialogTitle>
            <DialogDescription>
              Notre assistant IA a généré des suggestions pour améliorer votre offre d'emploi.
            </DialogDescription>
          </DialogHeader>
          
          {suggestion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Titre suggéré</h3>
                  <p className="font-semibold">{suggestion.title}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Localisation</h3>
                  <p>{suggestion.location}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Description</h3>
                <div className="border rounded-md p-3 bg-muted/20">
                  <p className="whitespace-pre-line">{suggestion.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Compétences techniques</h3>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.requiredSkills?.map((skill, i) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Compétences comportementales</h3>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.softSkills?.map((skill, i) => (
                      <Badge key={i} variant="outline" className="bg-blue-50">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Niveau d'études</h3>
                  <p>{suggestion.education}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Expérience</h3>
                  <p>{suggestion.experience?.min} - {suggestion.experience?.max} ans</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Type de contrat</h3>
                  <p>{suggestion.contractType}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Télétravail</h3>
                  <p>{suggestion.remotePreference}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Salaire</h3>
                  <p>{suggestion.salary?.min?.toLocaleString()} - {suggestion.salary?.max?.toLocaleString()} {suggestion.salary?.currency}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowSuggestionDialog(false)}>
                  Fermer
                </Button>
                <Button onClick={applySuggestions}>
                  Appliquer les suggestions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default JobOfferForm;
