
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useJobOfferDetails } from '@/hooks/use-job-offer-details';
import { useCandidateSkillsRenderer } from '@/hooks/use-candidate-skills-renderer';
import { useDateFormatter } from '@/hooks/use-date-formatter';

import JobOfferHeader from '@/components/job-offers/detail/JobOfferHeader';
import JobOfferDetails from '@/components/job-offers/detail/JobOfferDetails';
import MatchingStats from '@/components/job-offers/detail/MatchingStats';
import NoMatchesAlert from '@/components/job-offers/detail/NoMatchesAlert';
import CandidatesMatchingSection from '@/components/job-offers/detail/CandidatesMatchingSection';
import ErrorState from '@/components/job-offers/detail/ErrorState';
import LoadingState from '@/components/job-offers/detail/LoadingState';
import { CandidateMatch } from '@/services/data/candidate-matching/types';

const JobOfferDetail = () => {
  const { jobOfferId } = useParams<{ jobOfferId: string }>();
  const navigate = useNavigate();
  const { 
    jobOffer, 
    candidateMatches, 
    loading, 
    matchLoading, 
    error, 
    handleRecalculateMatches 
  } = useJobOfferDetails(jobOfferId);
  const { renderMatchedSkills, renderMissingSkills } = useCandidateSkillsRenderer();
  const { formatDate } = useDateFormatter();
  
  const handleViewCandidate = (candidateId: string) => {
    navigate(`/candidates/${candidateId}`);
  };
  
  const handleEditJobOffer = () => {
    if (!jobOfferId) return;
    navigate(`/job-offers/${jobOfferId}/edit`);
  };
  
  // Fix: Update skills renderer functions to match expected signature
  const renderMatchedSkillsForSection = (candidateId: string, jobOfferId: string) => {
    return renderMatchedSkills(candidateId);
  };
  
  const renderMissingSkillsForSection = (candidateId: string, jobOfferId: string) => {
    return renderMissingSkills(candidateId);
  };

  // Convert ExtendedCandidateMatch[] to CandidateMatch[] for compatibility
  const convertedMatches: CandidateMatch[] = candidateMatches.map(match => ({
    id: match.candidateId,
    candidate_id: match.candidateId,
    job_offer_id: jobOfferId || '',
    match_score: match.score,
    skills_match_score: match.match?.skills_match_score || 0,
    experience_match_score: match.match?.experience_match_score || 0,
    education_match_score: match.match?.education_match_score || 0,
    location_match_score: match.match?.location_match_score || 0,
    match_details: match.match?.match_details || match.details,
    calculated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Add additional fields from ExtendedCandidateMatch for backward compatibility
    first_name: match.firstName,
    last_name: match.lastName,
    position: match.position,
    company: match.company,
    candidate: match.candidate,
    match: match.match
  }));
  
  if (loading) {
    return (
      <Layout className="py-8 bg-gradient-to-br from-purple-50/50 to-white dark:from-navy-dark/90 dark:to-navy-dark">
        <LoadingState />
      </Layout>
    );
  }
  
  if (error || !jobOffer) {
    return (
      <Layout className="py-8 bg-gradient-to-br from-purple-50/50 to-white dark:from-navy-dark/90 dark:to-navy-dark">
        <ErrorState error={error} onBackClick={() => navigate('/job-offers')} />
      </Layout>
    );
  }
  
  return (
    <Layout className="py-8 bg-gradient-to-br from-purple-50/50 to-white dark:from-navy-dark/90 dark:to-navy-dark">
      <div className="container mx-auto px-4">
        <JobOfferHeader 
          jobOffer={jobOffer}
          onEdit={handleEditJobOffer}
          onRecalculateMatches={handleRecalculateMatches}
          matchLoading={matchLoading}
        />
        
        {convertedMatches.length === 0 && <NoMatchesAlert />}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <JobOfferDetails jobOffer={jobOffer} formatDate={formatDate} />
          </div>
          
          <div>
            <MatchingStats candidateMatches={convertedMatches} />
          </div>
        </div>
        
        <CandidatesMatchingSection 
          candidateMatches={convertedMatches}
          jobOffer={jobOffer}
          onViewCandidate={handleViewCandidate}
          onRecalculateMatches={handleRecalculateMatches}
          matchLoading={matchLoading}
          renderMatchedSkills={renderMatchedSkillsForSection}
          renderMissingSkills={renderMissingSkillsForSection}
        />
      </div>
    </Layout>
  );
};

export default JobOfferDetail;
