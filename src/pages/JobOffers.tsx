
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, Plus, Eye, Edit, Trash2, Briefcase, MapPin, Clock, Calendar, BarChart4 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { jobOfferService } from '@/services/data/jobOfferService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { JobOffer } from '@/services/data/jobOfferService';

const JobOffers = () => {
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const fetchJobOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await jobOfferService.getUserJobOffers();
      setJobOffers(data);
    } catch (error: any) {
      console.error('Error fetching job offers:', error);
      setError(error?.message || "Impossible de récupérer les offres d'emploi");
      
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de récupérer les offres d'emploi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchJobOffers();
  }, []);
  
  const handleCreateJobOffer = () => {
    navigate('/job-offers/create');
  };
  
  const handleViewJobOffer = (jobOfferId: string) => {
    navigate(`/job-offers/${jobOfferId}`);
  };
  
  const handleEditJobOffer = (jobOfferId: string) => {
    navigate(`/job-offers/${jobOfferId}/edit`);
  };
  
  const handleDeleteJobOffer = async (jobOfferId: string) => {
    try {
      await jobOfferService.deleteJobOffer(jobOfferId);
      toast({
        title: "Offre d'emploi supprimée",
        description: "L'offre d'emploi a été supprimée avec succès",
      });
      fetchJobOffers();
    } catch (error: any) {
      console.error('Error deleting job offer:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de supprimer l'offre d'emploi",
        variant: "destructive",
      });
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  
  if (loading) {
    return (
      <Layout className="py-8 bg-sand/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-navy" />
            <span className="ml-2 text-navy font-medium">Chargement des offres d'emploi...</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout className="py-8 bg-gradient-to-br from-purple-50/50 to-white dark:from-navy-dark/90 dark:to-navy-dark">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-navy to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">Offres d'emploi</h1>
            <p className="text-navy-dark/70 dark:text-sand/70 mt-1">Gérez vos offres d'emploi et trouvez les meilleurs candidats</p>
          </div>
          <Button 
            onClick={handleCreateJobOffer} 
            className="gap-2 bg-gradient-to-r from-navy to-navy-light hover:from-navy-dark hover:to-navy transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-300"
          >
            <Plus size={16} className="text-white" />
            <span>Créer une offre</span>
          </Button>
        </div>
        
        {error ? (
          <div className="my-8 p-6 bg-red-50 border border-red-200 rounded-lg text-center shadow-md animate-fade-in">
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchJobOffers} variant="outline" className="gap-2 border-red-300 text-red-700 hover:bg-red-50">
              <RefreshCw size={16} />
              Réessayer
            </Button>
          </div>
        ) : (
          <>
            {jobOffers.length === 0 ? (
              <div className="my-8 p-10 bg-gradient-to-br from-white to-purple-50 dark:from-navy-dark/80 dark:to-navy/60 rounded-lg text-center shadow-xl animate-fade-in backdrop-blur-sm border border-blue-100/30 dark:border-blue-900/30">
                <div className="flex flex-col items-center max-w-lg mx-auto">
                  <div className="p-4 rounded-full bg-blue-100/50 dark:bg-blue-900/30 backdrop-blur-sm mb-4">
                    <Briefcase size={40} className="text-navy dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-medium text-navy dark:text-blue-300 mb-2">Aucune offre d'emploi trouvée</h3>
                  <p className="text-navy-dark/70 dark:text-sand/70 mb-6">
                    Créez votre première offre d'emploi pour commencer à matcher des candidats et trouver les talents idéaux pour votre entreprise.
                  </p>
                  <Button 
                    onClick={handleCreateJobOffer} 
                    className="gap-2 bg-gradient-to-r from-navy to-navy-light hover:from-navy-dark hover:to-navy transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-300"
                  >
                    <Plus size={16} className="text-white" />
                    <span>Créer une offre</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
                {jobOffers.map((jobOffer) => (
                  <Card key={jobOffer.id} className="border-blue-200/30 dark:border-blue-800/30 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-navy to-navy-light dark:from-blue-500 dark:to-purple-500"></div>
                    <CardHeader className="pb-2 relative">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-semibold line-clamp-2 text-navy dark:text-sand group-hover:text-navy-light dark:group-hover:text-blue-300 transition-colors duration-300">
                          {jobOffer.title}
                        </CardTitle>
                        <Badge variant={jobOffer.status === 'active' ? 'default' : 'secondary'} className={jobOffer.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                          {jobOffer.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-sm text-navy-dark/70 dark:text-sand/70 space-y-1 mt-1">
                        {jobOffer.company && (
                          <div className="flex items-center">
                            <Building size={14} className="mr-1.5 flex-shrink-0 text-navy/60 dark:text-sand/60" />
                            <span>{jobOffer.company}</span>
                          </div>
                        )}
                        {jobOffer.location && (
                          <div className="flex items-center">
                            <MapPin size={14} className="mr-1.5 flex-shrink-0 text-navy/60 dark:text-sand/60" />
                            <span>{jobOffer.location}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="py-2">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {jobOffer.contract_type && (
                          <Badge variant="outline" className="bg-blue-50/50 text-navy dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700">
                            <Briefcase size={12} className="mr-1" />
                            {jobOffer.contract_type}
                          </Badge>
                        )}
                        {jobOffer.remote_preference && (
                          <Badge variant="outline" className="bg-purple-50/50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700">
                            <Clock size={12} className="mr-1" />
                            {jobOffer.remote_preference}
                          </Badge>
                        )}
                      </div>
                      
                      <Separator className="my-3 bg-blue-100/50 dark:bg-blue-800/50" />
                      
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-navy-dark/70 dark:text-sand/70 flex items-center">
                            <BarChart4 size={14} className="mr-1.5" />
                            Expérience:
                          </span>
                          <span className="font-medium text-navy dark:text-sand/90">{jobOffer.experience_years_min || 0} - {jobOffer.experience_years_max || '∞'} ans</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-navy-dark/70 dark:text-sand/70 flex items-center">
                            <Calendar size={14} className="mr-1.5" />
                            Création:
                          </span>
                          <span className="font-medium text-navy dark:text-sand/90">{formatDate(jobOffer.created_at)}</span>
                        </div>
                        
                        {jobOffer.required_skills && (
                          <div className="mt-4">
                            <span className="text-navy-dark/70 dark:text-sand/70 block mb-2">Compétences requises:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {Array.isArray(jobOffer.required_skills) ? 
                                jobOffer.required_skills.slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">{skill}</Badge>
                                ))
                                : 
                                Object.values(jobOffer.required_skills).slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">{String(skill)}</Badge>
                                ))
                              }
                              {Array.isArray(jobOffer.required_skills) && jobOffer.required_skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{jobOffer.required_skills.length - 3}</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-3 flex justify-between border-t border-blue-100/30 dark:border-blue-800/30 mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewJobOffer(jobOffer.id)}
                        className="gap-1 text-navy hover:text-navy-light hover:bg-blue-50/50 dark:text-blue-300 dark:hover:text-blue-200 dark:hover:bg-blue-900/20"
                      >
                        <Eye size={16} />
                        Voir
                      </Button>
                      
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditJobOffer(jobOffer.id)}
                          className="text-navy hover:text-navy-light hover:bg-blue-50/50 dark:text-blue-300 dark:hover:text-blue-200 dark:hover:bg-blue-900/20"
                        >
                          <Edit size={16} />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white dark:bg-navy-dark border-blue-200 dark:border-blue-800">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-navy dark:text-sand">Supprimer l'offre d'emploi?</AlertDialogTitle>
                              <AlertDialogDescription className="text-navy-dark/70 dark:text-sand/70">
                                Cette action est irréversible. Cela supprimera définitivement l'offre d'emploi
                                et toutes les correspondances avec les candidats.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-blue-200 dark:border-blue-800 text-navy dark:text-sand">Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteJobOffer(jobOffer.id)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default JobOffers;
