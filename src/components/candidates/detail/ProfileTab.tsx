
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
    <div className="space-y-6 bg-gradient-to-br from-background/80 via-background to-muted/20 min-h-full p-6">
      {/* Section Hero */}
      <HeroSection 
        candidate={candidate} 
        isLoading={isLoading}
        onRefresh={onRefresh}
      />

      {/* Toggle de vue */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">
          Profil détaillé
        </h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsDetailedView(!isDetailedView)}
          className="btn-modern border-border/60 text-foreground hover:border-primary/30 hover:bg-accent/80"
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
          <Separator className="bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          
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
