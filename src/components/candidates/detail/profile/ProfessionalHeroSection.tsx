
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Briefcase, 
  Building, 
  MapPin, 
  Star, 
  Trophy, 
  Target,
  Clock,
  TrendingUp,
  Edit,
  Mail,
  Phone
} from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { getLastCompany } from '@/utils/companyUtils';
import ScoreDisplay from '../ScoreDisplay';

interface ProfessionalHeroSectionProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ProfessionalHeroSection: React.FC<ProfessionalHeroSectionProps> = ({ 
  candidate, 
  isLoading, 
  onRefresh 
}) => {
  const lastCompany = getLastCompany(candidate);
  
  // Construire l'adresse complète
  const getFullAddress = () => {
    const addressParts = [
      candidate.address?.trim(),
      candidate.postal_code?.trim(),
      candidate.city?.trim(),
      candidate.country?.trim()
    ].filter(Boolean);
    
    if (addressParts.length > 0) {
      return addressParts.join(', ');
    }
    
    return candidate.location?.trim() || '';
  };

  const fullAddress = getFullAddress();

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient moderne */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy/8 via-blue-600/5 to-purple-600/8"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-gold/10 to-transparent rounded-full blur-3xl"></div>
      
      <Card className="relative border-0 bg-white/70 backdrop-blur-xl shadow-2xl">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informations principales - 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header avec nom et titre */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-navy via-navy-dark to-purple-700 bg-clip-text text-transparent mb-3">
                    {candidate.first_name} {candidate.last_name}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    {candidate.position && (
                      <div className="flex items-center gap-2 text-xl text-navy-dark font-semibold">
                        <div className="p-2 rounded-lg bg-navy/10">
                          <Briefcase className="w-5 h-5 text-navy" />
                        </div>
                        {candidate.position}
                      </div>
                    )}
                    
                    {lastCompany !== 'Non spécifiée' && (
                      <div className="flex items-center gap-2 text-lg text-muted-foreground">
                        <Building className="w-4 h-4" />
                        <span className="font-medium">{lastCompany}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats professionnelles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {candidate.years_experience !== undefined && candidate.years_experience !== null && (
                    <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl p-4 border border-gold/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gold/20">
                          <Trophy className="w-5 h-5 text-gold-dark" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gold-dark">
                            {candidate.years_experience}
                          </div>
                          <div className="text-sm text-muted-foreground">Années d'expérience</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {candidate.availability && (
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-xl p-4 border border-green-500/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <Clock className="w-5 h-5 text-green-700" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-green-700">Disponible</div>
                          <div className="text-xs text-muted-foreground">{candidate.availability}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {candidate.detailed_status && (
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-xl p-4 border border-blue-500/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Target className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-blue-700">Statut</div>
                          <div className="text-xs text-muted-foreground">{candidate.detailed_status}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact rapide */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  {candidate.email && (
                    <a 
                      href={`mailto:${candidate.email}`}
                      className="flex items-center gap-2 text-navy-dark hover:text-navy transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-navy/10 group-hover:bg-navy/20 transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{candidate.email}</span>
                    </a>
                  )}
                  
                  {candidate.phone && (
                    <a 
                      href={`tel:${candidate.phone}`}
                      className="flex items-center gap-2 text-navy-dark hover:text-navy transition-colors group"
                    >
                      <div className="p-1.5 rounded-md bg-navy/10 group-hover:bg-navy/20 transition-colors">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{candidate.phone}</span>
                    </a>
                  )}
                  
                  {fullAddress && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{fullAddress}</span>
                    </div>
                  )}
                </div>

                {/* Badges et préférences */}
                <div className="flex flex-wrap gap-2">
                  {candidate.remote_preference && (
                    <Badge variant="outline" className="border-purple-500/30 text-purple-700 bg-purple-50">
                      {candidate.remote_preference}
                    </Badge>
                  )}
                  
                  {candidate.contract_type && (
                    <Badge variant="outline" className="border-navy/30 text-navy bg-navy/5">
                      {candidate.contract_type}
                    </Badge>
                  )}
                  
                  {candidate.salary_expectations && (
                    <Badge variant="outline" className="border-green-500/30 text-green-700 bg-green-50">
                      {candidate.salary_expectations}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Score et actions - 1/3 */}
            <div className="lg:col-span-1 space-y-6">
              <ScoreDisplay 
                candidate={candidate} 
                isLoading={isLoading}
                onRefresh={onRefresh}
              />
              
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full bg-white/80 border-navy/20 text-navy hover:bg-navy/10 hover:border-navy/40 transition-all duration-300 group"
                >
                  <Edit className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Modifier le profil
                </Button>
                
                <Button 
                  className="w-full bg-gradient-to-r from-navy to-navy-dark hover:from-navy-dark hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analyser les opportunités
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalHeroSection;
