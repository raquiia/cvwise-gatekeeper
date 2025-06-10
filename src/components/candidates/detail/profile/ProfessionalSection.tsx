
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <Briefcase className="w-5 h-5" />
          </div>
          Informations Professionnelles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Poste actuel - Layout compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {candidate.position && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Poste</div>
              <div className="text-navy-dark font-medium">{candidate.position}</div>
            </div>
          )}
          {candidate.company && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Entreprise</div>
              <div className="text-navy-dark font-medium">{candidate.company}</div>
            </div>
          )}
        </div>

        {/* Statut et informations clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {candidate.detailed_status && (
            <div>
              <div className="text-xs text-muted-foreground">Statut</div>
              <div className="bg-navy/10 px-2 py-1 rounded text-navy text-xs font-medium">
                {candidate.detailed_status}
              </div>
            </div>
          )}
          {candidate.years_experience !== undefined && candidate.years_experience !== null && (
            <div>
              <div className="text-xs text-muted-foreground">Expérience</div>
              <div className="text-navy-dark font-medium">{candidate.years_experience} ans</div>
            </div>
          )}
          {candidate.availability && (
            <div>
              <div className="text-xs text-muted-foreground">Disponibilité</div>
              <div className="text-navy-dark font-medium text-xs">{candidate.availability}</div>
            </div>
          )}
          {candidate.contract_type && (
            <div>
              <div className="text-xs text-muted-foreground">Contrat</div>
              <div className="text-navy-dark font-medium text-xs">{candidate.contract_type}</div>
            </div>
          )}
        </div>

        {/* Salaire et mobilité */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {candidate.salary_expectations && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Salaire souhaité</div>
              <div className="text-navy-dark font-medium">{candidate.salary_expectations}</div>
            </div>
          )}
          {candidate.mobility && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Mobilité</div>
              <div className="text-navy-dark font-medium">{candidate.mobility}</div>
            </div>
          )}
        </div>

        {/* Préférences de travail condensées */}
        {(candidate.remote_preference || candidate.travel_willingness) && (
          <div className="flex flex-wrap gap-2 text-xs">
            {candidate.remote_preference && (
              <span className="bg-muted/50 px-2 py-1 rounded">
                Télétravail: {candidate.remote_preference}
              </span>
            )}
            {candidate.travel_willingness && (
              <span className="bg-muted/50 px-2 py-1 rounded">
                Déplacements: {candidate.travel_willingness}
              </span>
            )}
          </div>
        )}

        {/* Secteurs d'activité */}
        {candidate.industries && Array.isArray(candidate.industries) && candidate.industries.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Secteurs d'activité</div>
            <div className="flex flex-wrap gap-1">
              {candidate.industries.slice(0, 3).map((industry: any, index: number) => (
                <span 
                  key={index} 
                  className="px-2 py-1 text-xs bg-navy/10 text-navy-dark border border-navy/20 rounded"
                >
                  {typeof industry === 'string' ? industry : industry.name || industry.industry || 'Secteur'}
                </span>
              ))}
              {candidate.industries.length > 3 && (
                <span className="px-2 py-1 text-xs text-muted-foreground">
                  +{candidate.industries.length - 3} autres
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfessionalSection;
