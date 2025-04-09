
// Only updating the relevant part at line 69
const fetchCandidates = async () => {
  if (!user?.id) {
    setError("Vous devez être connecté pour voir vos candidats");
    setLoading(false);
    return;
  }
  
  try {
    setLoading(true);
    setError(null);
    
    console.log("Fetching candidates for user:", user.id);
    const data = await candidateDataService.getUserCandidates();
    console.log("Retrieved candidates:", data);
    
    if (Array.isArray(data)) {
      setCandidates(data);
    } else {
      console.error("Candidates data is not an array:", data);
      setCandidates([]);
      setError("Format de données incorrect");
    }
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    setError(error?.message || "Impossible de récupérer les candidats");
    
    toast({
      title: "Erreur",
      description: error?.message || "Impossible de récupérer les candidats",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
