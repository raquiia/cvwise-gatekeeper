
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';
import type { CandidateData } from '@/services/data/candidateService';

// Import des nouveaux composants modernes
import ProfessionalHeroSection from './profile/ProfessionalHeroSection';
import AdvancedSkillsSection from './profile/AdvancedSkillsSection';
import PremiumProfileSidebar from './profile/PremiumProfileSidebar';
import ModernProjectsSection from './profile/ModernProjectsSection';
import PersonalNotesSection from './profile/PersonalNotesSection';

// Import des composants existants pour la vue détaillée
import CompactSkillsSection from './profile/CompactSkillsSection';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
        {/* Toggle de vue modernisé */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-navy via-navy-dark to-purple-700 bg-clip-text text-transparent mb-2">
              Profil Professionnel
            </h2>
            <p className="text-muted-foreground">
              Vue complète du candidat {candidate.first_name} {candidate.last_name}
            </p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsDetailedView(!isDetailedView)}
            className="bg-white/80 border-navy/20 text-navy hover:bg-navy/10 hover:border-navy/40 transition-all duration-300 shadow-lg"
          >
            {isDetailedView ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Vue moderne
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Vue détaillée
              </>
            )}
          </Button>
        </div>

        {/* Hero Section */}
        <ProfessionalHeroSection 
          candidate={candidate} 
          isLoading={isLoading}
          onRefresh={onRefresh}
        />

        {/* Layout principal */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Colonne principale (2/3) */}
          <div className="xl:col-span-2 space-y-8">
            {/* Notes personnelles - Toujours visible en premier */}
            {candidate.id && <PersonalNotesSection candidateId={candidate.id} />}
            
            {/* Compétences - Vue moderne vs détaillée */}
            {!isDetailedView ? (
              <AdvancedSkillsSection candidate={candidate} />
            ) : (
              <SkillsEducationSection candidate={candidate} />
            )}
            
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
            
            {/* Section Préférences et Objectifs - seulement en vue détaillée */}
            {isDetailedView && (
              <>
                <Separator className="bg-gradient-to-r from-transparent via-navy/20 to-transparent" />
                <PreferencesObjectivesSection candidate={candidate} />
              </>
            )}
          </div>

          {/* Sidebar premium (1/3) */}
          <div className="xl:col-span-1">
            <div className="sticky top-8">
              <PremiumProfileSidebar candidate={candidate} />
            </div>
          </div>
        </div>

        {/* Vue compacte alternative pour petits écrans */}
        <div className="xl:hidden mt-8">
          {!isDetailedView && (
            <CompactSkillsSection candidate={candidate} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
