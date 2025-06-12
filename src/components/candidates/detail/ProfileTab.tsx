import React from 'react';
import { Separator } from '@/components/ui/separator';
import type { CandidateData } from '@/services/data/candidateService';

// Import des composants optimisés
import IdentityContactSection from './profile/IdentityContactSection';
import ProfessionalSection from './profile/ProfessionalSection';
import PersonalNotesSection from './profile/PersonalNotesSection';
import LanguagesSection from './profile/LanguagesSection';
import NetworksReferencesSection from './profile/NetworksReferencesSection';
import ProjectsSection from './profile/ProjectsSection';
import PreferencesObjectivesSection from './profile/PreferencesObjectivesSection';
import CandidateAIScoreCard from '../CandidateAIScoreCard';
import DebugAIScoreButton from './DebugAIScoreButton';
import DatabaseDebugDisplay from './DatabaseDebugDisplay';

interface ProfileTabProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ candidate, isLoading, onRefresh }) => {
  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-sand/20 via-white to-navy/5 min-h-full">
      {/* Section principale - Score IA en première position pour Kevin Quaresma */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Score IA et analyse - Plus large et en première position */}
        <div className="xl:col-span-5 space-y-3">
          <CandidateAIScoreCard candidate={candidate} />
          {candidate.id && (
            <DebugAIScoreButton candidateId={candidate.id} />
          )}
        </div>
        
        {/* Identité & Contact */}
        <div className="xl:col-span-4">
          <IdentityContactSection candidate={candidate} />
        </div>
        
        {/* Informations professionnelles */}
        <div className="xl:col-span-3">
          <ProfessionalSection candidate={candidate} />
        </div>
      </div>
      
      {/* Notes personnelles - Section importante */}
      {candidate.id && <PersonalNotesSection candidateId={candidate.id} />}
      
      <Separator className="bg-gradient-to-r from-transparent via-navy/20 to-transparent" />
      
      {/* Sections secondaires - Affichées seulement si données présentes */}
      <div className="space-y-6">
        {/* Langues & International */}
        <LanguagesSection candidate={candidate} />
        
        {/* Réseaux & Références */}
        <NetworksReferencesSection candidate={candidate} />
        
        {/* Projets spécifiques (non redondants avec expériences) */}
        <ProjectsSection candidate={candidate} />
        
        {/* Préférences & Objectifs */}
        <PreferencesObjectivesSection candidate={candidate} />
      </div>
    </div>
  );
};

export default ProfileTab;
