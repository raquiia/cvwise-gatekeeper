
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Calendar, Phone, Mail, User, Building2 } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray, safeString } from '@/utils/candidateUtils';
import ScoreDisplay from './ScoreDisplay';

interface ProfileTabProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ candidate, isLoading, onRefresh }) => {
  console.log("ProfileTab - candidate data:", candidate);
  
  const skills = ensureStringArray(candidate.skills);
  
  // Utiliser la fonction safeString pour extraire les valeurs
  const firstName = safeString(candidate.first_name);
  const lastName = safeString(candidate.last_name);
  const email = safeString(candidate.email);
  const phone = safeString(candidate.phone);
  const position = safeString(candidate.position);
  const location = safeString(candidate.location);
  const company = safeString(candidate.company);
  const availability = safeString(candidate.availability);
  const careerObjectives = safeString(candidate.career_objectives);
  const interests = safeString(candidate.interests);
  
  console.log("ProfileTab - extracted data:", {
    firstName, lastName, email, phone, position, location, company
  });

  return (
    <div className="space-y-6 p-6">
      {/* En-tête avec informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-2xl font-bold text-navy-dark">
                {firstName} {lastName}
              </p>
              {position && (
                <p className="text-lg text-purple-600 font-medium mt-1">
                  {position}
                </p>
              )}
            </div>
            
            {/* Contact */}
            <div className="space-y-2">
              {email && (
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-navy-dark">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-navy-dark">{phone}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-navy-dark">{location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informations professionnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-purple-600" />
              Profil professionnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company && (
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-navy-dark">{company}</span>
              </div>
            )}
            
            {candidate.years_experience !== undefined && candidate.years_experience !== null && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-navy-dark">
                  {candidate.years_experience} années d'expérience
                </span>
              </div>
            )}
            
            {availability && (
              <div>
                <p className="text-sm font-medium text-gray-700">Disponibilité</p>
                <p className="text-navy-dark">{availability}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score et évaluation */}
        <Card>
          <CardHeader>
            <CardTitle>Score et évaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreDisplay 
              candidate={candidate} 
              isLoading={isLoading} 
              onRefresh={onRefresh} 
            />
          </CardContent>
        </Card>
      </div>

      {/* Compétences */}
      {skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compétences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objectifs de carrière */}
      {careerObjectives && (
        <Card>
          <CardHeader>
            <CardTitle>Objectifs de carrière</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-navy-dark whitespace-pre-wrap">{careerObjectives}</p>
          </CardContent>
        </Card>
      )}

      {/* Centres d'intérêt */}
      {interests && (
        <Card>
          <CardHeader>
            <CardTitle>Centres d'intérêt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-navy-dark whitespace-pre-wrap">{interests}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileTab;
