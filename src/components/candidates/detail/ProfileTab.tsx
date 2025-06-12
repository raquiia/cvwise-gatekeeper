
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, BookOpen } from 'lucide-react';
import type { CandidateData } from '@/services/data/candidateService';

// Import des nouveaux composants optimisés
import HeroSection from './profile/HeroSection';
import CompactSkillsSection from './profile/CompactSkillsSection';
import CompactExperienceSection from './profile/CompactExperienceSection';
import ProfileSidebar from './profile/ProfileSidebar';
import PersonalNotesSection from './profile/PersonalNotesSection';

// Import des composants existants pour les sections détaillées
import LanguagesSection from './profile/LanguagesSection';
import NetworksReferencesSection from './profile/NetworksReferencesSection';
import ProjectsSection from './profile/ProjectsSection';
import PreferencesObjectivesSection from './profile/PreferencesObjectivesSection';
import SkillsEducationSection from './profile/SkillsEducationSection';
import ExperiencesSection from './profile/ExperiencesSection';

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
          
          {/* Vue compacte vs détaillée */}
          {!isDetailedView ? (
            <>
              {/* Vue compacte */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CompactExperienceSection candidate={candidate} />
                <CompactSkillsSection candidate={candidate} />
              </div>
              
              {/* Formation compacte */}
              {candidate.education && Array.isArray(candidate.education) && candidate.education.length > 0 && (
                <div className="bg-white/70 border border-navy/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-navy/10 text-navy">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-navy-dark">
                      Formation ({candidate.education.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {candidate.education.slice(0, 2).map((edu: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <div className="font-medium text-navy-dark">
                          {edu.degree || edu.diploma || 'Formation'}
                        </div>
                        <div className="text-muted-foreground">
                          {edu.institution || edu.school || 'Institution'} 
                          {edu.year && ` • ${edu.year}`}
                        </div>
                      </div>
                    ))}
                    {candidate.education.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{candidate.education.length - 2} formation{candidate.education.length - 2 > 1 ? 's' : ''} de plus...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Vue détaillée */}
              <ExperiencesSection candidate={candidate} />
              <SkillsEducationSection candidate={candidate} />
            </>
          )}
          
          {/* Sections contextuelles - Toujours en bas */}
          <Separator className="bg-gradient-to-r from-transparent via-navy/20 to-transparent" />
          
          <div className="space-y-6">
            <LanguagesSection candidate={candidate} />
            <NetworksReferencesSection candidate={candidate} />
            <ProjectsSection candidate={candidate} />
            <PreferencesObjectivesSection candidate={candidate} />
          </div>
        </div>

        {/* Sidebar droite (1/4) */}
        <div className="xl:col-span-1">
          <ProfileSidebar candidate={candidate} />
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
