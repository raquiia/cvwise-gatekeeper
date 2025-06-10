
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, FileText, BarChart3, Clock, Database } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import ScoreDisplay from '../ScoreDisplay';

interface AdministrationSectionProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const AdministrationSection: React.FC<AdministrationSectionProps> = ({ 
  candidate, 
  isLoading, 
  onRefresh 
}) => {
  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <Settings className="w-5 h-5" />
          </div>
          Administration & Métriques
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score IA */}
        <div className="space-y-3">
          <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Score IA
          </h4>
          <ScoreDisplay 
            candidate={candidate} 
            isLoading={isLoading}
            onRefresh={onRefresh}
          />
        </div>

        {/* Statuts et métadonnées */}
        <div className="space-y-4">
          <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Statuts & Métadonnées
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidate.status && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Statut général</div>
                <Badge variant="outline" className="text-navy border-navy/30">
                  {candidate.status}
                </Badge>
              </div>
            )}
            
            {candidate.detailed_status && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Statut détaillé</div>
                <Badge variant="secondary" className="bg-navy/10 text-navy">
                  {candidate.detailed_status}
                </Badge>
              </div>
            )}
            
            {candidate.profile_completeness !== undefined && candidate.profile_completeness !== null && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Complétude du profil</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-navy h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${candidate.profile_completeness}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-navy">
                    {candidate.profile_completeness}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Identifiants et dates */}
        <div className="space-y-4">
          <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Identifiants & Historique
          </h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
              <div className="font-medium text-navy-dark">Identifiants</div>
              <div className="space-y-2 text-xs font-mono">
                {candidate.id && (
                  <div>
                    <span className="text-muted-foreground">ID Candidat:</span>
                    <div className="break-all text-navy">{candidate.id}</div>
                  </div>
                )}
                {candidate.user_id && (
                  <div>
                    <span className="text-muted-foreground">ID Utilisateur:</span>
                    <div className="break-all text-navy">{candidate.user_id}</div>
                  </div>
                )}
                {candidate.resume_id && (
                  <div>
                    <span className="text-muted-foreground">ID CV:</span>
                    <div className="break-all text-navy">{candidate.resume_id}</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
              <div className="font-medium text-navy-dark flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Historique
              </div>
              <div className="space-y-2 text-xs">
                {candidate.created_at && (
                  <div>
                    <span className="text-muted-foreground">Créé le:</span>
                    <div className="text-navy">{new Date(candidate.created_at).toLocaleString('fr-FR')}</div>
                  </div>
                )}
                {candidate.updated_at && (
                  <div>
                    <span className="text-muted-foreground">Modifié le:</span>
                    <div className="text-navy">{new Date(candidate.updated_at).toLocaleString('fr-FR')}</div>
                  </div>
                )}
                {candidate.last_updated_at && candidate.last_updated_at !== candidate.updated_at && (
                  <div>
                    <span className="text-muted-foreground">Dernière MAJ:</span>
                    <div className="text-navy">{new Date(candidate.last_updated_at).toLocaleString('fr-FR')}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdministrationSection;
