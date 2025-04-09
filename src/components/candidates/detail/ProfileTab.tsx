
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Mail, Calendar, FileText } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateDataService';
import { ensureArray } from '@/utils/candidateUtils';

interface ProfileTabProps {
  candidate: CandidateData;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ candidate }) => {
  const skills = ensureArray<string>(candidate.skills);
  const industries = ensureArray<any>(candidate.industries);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil du candidat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-navy flex items-center justify-center text-sand text-xl font-medium">
                  {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                </div>
              </div>
              
              <div className="flex-grow">
                <h2 className="text-xl font-semibold mb-1">
                  {candidate.first_name} {candidate.last_name}
                </h2>
                <p className="text-navy mb-4">{candidate.position || "Poste non spécifié"}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {candidate.location && (
                    <div className="flex items-center">
                      <MapPin size={18} className="text-muted-foreground mr-2" />
                      <span>{candidate.location}</span>
                    </div>
                  )}
                  
                  {candidate.phone && (
                    <div className="flex items-center">
                      <Phone size={18} className="text-muted-foreground mr-2" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  
                  {candidate.email && (
                    <div className="flex items-center">
                      <Mail size={18} className="text-muted-foreground mr-2" />
                      <span>{candidate.email}</span>
                    </div>
                  )}
                  
                  {candidate.years_experience && (
                    <div className="flex items-center">
                      <Calendar size={18} className="text-muted-foreground mr-2" />
                      <span>{candidate.years_experience} ans d'expérience</span>
                    </div>
                  )}
                  
                  {candidate.availability && (
                    <div className="flex items-center">
                      <Calendar size={18} className="text-muted-foreground mr-2" />
                      <span>Disponibilité: {candidate.availability}</span>
                    </div>
                  )}
                  
                  {candidate.contract_type && (
                    <div className="flex items-center">
                      <FileText size={18} className="text-muted-foreground mr-2" />
                      <span>Type de contrat: {candidate.contract_type}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div>
              <h3 className="font-medium text-navy-dark mb-4">Compétences</h3>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill, idx) => (
                    <div 
                      key={idx}
                      className="px-3 py-1.5 bg-navy/10 text-navy-dark text-sm rounded-full"
                    >
                      {skill}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Aucune compétence renseignée</p>
                )}
              </div>
            </div>
            
            {candidate.interests && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="font-medium text-navy-dark mb-4">Centres d'intérêt</h3>
                  <p className="text-navy-dark">{candidate.interests}</p>
                </div>
              </>
            )}
            
            {industries.length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="font-medium text-navy-dark mb-4">Industries</h3>
                  <div className="flex flex-wrap gap-2">
                    {industries.map((industry: any, idx: number) => (
                      <div 
                        key={idx}
                        className="px-3 py-1.5 bg-navy/5 text-navy-dark text-sm rounded-full"
                      >
                        {typeof industry === 'string' ? industry : industry.name || ''}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {candidate.career_objectives && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="font-medium text-navy-dark mb-4">Objectifs de carrière</h3>
                  <p className="text-navy-dark">{candidate.career_objectives}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Évaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 ${
                candidate.score && candidate.score > 85 ? 'bg-emerald-500 border-emerald-300' : 
                candidate.score && candidate.score > 65 ? 'bg-amber-500 border-amber-300' : 
                'bg-red-500 border-red-300'
              }`}>
                {candidate.score || 0}%
              </div>
              
              <p className="mt-4 text-center font-medium">
                {candidate.score && candidate.score > 85 ? 'Excellent candidat' : 
                 candidate.score && candidate.score > 65 ? 'Bon candidat' : 
                 'Candidat à potentiel'}
              </p>
              
              <Separator className="my-6" />
              
              <div className="w-full">
                <h4 className="text-sm font-medium mb-2">Statut actuel</h4>
                <div className={`p-2 rounded-md text-center ${
                  candidate.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                  candidate.status === 'inactive' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {candidate.status === 'active' ? 'Actif' :
                   candidate.status === 'inactive' ? 'Inactif' :
                   candidate.status === 'qualification' ? 'En qualification' :
                   candidate.status === 'interview' ? 'En entretien' :
                   candidate.status === 'hired' ? 'Embauché' :
                   'Statut inconnu'}
                </div>
              </div>
              
              {(candidate.remote_preference || candidate.mobility || candidate.travel_willingness) && (
                <>
                  <Separator className="my-6" />
                  <div className="w-full">
                    <h4 className="text-sm font-medium mb-2">Mobilité</h4>
                    <div className="space-y-2">
                      {candidate.remote_preference && (
                        <div className="p-2 bg-navy/5 rounded-md">
                          <span className="text-sm">Télétravail: {candidate.remote_preference}</span>
                        </div>
                      )}
                      {candidate.mobility && (
                        <div className="p-2 bg-navy/5 rounded-md">
                          <span className="text-sm">Mobilité: {candidate.mobility}</span>
                        </div>
                      )}
                      {candidate.travel_willingness && (
                        <div className="p-2 bg-navy/5 rounded-md">
                          <span className="text-sm">Déplacements: {candidate.travel_willingness}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {candidate.salary_expectations && (
                <>
                  <Separator className="my-6" />
                  <div className="w-full">
                    <h4 className="text-sm font-medium mb-2">Rémunération souhaitée</h4>
                    <div className="p-2 bg-navy/5 rounded-md text-center">
                      <span className="text-sm font-medium">{candidate.salary_expectations}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileTab;
