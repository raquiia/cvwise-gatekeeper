import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { geoService, Country, Hub } from '@/services/data/geoService';
import { hubAssignmentService, Profile } from '@/services/data/hubAssignmentService';
import { toast } from 'sonner';

export const useGeoData = () => {
  const queryClient = useQueryClient();

  // Countries
  const {
    data: countries = [],
    isLoading: isLoadingCountries,
    error: countriesError
  } = useQuery({
    queryKey: ['countries'],
    queryFn: () => geoService.getAllCountries(),
  });

  const createCountryMutation = useMutation({
    mutationFn: geoService.createCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Pays créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création du pays: ${error.message}`);
    }
  });

  const updateCountryMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Country> }) =>
      geoService.updateCountry(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Pays mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  });

  const deleteCountryMutation = useMutation({
    mutationFn: geoService.deleteCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Pays supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  });

  // Hubs
  const {
    data: hubs = [],
    isLoading: isLoadingHubs,
    error: hubsError
  } = useQuery({
    queryKey: ['hubs'],
    queryFn: () => geoService.getAllHubs(),
  });

  const createHubMutation = useMutation({
    mutationFn: geoService.createHub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
      toast.success('Hub créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création du hub: ${error.message}`);
    }
  });

  const updateHubMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Hub> }) =>
      geoService.updateHub(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
      toast.success('Hub mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  });

  const deleteHubMutation = useMutation({
    mutationFn: geoService.deleteHub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
      toast.success('Hub supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  });

  // Recruiters
  const {
    data: recruiters = [],
    isLoading: isLoadingRecruiters,
    error: recruitersError
  } = useQuery({
    queryKey: ['recruiters-with-hubs'],
    queryFn: () => hubAssignmentService.getRecruitersWithHubs(),
  });

  const assignRecruiterMutation = useMutation({
    mutationFn: ({ recruiterId, hubId }: { recruiterId: string; hubId: string }) =>
      hubAssignmentService.assignRecruiterToHub(recruiterId, hubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiters-with-hubs'] });
      toast.success('Recruteur assigné au hub avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'assignation: ${error.message}`);
    }
  });

  const removeRecruiterMutation = useMutation({
    mutationFn: hubAssignmentService.removeRecruiterFromHub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiters-with-hubs'] });
      toast.success('Recruteur retiré du hub avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors du retrait: ${error.message}`);
    }
  });

  return {
    // Countries
    countries,
    isLoadingCountries,
    countriesError,
    createCountry: createCountryMutation.mutate,
    updateCountry: updateCountryMutation.mutate,
    deleteCountry: deleteCountryMutation.mutate,
    isCreatingCountry: createCountryMutation.isPending,
    
    // Hubs
    hubs,
    isLoadingHubs,
    hubsError,
    createHub: createHubMutation.mutate,
    updateHub: updateHubMutation.mutate,
    deleteHub: deleteHubMutation.mutate,
    isCreatingHub: createHubMutation.isPending,
    
    // Recruiters
    recruiters,
    isLoadingRecruiters,
    recruitersError,
    assignRecruiter: assignRecruiterMutation.mutate,
    removeRecruiter: removeRecruiterMutation.mutate,
    isAssigningRecruiter: assignRecruiterMutation.isPending,
  };
};