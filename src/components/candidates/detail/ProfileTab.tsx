
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Calendar, Briefcase, Mail, Phone, Building, Target, Lightbulb, TrendingUp } from 'lucide-react';
import ScoreDisplay from './ScoreDisplay';
import type { CandidateData } from '@/services/data/candidateService';

interface ProfileTabProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ candidate, isLoading, onRefresh }) => {
  const renderProfileSection = (title: string, icon: React.ReactNode, content: React.ReactNode) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );

  const renderContactInfo = () => (
    <div className="space-y-4">
      {candidate.email && (
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{candidate.email}</span>
        </div>
      )}
      {candidate.phone && (
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{candidate.phone}</span>
        </div>
      )}
      {(candidate.address || candidate.city || candidate.postal_code || candidate.country) && (
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-gray-500" />
          <div className="text-sm">
            {candidate.address && <div>{candidate.address}</div>}
            <div>
              {candidate.postal_code && `${candidate.postal_code} `}
              {candidate.city}
              {candidate.country && `, ${candidate.country}`}
            </div>
          </div>
        </div>
      )}
      {candidate.location && candidate.location !== `${candidate.city || ''}${candidate.country ? `, ${candidate.country}` : ''}` && (
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{candidate.location}</span>
        </div>
      )}
    </div>
  );

  const renderProfessionalInfo = () => (
    <div className="space-y-4">
      {candidate.position && (
        <div className="flex items-center gap-3">
          <Briefcase className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">{candidate.position}</span>
        </div>
      )}
      {candidate.company && (
        <div className="flex items-center gap-3">
          <Building className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{candidate.company}</span>
        </div>
      )}
      {candidate.years_experience !== undefined && candidate.years_experience !== null && (
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            {candidate.years_experience} {candidate.years_experience <= 1 ? 'année' : 'années'} d'expérience
          </span>
        </div>
      )}
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-3">
      {candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {candidate.skills.map((skill: any, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {typeof skill === 'string' ? skill : skill.name || skill.skill || 'Compétence'}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Aucune compétence renseignée</p>
      )}
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-3">
      {candidate.availability && (
        <div>
          <span className="text-sm font-medium text-gray-700">Disponibilité:</span>
          <span className="text-sm ml-2">{candidate.availability}</span>
        </div>
      )}
      {candidate.contract_type && (
        <div>
          <span className="text-sm font-medium text-gray-700">Type de contrat:</span>
          <span className="text-sm ml-2">{candidate.contract_type}</span>
        </div>
      )}
      {candidate.remote_preference && (
        <div>
          <span className="text-sm font-medium text-gray-700">Télétravail:</span>
          <span className="text-sm ml-2">{candidate.remote_preference}</span>
        </div>
      )}
      {candidate.salary_expectations && (
        <div>
          <span className="text-sm font-medium text-gray-700">Prétentions salariales:</span>
          <span className="text-sm ml-2">{candidate.salary_expectations}</span>
        </div>
      )}
      {candidate.mobility && (
        <div>
          <span className="text-sm font-medium text-gray-700">Mobilité:</span>
          <span className="text-sm ml-2">{candidate.mobility}</span>
        </div>
      )}
    </div>
  );

  const renderCareerObjectives = () => (
    <div className="space-y-3">
      {candidate.career_objectives ? (
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{candidate.career_objectives}</p>
      ) : (
        <p className="text-sm text-gray-500">Aucun objectif de carrière renseigné</p>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Score IA Section */}
      <ScoreDisplay 
        candidate={candidate} 
        isLoading={isLoading}
        onRefresh={onRefresh}
      />
      
      <Separator />
      
      {/* Informations personnelles */}
      {renderProfileSection(
        "Informations de contact",
        <User className="w-5 h-5" />,
        renderContactInfo()
      )}

      {/* Informations professionnelles */}
      {renderProfileSection(
        "Informations professionnelles",
        <Briefcase className="w-5 h-5" />,
        renderProfessionalInfo()
      )}

      {/* Compétences */}
      {renderProfileSection(
        "Compétences",
        <Lightbulb className="w-5 h-5" />,
        renderSkills()
      )}

      {/* Préférences */}
      {renderProfileSection(
        "Préférences professionnelles",
        <Target className="w-5 h-5" />,
        renderPreferences()
      )}

      {/* Objectifs de carrière */}
      {candidate.career_objectives && renderProfileSection(
        "Objectifs de carrière",
        <TrendingUp className="w-5 h-5" />,
        renderCareerObjectives()
      )}
    </div>
  );
};

export default ProfileTab;
