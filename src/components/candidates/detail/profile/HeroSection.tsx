
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Briefcase, Building, MapPin, Phone, Mail, Edit, Star } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { getLastCompany } from '@/utils/companyUtils';
import ScoreDisplay from '../ScoreDisplay';

interface HeroSectionProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ candidate, isLoading, onRefresh }) => {
  const lastCompany = getLastCompany(candidate);

  return (
    <Card className="border-navy/10 shadow-lg bg-gradient-to-br from-white via-sand/5 to-navy/5">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Informations principales */}
          <div className="flex-1 space-y-4">
            {/* Nom et titre */}
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-navy via-navy-dark to-purple-700">
                {candidate.first_name} {candidate.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {candidate.position && (
                  <div className="flex items-center gap-2 text-lg text-navy-dark">
                    <Briefcase className="w-5 h-5" />
                    <span className="font-semibold">{candidate.position}</span>
                  </div>
                )}
                {lastCompany !== 'Non spécifiée' && (
                  <div className="flex items-center gap-2 text-navy">
                    <Building className="w-4 h-4" />
                    <span>{lastCompany}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact rapide */}
            <div className="flex flex-wrap gap-4 text-sm">
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
              {(candidate.city || candidate.location) && (
                <div className="flex items-center gap-2 text-navy-dark">
                  <MapPin className="w-4 h-4" />
                  <span>{candidate.city || candidate.location}</span>
                </div>
              )}
            </div>

            {/* Statuts et badges */}
            <div className="flex flex-wrap gap-2">
              {candidate.detailed_status && (
                <Badge variant="secondary" className="bg-navy/10 text-navy border-navy/20">
                  {candidate.detailed_status}
                </Badge>
              )}
              {candidate.years_experience !== undefined && candidate.years_experience !== null && (
                <Badge variant="outline" className="border-gold/30 text-gold">
                  <Star className="w-3 h-3 mr-1" />
                  {candidate.years_experience} ans d'expérience
                </Badge>
              )}
              {candidate.availability && (
                <Badge variant="outline" className="border-green-500/30 text-green-700">
                  {candidate.availability}
                </Badge>
              )}
            </div>
          </div>

          {/* Score IA et actions */}
          <div className="lg:w-80 space-y-4">
            <ScoreDisplay 
              candidate={candidate} 
              isLoading={isLoading}
              onRefresh={onRefresh}
            />
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeroSection;
