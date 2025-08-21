import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Languages,
  Building,
  Target,
  Clock,
  DollarSign,
  Car,
  Download,
  Share,
  Heart,
  Briefcase,
  Calendar
} from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';
import { toast } from '@/hooks/use-toast';

interface OptimizedProfileSidebarProps {
  candidate: CandidateData;
}

const OptimizedProfileSidebar: React.FC<OptimizedProfileSidebarProps> = ({ candidate }) => {
  const languages = ensureArray<any>(candidate.languages);
  const experiences = ensureArray<any>(candidate.experiences);
  
  // Actions fonctionnelles
  const handleDownloadCV = () => {
    // TODO: Implémenter le téléchargement du CV
    toast({
      title: "Fonction à venir",
      description: "Le téléchargement du CV sera bientôt disponible",
    });
  };

  const handleShareProfile = () => {
    // TODO: Implémenter le partage de profil
    const profileUrl = `${window.location.origin}/candidates/${candidate.id}`;
    navigator.clipboard.writeText(profileUrl).then(() => {
      toast({
        title: "Lien copié",
        description: "Le lien du profil a été copié dans le presse-papier",
      });
    });
  };

  const handleAddToFavorites = () => {
    // TODO: Implémenter les favoris
    toast({
      title: "Fonction à venir",
      description: "Les favoris seront bientôt disponibles",
    });
  };

  return (
    <div className="space-y-6">
      {/* Timeline des expériences */}
      {experiences.length > 0 && (
        <Card className="border-navy/20 shadow-xl bg-gradient-to-br from-white via-purple/2 to-pink-50/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                <Briefcase className="w-4 h-4" />
              </div>
              Parcours Express
              <Badge variant="outline" className="ml-auto bg-purple-50 text-purple-600">
                {experiences.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {experiences.slice(0, 3).map((exp: any, idx: number) => (
              <div key={idx} className="relative">
                {idx < 2 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-gradient-to-b from-purple-200 to-transparent"></div>
                )}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Building className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-navy-dark line-clamp-1">
                      {exp.position || exp.title || 'Poste non spécifié'}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {exp.company || 'Entreprise non spécifiée'}
                    </div>
                    {exp.duration && (
                      <div className="text-xs text-purple-600 font-medium mt-1">
                        {exp.duration}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {experiences.length > 3 && (
              <div className="text-center pt-2">
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600">
                  +{experiences.length - 3} autres expériences
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Langues principales */}
      {languages.length > 0 && (
        <Card className="border-navy/20 shadow-xl bg-gradient-to-br from-white via-green/2 to-emerald-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg">
                <Languages className="w-4 h-4" />
              </div>
              Langues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {languages.slice(0, 4).map((lang: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/50 border border-green-100">
                <span className="text-sm font-medium text-navy-dark">
                  {typeof lang === 'string' ? lang : lang.language || 'Langue non spécifiée'}
                </span>
                {lang.level && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                    {lang.level}
                  </Badge>
                )}
              </div>
            ))}
            {languages.length > 4 && (
              <div className="text-center">
                <Badge variant="outline" className="text-xs bg-green-50 text-green-600">
                  +{languages.length - 4} autres langues
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Préférences professionnelles */}
      <Card className="border-navy/20 shadow-xl bg-gradient-to-br from-white via-gold/2 to-yellow-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
            <div className="p-2 rounded-xl bg-gradient-to-br from-gold to-yellow-500 text-white shadow-lg">
              <Target className="w-4 h-4" />
            </div>
            Préférences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidate.salary_expectations && (
            <div className="bg-white/50 rounded-lg p-3 border border-gold/20">
              <div className="text-xs text-muted-foreground mb-1">Salaire souhaité</div>
              <div className="flex items-center gap-2 text-sm font-medium text-navy-dark">
                <DollarSign className="w-3 h-3 text-gold" />
                {candidate.salary_expectations}
              </div>
            </div>
          )}
          
          {candidate.availability && (
            <div className="bg-white/50 rounded-lg p-3 border border-gold/20">
              <div className="text-xs text-muted-foreground mb-1">Disponibilité</div>
              <div className="flex items-center gap-2 text-sm font-medium text-navy-dark">
                <Calendar className="w-3 h-3 text-green-600" />
                {candidate.availability}
              </div>
            </div>
          )}
          
          {candidate.mobility && (
            <div className="bg-white/50 rounded-lg p-3 border border-gold/20">
              <div className="text-xs text-muted-foreground mb-1">Mobilité</div>
              <div className="flex items-center gap-2 text-sm font-medium text-navy-dark">
                <Car className="w-3 h-3 text-blue-600" />
                {candidate.mobility}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {candidate.remote_preference && (
              <Badge variant="outline" className="w-full justify-center bg-blue-50 text-blue-600 border-blue-200">
                {candidate.remote_preference}
              </Badge>
            )}
            {candidate.contract_type && (
              <Badge variant="outline" className="w-full justify-center bg-purple-50 text-purple-600 border-purple-200">
                {candidate.contract_type}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions fonctionnelles */}
      <Card className="border-navy/20 shadow-xl bg-gradient-to-br from-white to-navy/5">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full bg-white/70 hover:bg-white transition-all duration-200"
              onClick={handleDownloadCV}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger CV
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full bg-white/70 hover:bg-white transition-all duration-200"
              onClick={handleShareProfile}
            >
              <Share className="w-4 h-4 mr-2" />
              Partager profil
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full bg-white/70 hover:bg-white transition-all duration-200 text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleAddToFavorites}
            >
              <Heart className="w-4 h-4 mr-2" />
              Ajouter aux favoris
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedProfileSidebar;