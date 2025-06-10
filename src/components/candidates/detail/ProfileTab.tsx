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
  const renderProfileSection = (title: string, icon: React.ReactNode, content: React.ReactNode, gradient = "from-navy/5 to-navy/10") => (
    <Card className="relative overflow-hidden border-navy/10 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
      <CardHeader className="relative pb-3">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy group-hover:bg-navy group-hover:text-sand transition-all duration-300">
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        {content}
      </CardContent>
    </Card>
  );

  const renderContactInfo = () => (
    <div className="space-y-4">
      {candidate.email && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sand/30 hover:bg-sand/50 transition-colors duration-200">
          <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-navy" />
          </div>
          <span className="text-navy-dark font-medium">{candidate.email}</span>
        </div>
      )}
      {candidate.phone && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sand/30 hover:bg-sand/50 transition-colors duration-200">
          <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
            <Phone className="w-4 h-4 text-navy" />
          </div>
          <span className="text-navy-dark font-medium">{candidate.phone}</span>
        </div>
      )}
      {(candidate.address || candidate.city || candidate.postal_code || candidate.country) && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sand/30 hover:bg-sand/50 transition-colors duration-200">
          <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-navy" />
          </div>
          <div className="text-navy-dark font-medium">
            {candidate.address && <span>{candidate.address}, </span>}
            {candidate.postal_code && <span>{candidate.postal_code} </span>}
            {candidate.city && <span>{candidate.city}</span>}
            {candidate.country && <span>, {candidate.country}</span>}
          </div>
        </div>
      )}
      {candidate.location && candidate.location !== `${candidate.city || ''}${candidate.country ? `, ${candidate.country}` : ''}` && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sand/30 hover:bg-sand/50 transition-colors duration-200">
          <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-navy" />
          </div>
          <span className="text-navy-dark font-medium">{candidate.location}</span>
        </div>
      )}
    </div>
  );

  const renderProfessionalInfo = () => (
    <div className="space-y-4">
      {candidate.position && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/10 hover:bg-gold/20 transition-colors duration-200">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-gold-dark" />
          </div>
          <span className="text-navy-dark font-semibold">{candidate.position}</span>
        </div>
      )}
      {candidate.company && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors duration-200">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Building className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-navy-dark font-medium">{candidate.company}</span>
        </div>
      )}
      {candidate.years_experience !== undefined && candidate.years_experience !== null && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors duration-200">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-navy-dark font-medium">
            {candidate.years_experience} {candidate.years_experience <= 1 ? 'année' : 'années'} d'expérience
          </span>
        </div>
      )}
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-4">
      {candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-wrap gap-2">
            {candidate.skills.slice(0, 8).map((skill: any, index: number) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-navy/10 to-navy/20 text-navy-dark border-navy/20 hover:from-navy/20 hover:to-navy/30 transition-all duration-200 shadow-sm"
              >
                <Star className="w-3 h-3 mr-1.5 text-gold" />
                {typeof skill === 'string' ? skill : skill.name || skill.skill || 'Compétence'}
              </Badge>
            ))}
          </div>
          {candidate.skills.length > 8 && (
            <Badge variant="outline" className="w-fit text-muted-foreground border-dashed">
              +{candidate.skills.length - 8} autres compétences
            </Badge>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">Aucune compétence renseignée</p>
        </div>
      )}
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-4">
      {candidate.availability && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
          <span className="text-sm font-semibold text-navy-dark block mb-1">Disponibilité</span>
          <span className="text-sm text-blue-700">{candidate.availability}</span>
        </div>
      )}
      {candidate.contract_type && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
          <span className="text-sm font-semibold text-navy-dark block mb-1">Type de contrat</span>
          <span className="text-sm text-green-700">{candidate.contract_type}</span>
        </div>
      )}
      {candidate.remote_preference && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
          <span className="text-sm font-semibold text-navy-dark block mb-1">Télétravail</span>
          <span className="text-sm text-purple-700">{candidate.remote_preference}</span>
        </div>
      )}
      {candidate.salary_expectations && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-gold/10 to-gold/20 border border-gold/30">
          <span className="text-sm font-semibold text-navy-dark block mb-1">Prétentions salariales</span>
          <span className="text-sm text-gold-dark font-medium">{candidate.salary_expectations}</span>
        </div>
      )}
      {candidate.mobility && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200">
          <span className="text-sm font-semibold text-navy-dark block mb-1">Mobilité</span>
          <span className="text-sm text-orange-700">{candidate.mobility}</span>
        </div>
      )}
    </div>
  );

  const renderCareerObjectives = () => (
    <div className="space-y-3">
      {candidate.career_objectives ? (
        <div className="p-4 rounded-lg bg-gradient-to-br from-navy/5 to-purple-50 border border-navy/10">
          <p className="text-navy-dark leading-relaxed whitespace-pre-wrap">{candidate.career_objectives}</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">Aucun objectif de carrière renseigné</p>
        </div>
      )}
    </div>
  );

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
        {/* Colonne gauche */}
        <div className="space-y-8">
          {/* Informations de contact */}
          {renderProfileSection(
            "Informations de contact",
            <User className="w-5 h-5" />,
            renderContactInfo(),
            "from-blue-50 to-blue-100"
          )}

          {/* Compétences */}
          {renderProfileSection(
            "Compétences",
            <Lightbulb className="w-5 h-5" />,
            renderSkills(),
            "from-purple-50 to-purple-100"
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-8">
          {/* Informations professionnelles */}
          {renderProfileSection(
            "Informations professionnelles",
            <Briefcase className="w-5 h-5" />,
            renderProfessionalInfo(),
            "from-green-50 to-green-100"
          )}

          {/* Préférences */}
          {renderProfileSection(
            "Préférences professionnelles",
            <Target className="w-5 h-5" />,
            renderPreferences(),
            "from-orange-50 to-orange-100"
          )}
        </div>
      </div>

      {/* Objectifs de carrière - Pleine largeur */}
      {candidate.career_objectives && (
        <div className="mt-8">
          {renderProfileSection(
            "Objectifs de carrière",
            <TrendingUp className="w-5 h-5" />,
            renderCareerObjectives(),
            "from-navy/10 to-purple-100"
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
