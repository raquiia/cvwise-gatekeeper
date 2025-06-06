
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { candidateMatchingService } from '@/services/data/candidate-matching';
import { supabase } from '@/integrations/supabase/client';
import { processCandidateData } from '@/utils/candidateUtils';
import { useActiveJob } from '@/context/ActiveJobContext';
import type { JobOffer } from '@/services/data/job-offers/types';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

export function useJobOfferDetails(jobOfferId: string | undefined) {
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [candidateMatches, setCandidateMatches] = useState<ExtendedCandidateMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setActiveJobOffer } = useActiveJob();

  const fetchJobOffer = async () => {
    if (!jobOfferId) {
      setError("ID d'offre d'emploi manquant");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await jobOfferService.getJobOfferById(jobOfferId);
      
      if (!data) {
        setError("Offre d'emploi non trouvée");
        setLoading(false);
        return;
      }
      
      setJobOffer(data);
      
      // Définir cette offre comme active pour le contexte de scoring
      console.log('Setting active job offer for scoring context:', jobOfferId, data.title);
      await setActiveJobOffer(jobOfferId, data.title);
      
      await fetchCandidateMatches();
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching job offer:', error);
      setError(error?.message || "Impossible de récupérer l'offre d'emploi");
      
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de récupérer l'offre d'emploi",
        variant: "destructive",
      });
      
      setLoading(false);
    }
  };

  const fetchCandidateMatches = async () => {
    if (!jobOfferId) return;
    
    try {
      console.log('Fetching candidate matches for job offer:', jobOfferId);
      let matches;
      
      try {
        const { data, error } = await supabase
          .rpc('get_matches_for_job_offer', { p_job_offer_id: jobOfferId });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const processedMatches = data.map((item: any) => {
            const candidate = processCandidateData(item.candidate || {});
            const match = item.match || {};
            
            return {
              candidateId: candidate.id,
              firstName: candidate.first_name || '',
              lastName: candidate.last_name || '',
              position: candidate.position || '',
              company: candidate.company || '',
              score: match.match_score || 0,
              details: match.match_details || {
                skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
                experienceLevel: { required: 0, candidate: 0, match: false },
                location: { required: '', candidate: '', match: false },
                educationLevel: { required: '', candidate: '', match: false },
                overall: 0
              },
              candidate: candidate,
              match: {
                match_score: match.match_score || 0,
                skills_match_score: match.skills_match_score || 0,
                experience_match_score: match.experience_match_score || 0,
                education_match_score: match.education_match_score || 0,
                location_match_score: match.location_match_score || 0,
                match_details: match.match_details || {
                  skills: { matched: [], missing: [], additional: [], matchPercentage: 0 }
                }
              }
            } as ExtendedCandidateMatch;
          });
          
          setCandidateMatches(processedMatches);
          console.log("Matches loaded from RPC:", processedMatches.length);
          return;
        }
      } catch (rpcError) {
        console.error('Error using RPC for matches, falling back to service:', rpcError);
      }
      
      matches = await candidateMatchingService.getMatchesForJobOffer(jobOfferId);
      
      if (matches && matches.length > 0) {
        const enhancedMatches = await Promise.all(
          matches.map(async (match) => {
            try {
              const { data: candidateData } = await supabase
                .from('candidates')
                .select('*')
                .eq('id', match.candidateId)
                .single();
              
              if (!candidateData) {
                return {
                  candidateId: match.candidateId || match.candidate_id || '',
                  firstName: match.firstName || match.first_name || '',
                  lastName: match.lastName || match.last_name || '',
                  position: match.position || '',
                  company: match.company || '',
                  score: match.score || match.match_score || 0,
                  details: match.details,
                  match: {
                    match_score: match.score || match.match_score || 0,
                    skills_match_score: match.details?.skills?.matchPercentage || 0,
                    experience_match_score: match.details?.experienceLevel?.match ? 100 : 
                      Math.min(100, ((match.details?.experienceLevel?.candidate || 0) / 
                      (match.details?.experienceLevel?.required || 1)) * 100),
                    education_match_score: match.details?.educationLevel?.match ? 100 : 0,
                    location_match_score: match.details?.location?.match ? 100 : 0,
                    match_details: match.details || {
                      skills: { matched: [], missing: [], additional: [], matchPercentage: 0 }
                    }
                  }
                } as ExtendedCandidateMatch;
              }
              
              const candidate = processCandidateData(candidateData);
              
              return {
                candidateId: candidate.id,
                firstName: candidate.first_name || '',
                lastName: candidate.last_name || '',
                position: candidate.position || '',
                company: candidate.company || '',
                score: match.score || match.match_score || 0,
                details: match.details,
                candidate: candidate,
                match: {
                  match_score: match.score || match.match_score || 0,
                  skills_match_score: match.details?.skills?.matchPercentage || 0,
                  experience_match_score: match.details?.experienceLevel?.match ? 100 : 
                    Math.min(100, ((match.details?.experienceLevel?.candidate || 0) / 
                    (match.details?.experienceLevel?.required || 1)) * 100),
                  education_match_score: match.details?.educationLevel?.match ? 100 : 0,
                  location_match_score: match.details?.location?.match ? 100 : 0,
                  match_details: match.details || {
                    skills: { matched: [], missing: [], additional: [], matchPercentage: 0 }
                  }
                }
              } as ExtendedCandidateMatch;
            } catch (error) {
              console.error(`Error fetching candidate details for ${match.candidateId || match.candidate_id}:`, error);
              return {
                candidateId: match.candidateId || match.candidate_id || '',
                firstName: match.firstName || match.first_name || '',
                lastName: match.lastName || match.last_name || '',
                position: match.position || '',
                company: match.company || '',
                score: match.score || match.match_score || 0,
                details: match.details,
                match: {
                  match_score: match.score || match.match_score || 0,
                  skills_match_score: match.details?.skills?.matchPercentage || 0,
                  experience_match_score: match.details?.experienceLevel?.match ? 100 : 50,
                  education_match_score: match.details?.educationLevel?.match ? 100 : 0,
                  location_match_score: match.details?.location?.match ? 100 : 0,
                  match_details: match.details || {
                    skills: { matched: [], missing: [], additional: [], matchPercentage: 0 }
                  }
                }
              } as ExtendedCandidateMatch;
            }
          })
        );
        
        setCandidateMatches(enhancedMatches);
        console.log("Candidate matches loaded from service:", enhancedMatches.length);
      } else {
        setCandidateMatches([]);
        console.log("No candidate matches found");
      }
    } catch (error) {
      console.error('Error fetching candidate matches:', error);
      setCandidateMatches([]);
      
      toast({
        title: "Problème de récupération des correspondances",
        description: "Une erreur s'est produite lors de la récupération des correspondances. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleRecalculateMatches = async () => {
    if (!jobOfferId) return;
    
    try {
      setMatchLoading(true);
      
      console.log('Recalculating matches for job offer:', jobOfferId);
      await candidateMatchingService.calculateMatchesForJobOffer(jobOfferId);
      
      toast({
        title: "Calcul terminé",
        description: "Les correspondances ont été recalculées avec succès",
      });
      
      await fetchCandidateMatches();
    } catch (error: any) {
      console.error('Error recalculating matches:', error);
      
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de recalculer les correspondances",
        variant: "destructive",
      });
    } finally {
      setMatchLoading(false);
    }
  };

  useEffect(() => {
    if (jobOfferId) {
      fetchJobOffer();
    } else {
      setError("ID d'offre d'emploi manquant");
      setLoading(false);
    }
  }, [jobOfferId]);

  return {
    jobOffer,
    candidateMatches,
    loading,
    matchLoading,
    error,
    fetchCandidateMatches,
    handleRecalculateMatches
  };
}
