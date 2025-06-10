
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Building, Calendar, DollarSign, Clock, MapPin, Car } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';

interface ProfessionalSectionProps {
  candidate: CandidateData;
}

const ProfessionalSection: React.FC<ProfessionalSectionProps> = ({ candidate }) => {
  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <Briefcase className="w-5 h-5" />
          </div>
          Informations Professionnelles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Poste actuel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidate.position && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Poste actuel
              </div>
              <div className="text-navy-dark font-medium">{candidate.position}</div>
            </div>
          )}
          {candidate.company && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building className="w-4 h-4" />
                Entreprise
              </div>
              <div className="text-navy-dark font-medium">{candidate.company}</div>
            </div>
          )}
        </div>

        {/* Expérience et salaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidate.years_experience !== undefined && candidate.years_experience !== null && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Années d'expérience
              </div>
              <div className="text-navy-dark font-medium">{candidate.years_experience} ans</div>
            </div>
          )}
          {candidate.salary_expectations && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Salaire souhaité
              </div>
              <div className="text-navy-dark font-medium">{candidate.salary_expectations}</div>
            </div>
          )}
        </div>

        {/* Préférences de travail */}
        <div className="space-y-4">
          <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2">Préférences de travail</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidate.availability && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Disponibilité
                </div>
                <div className="text-navy-dark font-medium">{candidate.availability}</div>
              </div>
            )}
            {candidate.contract_type && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Type de contrat</div>
                <div className="text-navy-dark font-medium">{candidate.contract_type}</div>
              </div>
            )}
            {candidate.remote_preference && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Télétravail</div>
                <div className="text-navy-dark font-medium">{candidate.remote_preference}</div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidate.mobility && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Mobilité
                </div>
                <div className="text-navy-dark font-medium">{candidate.mobility}</div>
              </div>
            )}
            {candidate.travel_willingness && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Volonté de déplacement
                </div>
                <div className="text-navy-dark font-medium">{candidate.travel_willingness}</div>
              </div>
            )}
          </div>
        </div>

        {/* Secteurs d'activité */}
        {candidate.industries && Array.isArray(candidate.industries) && candidate.industries.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2">Secteurs d'activité</h4>
            <div className="flex flex-wrap gap-2">
              {candidate.industries.map((industry: any, index: number) => (
                <span 
                  key={index} 
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-navy/10 to-navy/20 text-navy-dark border border-navy/20 rounded-full"
                >
                  {typeof industry === 'string' ? industry : industry.name || industry.industry || 'Secteur'}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfessionalSection;
