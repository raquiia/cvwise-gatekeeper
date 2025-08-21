
import React from 'react';
import { Separator } from '@/components/ui/separator';
import type { CandidateData } from '@/services/data/candidateService';

// Import des composants optimisés
import AdvancedSkillsSection from './profile/AdvancedSkillsSection';
import OptimizedProfileSidebar from './profile/OptimizedProfileSidebar';
import ModernProjectsSection from './profile/ModernProjectsSection';
import UnifiedNotesSection from './profile/UnifiedNotesSection';
import PreferencesObjectivesSection from './profile/PreferencesObjectivesSection';

interface ProfileTabProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ candidate, isLoading, onRefresh }) => {
  return (
    <div className="space-y-8">
      {/* Header simplifié */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-navy via-navy-dark to-purple-700 bg-clip-text text-transparent mb-2">
          Profil Professionnel
        </h2>
        <p className="text-muted-foreground">
          Vue complète du candidat {candidate.first_name} {candidate.last_name}
        </p>
      </div>

      {/* Layout principal optimisé */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Colonne principale (2/3) */}
        <div className="xl:col-span-2 space-y-8">
          {/* Notes unifiées - Section prioritaire */}
          {candidate.id && <UnifiedNotesSection candidateId={candidate.id} />}
          
          {/* Compétences avancées */}
          <AdvancedSkillsSection candidate={candidate} />
          
          {/* Séparateur élégant */}
          <div className="relative">
            <Separator className="bg-gradient-to-r from-transparent via-navy/20 to-transparent" />
            <div className="absolute inset-0 flex justify-center">
              <div className="bg-gradient-to-r from-navy/10 to-purple/10 px-4 py-1 rounded-full">
                <span className="text-xs font-medium text-navy/60">Projets & Réalisations</span>
              </div>
            </div>
          </div>
          
          {/* Projets modernes */}
          <ModernProjectsSection candidate={candidate} />
          
          {/* Préférences et objectifs */}
          <PreferencesObjectivesSection candidate={candidate} />
        </div>

        {/* Sidebar optimisée (1/3) */}
        <div className="xl:col-span-1">
          <div className="sticky top-8">
            <OptimizedProfileSidebar candidate={candidate} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
