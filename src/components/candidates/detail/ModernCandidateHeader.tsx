
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Briefcase, 
  Edit, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar,
  Star,
  Target,
  Building,
  Crown,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CandidateData } from '@/services/data/candidateService';
import StatusSelector from './StatusSelector';
import ExportProfileButton from './ExportProfileButton';

import ScoreDisplay from './ScoreDisplay';

interface ModernCandidateHeaderProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ModernCandidateHeader: React.FC<ModernCandidateHeaderProps> = ({
  candidate,
  isLoading,
  onRefresh
}) => {
  const navigate = useNavigate();

  const initials = `${candidate.first_name?.charAt(0) || ''}${candidate.last_name?.charAt(0) || ''}`;

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
    
    // Fallback sur location si pas d'adresse structurée
    return candidate.location?.trim() || '';
  };

  const fullAddress = getFullAddress();

  return (
    <div className="relative">
      {/* Background avec gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy/5 via-purple/5 to-blue/5 rounded-2xl"></div>
      
      <Card className="relative border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Navigation */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-navy transition-all duration-300 group"
              onClick={() => navigate('/candidates')}
            >
              <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="border-b border-transparent group-hover:border-muted-foreground transition-colors duration-300">
                Retour aux candidats
              </span>
            </Button>
          </div>

          {/* Header principal */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Avatar et infos principales */}
            <div className="flex gap-6">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src="" alt={`${candidate.first_name} ${candidate.last_name}`} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-navy to-navy-dark text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                {/* Nom et titre */}
                <div>
                  <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-navy via-navy-dark to-purple-700 mb-2">
                    {candidate.first_name} {candidate.last_name}
                  </h1>
                  
                  {candidate.position && (
                    <div className="flex items-center gap-2 text-xl text-navy-dark">
                      <Briefcase className="w-5 h-5" />
                      <span className="font-semibold">{candidate.position}</span>
                    </div>
                  )}
                </div>

                {/* Informations de contact */}
                <div className="flex flex-wrap gap-6 text-sm">
                  {candidate.email && (
                    <div className="flex items-center gap-2 text-navy-dark">
                      <Mail className="w-4 h-4" />
                      <span>{candidate.email}</span>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center gap-2 text-navy-dark">
                      <Phone className="w-4 h-4" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  {fullAddress && (
                    <div className="flex items-center gap-2 text-navy-dark">
                      <MapPin className="w-4 h-4" />
                      <span>{fullAddress}</span>
                    </div>
                  )}
                </div>

                {/* Badges et statuts */}
                <div className="flex flex-wrap gap-3">
                  {/* Indicateur de propriété */}
                  {candidate.isOwnCandidate === false && (
                    <Badge 
                      variant="outline" 
                      className="bg-muted/30 text-muted-foreground border-border/50 px-3 py-1 text-sm"
                    >
                      <User className="w-3 h-3 mr-1" />
                      Candidat de {candidate.owner_first_name} {candidate.owner_last_name}
                    </Badge>
                  )}
                  
                  {candidate.isOwnCandidate !== false && (
                    <Badge 
                      variant="outline" 
                      className="bg-primary/10 text-primary border-primary/30 px-3 py-1 text-sm"
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      Votre candidat
                    </Badge>
                  )}
                  
                  {candidate.detailed_status && (
                    <Badge 
                      variant="secondary" 
                      className="bg-navy/10 text-navy border-navy/20 px-3 py-1 text-sm"
                    >
                      {candidate.detailed_status}
                    </Badge>
                  )}
                  
                  {candidate.years_experience !== undefined && candidate.years_experience !== null && (
                    <Badge 
                      variant="outline" 
                      className="border-gold/30 text-gold bg-gold/5 px-3 py-1 text-sm"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {candidate.years_experience} ans d'expérience
                    </Badge>
                  )}
                  
                  {candidate.availability && (
                    <Badge 
                      variant="outline" 
                      className="border-green-500/30 text-green-700 bg-green-50 px-3 py-1 text-sm"
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      {candidate.availability}
                    </Badge>
                  )}
                  
                  {candidate.company && (
                    <Badge 
                      variant="outline" 
                      className="border-blue-500/30 text-blue-700 bg-blue-50 px-3 py-1 text-sm"
                    >
                      <Building className="w-3 h-3 mr-1" />
                      {candidate.company}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Score et actions */}
            <div className="lg:w-80 space-y-6">
              <ScoreDisplay 
                candidate={candidate} 
                isLoading={isLoading}
                onRefresh={onRefresh}
              />
              
              <div className="flex gap-3">
                {/* Only show status selector for own candidates */}
                {candidate.isOwnCandidate !== false && (
                  <StatusSelector 
                    candidateId={candidate.id || ''} 
                    onStatusChange={() => {}} 
                  />
                )}
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/job-matching')}
                  className="btn-modern text-foreground border-border/60 hover:border-primary/30 hover:bg-accent/80 transition-all duration-300 group flex-1"
                >
                  <Target size={16} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span>Voir les offres</span>
                </Button>
              </div>
              
              <div className="flex gap-2 justify-center">
                <ExportProfileButton candidate={candidate} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernCandidateHeader;
