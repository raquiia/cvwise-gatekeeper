
import React from 'react';
import { Separator } from '@/components/ui/separator';
import ScoreDisplay from './ScoreDisplay';
import type { CandidateData } from '@/services/data/candidateService';

// Import des nouveaux composants de section
import IdentityContactSection from './profile/IdentityContactSection';
import ProfessionalSection from './profile/ProfessionalSection';
import SkillsEducationSection from './profile/SkillsEducationSection';
import ExperiencesSection from './profile/ExperiencesSection';
import LanguagesSection from './profile/LanguagesSection';
import NetworksReferencesSection from './profile/NetworksReferencesSection';
import ProjectsSection from './profile/ProjectsSection';
import PreferencesObjectivesSection from './profile/PreferencesObjectivesSection';
import AdministrationSection from './profile/AdministrationSection';

interface ProfileTabProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ candidate, isLoading, onRefresh }) => {
  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-sand/20 via-white to-navy/5 min-h-full">
      {/* Score IA en en-tête (conservé pour la visibilité) */}
      <div className="relative">
        <ScoreDisplay 
          candidate={candidate} 
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      </div>
      
      <Separator className="bg-gradient-to-r from-transparent via-navy/20 to-transparent" />
      
      {/* Sections organisées */}
      <div className="space-y-8">
        {/* Section Identité & Contact */}
        <IdentityContactSection candidate={candidate} />
        
        {/* Section Professionnelle */}
        <ProfessionalSection candidate={candidate} />
        
        {/* Section Compétences & Formation */}
        <SkillsEducationSection candidate={candidate} />
        
        {/* Section Expériences détaillées */}
        <ExperiencesSection candidate={candidate} />
        
        {/* Section Langues & International */}
        <LanguagesSection candidate={candidate} />
        
        {/* Section Réseaux & Références */}
        <NetworksReferencesSection candidate={candidate} />
        
        {/* Section Projets */}
        <ProjectsSection candidate={candidate} />
        
        {/* Section Préférences & Objectifs */}
        <PreferencesObjectivesSection candidate={candidate} />
        
        {/* Section Administration */}
        <AdministrationSection 
          candidate={candidate} 
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );
};

export default ProfileTab;
