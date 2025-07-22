
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
import PMOJobDebugger from '@/components/matching/PMOJobDebugger';
import CacheDebugInfo from '@/components/matching/CacheDebugInfo';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

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
  
  // Create wrapper functions that find the ExtendedCandidateMatch by candidateId
  const renderMatchedSkillsForSection = (candidateId: string, jobOfferId: string) => {
    const match = candidateMatches.find(m => m.candidateId === candidateId);
    if (!match) return <span className="text-xs text-gray-500 italic">Candidat non trouvé</span>;
    return renderMatchedSkills(match);
  };
  
  const renderMissingSkillsForSection = (candidateId: string, jobOfferId: string) => {
    const match = candidateMatches.find(m => m.candidateId === candidateId);
    if (!match) return <span className="text-xs text-gray-500 italic">Candidat non trouvé</span>;
    return renderMissingSkills(match);
  };
  
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
  
  // Déterminer si c'est un job PMO pour afficher le debug spécialisé
  const isPMOJob = jobOffer.title?.toLowerCase().includes('pmo') || 
                  jobOffer.title?.toLowerCase().includes('project') ||
                  jobOffer.title?.toLowerCase().includes('ingénieur projet');
  
  return (
    <Layout className="py-8 bg-gradient-to-br from-purple-50/50 to-white dark:from-navy-dark/90 dark:to-navy-dark">
      <div className="container mx-auto px-4">
        <JobOfferHeader 
          jobOffer={jobOffer}
          onEdit={handleEditJobOffer}
          onRecalculateMatches={() => handleRecalculateMatches(false)}
          matchLoading={matchLoading}
        />
        
        {/* Debug Tools pour les jobs PMO */}
        {isPMOJob && jobOfferId && (
          <div className="mb-6 space-y-4">
            <PMOJobDebugger 
              jobOfferId={jobOfferId} 
              jobTitle={jobOffer.title}
            />
            <CacheDebugInfo />
          </div>
        )}
        
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
          renderMatchedSkills={renderMatchedSkillsForSection}
          renderMissingSkills={renderMissingSkillsForSection}
        />
      </div>
    </Layout>
  );
};

export default JobOfferDetail;
