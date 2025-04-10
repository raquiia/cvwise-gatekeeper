
import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

export function useCandidateSkillsRenderer() {
  const renderMatchedSkills = (item: ExtendedCandidateMatch) => {
    // First try to get matched skills from match.match_details path
    const matchDetailsSkills = item.match?.match_details?.skills?.matched;
    
    // Then try from details path
    const detailsSkills = item.details?.skills?.matched;
    
    // Use a safe array with comprehensive fallbacks
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
    // Similar approach for missing skills with multiple fallbacks
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

  return {
    renderMatchedSkills,
    renderMissingSkills
  };
}
