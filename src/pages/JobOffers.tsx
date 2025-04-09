
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, Plus, Eye, Edit, Trash2 } from 'lucide-react';
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
            <span className="ml-2">Chargement des offres d'emploi...</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy">Offres d'emploi</h1>
            <p className="text-gray-600">Gérez vos offres d'emploi et trouvez les meilleurs candidats</p>
          </div>
          <Button onClick={handleCreateJobOffer} className="gap-2">
            <Plus size={16} />
            Créer une offre
          </Button>
        </div>
        
        {error ? (
          <div className="my-8 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchJobOffers} variant="outline" className="gap-2">
              <RefreshCw size={16} />
              Réessayer
            </Button>
          </div>
        ) : (
          <>
            {jobOffers.length === 0 ? (
              <div className="my-8 p-6 bg-muted rounded-lg text-center">
                <h3 className="text-lg font-medium mb-2">Aucune offre d'emploi trouvée</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre première offre d'emploi pour commencer à matcher des candidats.
                </p>
                <Button onClick={handleCreateJobOffer} className="gap-2">
                  <Plus size={16} />
                  Créer une offre
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobOffers.map((jobOffer) => (
                  <Card key={jobOffer.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-semibold line-clamp-2">
                          {jobOffer.title}
                        </CardTitle>
                        <Badge variant={jobOffer.status === 'active' ? 'default' : 'secondary'}>
                          {jobOffer.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {jobOffer.company && (
                          <div className="mt-1">{jobOffer.company}</div>
                        )}
                        {jobOffer.location && (
                          <div className="mt-0.5">{jobOffer.location}</div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="py-2">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {jobOffer.contract_type && (
                          <Badge variant="outline">{jobOffer.contract_type}</Badge>
                        )}
                        {jobOffer.remote_preference && (
                          <Badge variant="outline">{jobOffer.remote_preference}</Badge>
                        )}
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expérience:</span>
                          <span>{jobOffer.experience_years_min || 0} - {jobOffer.experience_years_max || '∞'} ans</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Création:</span>
                          <span>{formatDate(jobOffer.created_at)}</span>
                        </div>
                        
                        {jobOffer.required_skills && (
                          <div className="mt-3">
                            <span className="text-gray-600 block mb-1">Compétences requises:</span>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(jobOffer.required_skills) ? 
                                jobOffer.required_skills.slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
                                ))
                                : 
                                Object.values(jobOffer.required_skills).slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">{String(skill)}</Badge>
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
                    
                    <CardFooter className="pt-2 flex justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewJobOffer(jobOffer.id)}
                        className="gap-1"
                      >
                        <Eye size={16} />
                        Voir
                      </Button>
                      
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditJobOffer(jobOffer.id)}
                        >
                          <Edit size={16} />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 size={16} className="text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer l'offre d'emploi?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Cela supprimera définitivement l'offre d'emploi
                                et toutes les correspondances avec les candidats.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteJobOffer(jobOffer.id)}
                                className="bg-red-500 hover:bg-red-600"
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
