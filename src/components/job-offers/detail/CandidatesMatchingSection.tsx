
import React from 'react';
import { User, FileText, Briefcase } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CandidateCard from './CandidateCard';
import SkillsMatchCandidateCard from './SkillsMatchCandidateCard';
import ExperienceMatchCandidateCard from './ExperienceMatchCandidateCard';
import EmptyMatchesPlaceholder from './EmptyMatchesPlaceholder';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';
import type { JobOffer } from '@/services/data/job-offers/types';

interface CandidatesMatchingSectionProps {
  candidateMatches: ExtendedCandidateMatch[];
  jobOffer: JobOffer;
  onViewCandidate: (candidateId: string) => void;
  onRecalculateMatches: () => void;
  matchLoading: boolean;
  renderMatchedSkills: (item: ExtendedCandidateMatch) => React.ReactNode;
  renderMissingSkills: (item: ExtendedCandidateMatch) => React.ReactNode;
}

const CandidatesMatchingSection = ({
  candidateMatches,
  jobOffer,
  onViewCandidate,
  onRecalculateMatches,
  matchLoading,
  renderMatchedSkills,
  renderMissingSkills
}: CandidatesMatchingSectionProps) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-navy mb-4">Candidats correspondants</h2>
      
      <Tabs defaultValue="ranked">
        <TabsList className="mb-4">
          <TabsTrigger value="ranked">
            <User className="h-4 w-4 mr-2" />
            Par score global
          </TabsTrigger>
          <TabsTrigger value="skills">
            <FileText className="h-4 w-4 mr-2" />
            Par compétences
          </TabsTrigger>
          <TabsTrigger value="experience">
            <Briefcase className="h-4 w-4 mr-2" />
            Par expérience
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ranked">
          {candidateMatches.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {candidateMatches
                .sort((a, b) => {
                  // Sort by overall match score first
                  const scoreA = (b.match?.match_score || b.score) - (a.match?.match_score || a.score);
                  
                  // If scores are equal, use name as tiebreaker
                  if (scoreA === 0) {
                    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
                  }
                  
                  return scoreA;
                })
                .map((item) => (
                  <CandidateCard 
                    key={item.candidateId}
                    candidate={item} 
                    onViewCandidate={onViewCandidate}
                    renderMatchedSkills={renderMatchedSkills}
                  />
                ))}
            </div>
          ) : (
            <EmptyMatchesPlaceholder 
              onRecalculateMatches={onRecalculateMatches}
              matchLoading={matchLoading}
            />
          )}
        </TabsContent>
        
        <TabsContent value="skills">
          {candidateMatches.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {candidateMatches
                .sort((a, b) => {
                  // Sort by skills match score
                  const skillScoreA = (b.match?.skills_match_score || (b.details?.skills.matchPercentage || 0));
                  const skillScoreB = (a.match?.skills_match_score || (a.details?.skills.matchPercentage || 0));
                  
                  const scoreDiff = skillScoreA - skillScoreB;
                  
                  // If scores are equal, use name as tiebreaker
                  if (scoreDiff === 0) {
                    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
                  }
                  
                  return scoreDiff;
                })
                .map((item) => (
                  <SkillsMatchCandidateCard 
                    key={item.candidateId}
                    candidate={item} 
                    onViewCandidate={onViewCandidate}
                    renderMatchedSkills={renderMatchedSkills}
                    renderMissingSkills={renderMissingSkills}
                  />
                ))}
            </div>
          ) : (
            <EmptyMatchesPlaceholder 
              onRecalculateMatches={onRecalculateMatches}
              matchLoading={matchLoading}
            />
          )}
        </TabsContent>
        
        <TabsContent value="experience">
          {candidateMatches.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {candidateMatches
                .sort((a, b) => {
                  // Sort by experience match score
                  const expScoreA = b.match?.experience_match_score || 
                      (b.details?.experienceLevel.score || 
                      (b.details?.experienceLevel.match ? 100 : 
                      Math.min(100, ((b.details?.experienceLevel.candidate || 0) / 
                      Math.max(1, (b.details?.experienceLevel.required || 1))) * 100)));
                  
                  const expScoreB = a.match?.experience_match_score || 
                      (a.details?.experienceLevel.score || 
                      (a.details?.experienceLevel.match ? 100 : 
                      Math.min(100, ((a.details?.experienceLevel.candidate || 0) / 
                      Math.max(1, (a.details?.experienceLevel.required || 1))) * 100)));
                  
                  const scoreDiff = expScoreA - expScoreB;
                  
                  // If scores are equal, use name as tiebreaker
                  if (scoreDiff === 0) {
                    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
                  }
                  
                  return scoreDiff;
                })
                .map((item) => (
                  <ExperienceMatchCandidateCard 
                    key={item.candidateId}
                    candidate={item} 
                    onViewCandidate={onViewCandidate}
                    jobOfferExperienceMin={jobOffer.experience_years_min || 0}
                    jobOfferExperienceMax={jobOffer.experience_years_max}
                  />
                ))}
            </div>
          ) : (
            <EmptyMatchesPlaceholder 
              onRecalculateMatches={onRecalculateMatches}
              matchLoading={matchLoading}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CandidatesMatchingSection;
