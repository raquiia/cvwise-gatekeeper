
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe } from 'lucide-react';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

interface MatchingTabsProps {
  candidateMatches: ExtendedCandidateMatch[];
  children: (matches: ExtendedCandidateMatch[], sortKey: 'local' | 'distant') => React.ReactNode;
}

const MatchingTabs: React.FC<MatchingTabsProps> = ({ candidateMatches, children }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'distant'>('local');

  // Séparer les candidats selon leur besoin de relocalisation
  const localMatches = candidateMatches.filter(match => {
    // Un candidat est considéré comme local s'il n'a pas besoin de relocalisation
    return !match.details?.location?.needsRelocation;
  }).sort((a, b) => b.score - a.score);

  const distantMatches = candidateMatches.filter(match => {
    // Un candidat est considéré comme distant s'il a besoin de relocalisation
    return match.details?.location?.needsRelocation;
  }).sort((a, b) => b.score - a.score);

  // Calculer les statistiques pour chaque onglet
  const localExcellent = localMatches.filter(m => m.score >= 70).length;
  const distantExcellent = distantMatches.filter(m => m.score >= 70).length;

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm border border-purple-200/30">
        <TabsTrigger value="local" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">Candidats locaux</span>
          <span className="sm:hidden">Locaux</span>
          <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800 text-xs">
            {localMatches.length}
          </Badge>
          {localExcellent > 0 && (
            <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800 text-xs">
              {localExcellent} excellent{localExcellent > 1 ? 's' : ''}
            </Badge>
          )}
        </TabsTrigger>
        
        <TabsTrigger value="distant" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Candidats distants</span>
          <span className="sm:hidden">Distants</span>
          <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800 text-xs">
            {distantMatches.length}
          </Badge>
          {distantExcellent > 0 && (
            <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800 text-xs">
              {distantExcellent} excellent{distantExcellent > 1 ? 's' : ''}
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
              Candidats dans la même région ou ville que l'offre d'emploi. Pas de relocalisation nécessaire.
            </p>
          </div>
        )}
        
        {activeTab === 'distant' && (
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4" />
              <span className="font-medium">Candidats nécessitant une relocalisation</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Candidats qualifiés mais situés dans une région différente. Relocalisation nécessaire.
            </p>
          </div>
        )}
      </div>

      <TabsContent value="local" className="mt-0">
        {children(localMatches, 'local')}
      </TabsContent>
      
      <TabsContent value="distant" className="mt-0">
        {children(distantMatches, 'distant')}
      </TabsContent>
    </Tabs>
  );
};

export default MatchingTabs;
