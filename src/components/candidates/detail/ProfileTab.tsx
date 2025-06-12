
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';
import type { CandidateData } from '@/services/data/candidateService';

// Import des nouveaux composants optimisés
import HeroSection from './profile/HeroSection';
import CompactSkillsSection from './profile/CompactSkillsSection';
import ProfileSidebar from './profile/ProfileSidebar';
import PersonalNotesSection from './profile/PersonalNotesSection';

// Import des composants existants pour les sections détaillées
import ProjectsSection from './profile/ProjectsSection';
import PreferencesObjectivesSection from './profile/PreferencesObjectivesSection';
import SkillsEducationSection from './profile/SkillsEducationSection';

interface ProfileTabProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ candidate, isLoading, onRefresh }) => {
  const [isDetailedView, setIsDetailedView] = useState(false);

  return (
    <div className="space-y-6 bg-gradient-to-br from-sand/10 via-white to-navy/5 min-h-full">
      {/* Section Hero */}
      <HeroSection 
        candidate={candidate} 
        isLoading={isLoading}
        onRefresh={onRefresh}
      />

      {/* Toggle de vue */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-navy-dark">
          Profil détaillé
        </h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsDetailedView(!isDetailedView)}
          className="bg-white/80 border-navy/20 hover:border-navy/30 hover:bg-white/90 text-navy"
        >
          {isDetailedView ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Vue compacte
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Vue détaillée
            </>
          )}
        </Button>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Colonne principale (3/4) */}
        <div className="xl:col-span-3 space-y-6">
          {/* Notes personnelles - Toujours visible */}
          {candidate.id && <PersonalNotesSection candidateId={candidate.id} />}
          
          {/* Vue compacte vs détaillée pour les compétences uniquement */}
          {!isDetailedView ? (
            <CompactSkillsSection candidate={candidate} />
          ) : (
            <SkillsEducationSection candidate={candidate} />
          )}
          
          {/* Sections contextuelles - Uniquement projets et objectifs */}
          <Separator className="bg-gradient-to-r from-transparent via-navy/20 to-transparent" />
          
          <div className="space-y-6">
            <ProjectsSection candidate={candidate} />
            <PreferencesObjectivesSection candidate={candidate} />
          </div>
        </div>

        {/* Sidebar droite (1/4) - Simplifiée */}
        <div className="xl:col-span-1">
          <ProfileSidebar candidate={candidate} />
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
