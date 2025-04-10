import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { candidateMatchingService } from '@/services/data/candidate-matching';
import { supabase } from '@/integrations/supabase/client';
import { ensureArray, processCandidateData } from '@/utils/candidateUtils';
import type { JobOffer } from '@/services/data/job-offers/types';
import type { ExtendedCandidateMatch } from './types/candidateTypes';

import JobOfferHeader from '@/components/job-offers/detail/JobOfferHeader';
import JobOfferDetails from '@/components/job-offers/detail/JobOfferDetails';
import MatchingStats from '@/components/job-offers/detail/MatchingStats';
import NoMatchesAlert from '@/components/job-offers/detail/NoMatchesAlert';
import CandidatesMatchingSection from '@/components/job-offers/detail/CandidatesMatchingSection';
import ErrorState from '@/components/job-offers/detail/ErrorState';
import LoadingState from '@/components/job-offers/detail/LoadingState';

const JobOfferDetail = () => {
  const { jobOfferId } = useParams<{ jobOfferId: string }>();
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [candidateMatches, setCandidateMatches] = useState<ExtendedCandidateMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!jobOfferId) {
      setError("ID d'offre d'emploi manquant");
      setLoading(false);
      return;
    }
    
    fetchJobOffer();
  }, [jobOfferId]);
  
  const fetchJobOffer = async () => {
    if (!jobOfferId) return;
    
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
      console.log("Fetching candidate matches for job offer:", jobOfferId);
      let matches;
      
      try {
        console.log("Attempting to use RPC for matches");
        const { data, error } = await supabase
          .rpc('get_matches_for_job_offer', { p_job_offer_id: jobOfferId });
        
        if (error) {
          console.error("RPC Error:", error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log("Successfully got matches from RPC:", data.length);
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
                experienceLevel: { required: 0, candidate: 0, match: false, score: 0 },
                location: { required: '', candidate: '', match: false, score: 0 },
                educationLevel: { required: '', candidate: '', match: false, score: 0 },
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
            };
          });
          
          setCandidateMatches(processedMatches);
          console.log("Matches loaded from RPC:", processedMatches.length);
          return;
        } else {
          console.log("No matches found from RPC, will recalculate");
        }
      } catch (rpcError) {
        console.error('Error using RPC for matches, falling back to service:', rpcError);
      }
      
      console.log("Calculating matches using service method");
      matches = await candidateMatchingService.calculateMatchesForJobOffer(jobOfferId);
      console.log("Matches calculated:", matches?.length || 0);
      
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
                console.log(`No candidate data found for ID ${match.candidateId}`);
                return {
                  ...match,
                  match: {
                    match_score: match.score,
                    skills_match_score: match.details?.skills?.matchPercentage || 0,
                    experience_match_score: match.details?.experienceLevel?.score || 
                      (match.details?.experienceLevel?.match ? 100 : 
                      Math.min(100, ((match.details?.experienceLevel?.candidate || 0) / 
                      Math.max(1, (match.details?.experienceLevel?.required || 1))) * 100)),
                    education_match_score: match.details?.educationLevel?.score || (match.details?.educationLevel?.match ? 100 : 0),
                    location_match_score: match.details?.location?.score || (match.details?.location?.match ? 100 : 0),
                    match_details: match.details || {
                      skills: { matched: [], missing: [], additional: [], matchPercentage: 0 }
                    }
                  }
                } as ExtendedCandidateMatch;
              }
              
              const candidate = processCandidateData(candidateData);
              console.log(`Enhanced match for candidate: ${candidate.first_name} ${candidate.last_name} with score ${match.score}`);
              
              return {
                ...match,
                candidate: candidate,
                match: {
                  match_score: match.score,
                  skills_match_score: match.details?.skills?.matchPercentage || 0,
                  experience_match_score: match.details?.experienceLevel?.score || 
                    (match.details?.experienceLevel?.match ? 100 : 
                    Math.min(100, ((match.details?.experienceLevel?.candidate || 0) / 
                    Math.max(1, (match.details?.experienceLevel?.required || 1))) * 100)),
                  education_match_score: match.details?.educationLevel?.score || (match.details?.educationLevel?.match ? 100 : 0),
                  location_match_score: match.details?.location?.score || (match.details?.location?.match ? 100 : 0),
                  match_details: match.details || {
                    skills: { matched: [], missing: [], additional: [], matchPercentage: 0 }
                  }
                }
              } as ExtendedCandidateMatch;
            } catch (error) {
              console.error(`Error fetching candidate details for ${match.candidateId}:`, error);
              return {
                ...match,
                match: {
                  match_score: match.score,
                  skills_match_score: match.details?.skills?.matchPercentage || 0,
                  experience_match_score: match.details?.experienceLevel?.score || 
                    (match.details?.experienceLevel?.match ? 100 : 50),
                  education_match_score: match.details?.educationLevel?.score || (match.details?.educationLevel?.match ? 100 : 0),
                  location_match_score: match.details?.location?.score || (match.details?.location?.match ? 100 : 0),
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
      
      console.log("Starting recalculation of matches for job offer:", jobOfferId);
      await candidateMatchingService.calculateMatchesForJobOffer(jobOfferId);
      
      toast({
        title: "Calcul terminé",
        description: "Les correspondances ont été recalculées avec succès",
      });
      
      await fetchCandidateMatches();
      console.log("Matches recalculated and fetched");
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
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  
  const handleViewCandidate = (candidateId: string) => {
    navigate(`/candidates/${candidateId}`);
  };
  
  const handleEditJobOffer = () => {
    if (!jobOfferId) return;
    navigate(`/job-offers/${jobOfferId}/edit`);
  };
  
  const renderMatchedSkills = (item: ExtendedCandidateMatch) => {
    const matchDetailsSkills = item.match?.match_details?.skills?.matched;
    const detailsSkills = item.details?.skills?.matched;
    
    const matchedSkills = Array.isArray(matchDetailsSkills) 
      ? matchDetailsSkills 
      : Array.isArray(detailsSkills) 
        ? detailsSkills 
        : [];
    
    if (matchedSkills.length > 0) {
      return matchedSkills.map((skill: string, index: number) => (
        <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-800 border-green-200">
          {skill}
        </Badge>
      ));
    } else {
      return <span className="text-xs text-gray-500 italic">Aucune compétence correspondante</span>;
    }
  };
  
  const renderMissingSkills = (item: ExtendedCandidateMatch) => {
    const missingSkillsFromMatchDetails = item.match?.match_details?.skills?.missing;
    const missingSkillsFromDetails = item.details?.skills?.missing;
    
    const missingSkills = Array.isArray(missingSkillsFromMatchDetails) 
      ? missingSkillsFromMatchDetails 
      : Array.isArray(missingSkillsFromDetails) 
        ? missingSkillsFromDetails 
        : [];
    
    if (missingSkills.length > 0) {
      return missingSkills.map((skill: string, index: number) => (
        <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-800 border-red-200">
          {skill}
        </Badge>
      ));
    } else {
      return <span className="text-xs text-gray-500 italic">Aucune compétence manquante</span>;
    }
  };
  
  if (loading) {
    return (
      <Layout className="py-8 bg-sand/30">
        <LoadingState />
      </Layout>
    );
  }
  
  if (error || !jobOffer) {
    return (
      <Layout className="py-8 bg-sand/30">
        <ErrorState error={error} onBackClick={() => navigate('/job-offers')} />
      </Layout>
    );
  }
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        <JobOfferHeader 
          jobOffer={jobOffer}
          onEdit={handleEditJobOffer}
          onRecalculateMatches={handleRecalculateMatches}
          matchLoading={matchLoading}
        />
        
        {candidateMatches.length === 0 && <NoMatchesAlert />}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <JobOfferDetails jobOffer={jobOffer} formatDate={formatDate} />
          </div>
          
          <div>
            <MatchingStats candidateMatches={candidateMatches} />
          </div>
        </div>
        
        <CandidatesMatchingSection 
          candidateMatches={candidateMatches}
          jobOffer={jobOffer}
          onViewCandidate={handleViewCandidate}
          onRecalculateMatches={handleRecalculateMatches}
          matchLoading={matchLoading}
          renderMatchedSkills={renderMatchedSkills}
          renderMissingSkills={renderMissingSkills}
        />
      </div>
    </Layout>
  );
};

export default JobOfferDetail;
