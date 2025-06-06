
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { MapPin, Target, Users, Zap } from 'lucide-react';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

interface MatchingTabsProps {
  candidateMatches: ExtendedCandidateMatch[];
  children: (matches: ExtendedCandidateMatch[], sortKey: 'local' | 'global' | 'skills') => React.ReactNode;
}

const MatchingTabs: React.FC<MatchingTabsProps> = ({ candidateMatches, children }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'global' | 'skills'>('local');

  // Calculer les statistiques pour chaque onglet
  const localMatches = [...candidateMatches].sort((a, b) => (b.localScore || b.score) - (a.localScore || a.score));
  const globalMatches = [...candidateMatches].sort((a, b) => (b.globalScore || b.score) - (a.globalScore || a.score));
  const skillsMatches = [...candidateMatches].sort((a, b) => (b.skillsOnlyScore || b.score) - (a.skillsOnlyScore || a.score));

  const localExcellent = localMatches.filter(m => (m.localScore || m.score) >= 70).length;
  const globalExcellent = globalMatches.filter(m => (m.globalScore || m.score) >= 70).length;
  const skillsExcellent = skillsMatches.filter(m => (m.skillsOnlyScore || m.score) >= 70).length;

  const relocationCandidates = candidateMatches.filter(m => 
    m.details?.location?.needsRelocation && (m.globalScore || m.score) >= 60
  ).length;

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm border border-purple-200/30">
        <TabsTrigger value="local" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">Correspondances locales</span>
          <span className="sm:hidden">Local</span>
          {localExcellent > 0 && (
            <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800 text-xs">
              {localExcellent}
            </Badge>
          )}
        </TabsTrigger>
        
        <TabsTrigger value="global" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
          <Target className="h-4 w-4" />
          <span className="hidden sm:inline">Talents globaux</span>
          <span className="sm:hidden">Global</span>
          {globalExcellent > 0 && (
            <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800 text-xs">
              {globalExcellent}
            </Badge>
          )}
        </TabsTrigger>
        
        <TabsTrigger value="skills" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Compétences pures</span>
          <span className="sm:hidden">Skills</span>
          {skillsExcellent > 0 && (
            <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-800 text-xs">
              {skillsExcellent}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <div className="mt-4 mb-4 p-4 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200/30">
        {activeTab === 'local' && (
          <div className="text-sm text-purple-700 dark:text-purple-300">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Candidats disponibles localement</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Score incluant la localisation. Candidats immédiatement disponibles sans déménagement.
            </p>
          </div>
        )}
        
        {activeTab === 'global' && (
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" />
              <span className="font-medium">Tous les talents qualifiés</span>
              {relocationCandidates > 0 && (
                <Badge variant="outline" className="ml-2 text-xs border-amber-300 text-amber-700">
                  {relocationCandidates} candidat{relocationCandidates > 1 ? 's' : ''} à relocaliser
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Score sans pénalité de localisation. Affiche les meilleurs profils même s'ils nécessitent un déménagement.
            </p>
          </div>
        )}
        
        {activeTab === 'skills' && (
          <div className="text-sm text-orange-700 dark:text-orange-300">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4" />
              <span className="font-medium">Correspondance technique pure</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Score basé uniquement sur les compétences techniques. Idéal pour identifier les experts du domaine.
            </p>
          </div>
        )}
      </div>

      <TabsContent value="local" className="mt-0">
        {children(localMatches, 'local')}
      </TabsContent>
      
      <TabsContent value="global" className="mt-0">
        {children(globalMatches, 'global')}
      </TabsContent>
      
      <TabsContent value="skills" className="mt-0">
        {children(skillsMatches, 'skills')}
      </TabsContent>
    </Tabs>
  );
};

export default MatchingTabs;
