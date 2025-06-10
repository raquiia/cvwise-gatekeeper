
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Calendar, Briefcase, Mail, Phone, Building, Target, Lightbulb, TrendingUp, Star } from 'lucide-react';
import ScoreDisplay from './ScoreDisplay';
import type { CandidateData } from '@/services/data/candidateService';

interface ProfileTabProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ candidate, isLoading, onRefresh }) => {
  const renderInfoCard = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );

  const renderInfoField = (label: string, value: string | number | undefined | null, icon?: React.ReactNode) => {
    if (!value) return null;
    
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {label}
        </div>
        <div className="text-navy-dark font-medium">{value}</div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-sand/20 via-white to-navy/5 min-h-full">
      {/* Score IA Section */}
      <div className="relative">
        <ScoreDisplay 
          candidate={candidate} 
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      </div>
      
      <Separator className="bg-gradient-to-r from-transparent via-navy/20 to-transparent" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informations personnelles */}
        <div className="space-y-6">
          {renderInfoCard(
            "Informations personnelles",
            <User className="w-5 h-5" />,
            <div className="grid grid-cols-1 gap-4">
              {renderInfoField("Prénom", candidate.first_name)}
              {renderInfoField("Nom", candidate.last_name)}
              {renderInfoField("Email", candidate.email, <Mail className="w-4 h-4" />)}
              {renderInfoField("Téléphone", candidate.phone, <Phone className="w-4 h-4" />)}
              
              {/* Adresse structurée */}
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse
                </div>
                <div className="space-y-1">
                  {candidate.address && (
                    <div className="text-navy-dark font-medium">{candidate.address}</div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    {candidate.postal_code && (
                      <span className="bg-navy/10 px-2 py-1 rounded text-navy font-medium">
                        {candidate.postal_code}
                      </span>
                    )}
                    {candidate.city && (
                      <span className="text-navy-dark font-medium">{candidate.city}</span>
                    )}
                  </div>
                  {candidate.country && (
                    <div className="text-sm text-muted-foreground font-medium">{candidate.country}</div>
                  )}
                </div>
              </div>
              
              {candidate.location && candidate.location !== `${candidate.city || ''}${candidate.country ? `, ${candidate.country}` : ''}` && 
                renderInfoField("Localisation complète (héritée)", candidate.location, <MapPin className="w-4 h-4" />)
              }
            </div>
          )}
        </div>

        {/* Informations professionnelles */}
        <div className="space-y-6">
          {renderInfoCard(
            "Informations professionnelles",
            <Briefcase className="w-5 h-5" />,
            <div className="grid grid-cols-1 gap-4">
              {renderInfoField("Poste actuel", candidate.position, <Briefcase className="w-4 h-4" />)}
              {renderInfoField("Entreprise", candidate.company, <Building className="w-4 h-4" />)}
              {candidate.years_experience !== undefined && candidate.years_experience !== null && 
                renderInfoField("Années d'expérience", candidate.years_experience, <Calendar className="w-4 h-4" />)
              }
              {renderInfoField("Salaire souhaité", candidate.salary_expectations)}
              {renderInfoField("Disponibilité", candidate.availability)}
              {renderInfoField("Type de contrat", candidate.contract_type)}
              {renderInfoField("Télétravail", candidate.remote_preference)}
              {renderInfoField("Mobilité", candidate.mobility)}
            </div>
          )}
        </div>
      </div>

      {/* Compétences */}
      {candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0 && (
        <div className="mt-8">
          {renderInfoCard(
            "Compétences",
            <Lightbulb className="w-5 h-5" />,
            <div className="flex flex-wrap gap-2">
              {candidate.skills.slice(0, 12).map((skill: any, index: number) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-navy/10 to-navy/20 text-navy-dark border-navy/20"
                >
                  <Star className="w-3 h-3 mr-1.5 text-gold" />
                  {typeof skill === 'string' ? skill : skill.name || skill.skill || 'Compétence'}
                </Badge>
              ))}
              {candidate.skills.length > 12 && (
                <Badge variant="outline" className="border-dashed">
                  +{candidate.skills.length - 12} autres
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Objectifs de carrière */}
      {candidate.career_objectives && (
        <div className="mt-8">
          {renderInfoCard(
            "Objectifs de carrière",
            <TrendingUp className="w-5 h-5" />,
            <p className="text-navy-dark leading-relaxed whitespace-pre-wrap">{candidate.career_objectives}</p>
          )}
        </div>
      )}

      {/* Notes personnelles */}
      <div className="mt-8">
        {renderInfoCard(
          "Notes personnelles",
          <User className="w-5 h-5" />,
          <div className="text-muted-foreground italic">
            Ajoutez vos notes personnelles sur ce candidat...
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;
