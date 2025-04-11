
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, Calendar, MapPin, Building, 
  GraduationCap, DollarSign, Languages, Clock, FileCode
} from 'lucide-react';
import type { JobOffer } from '@/services/data/job-offers/types';

interface JobOfferDetailsProps {
  jobOffer: JobOffer;
  formatDate: (dateString?: string) => string;
}

const JobOfferDetails = ({ jobOffer, formatDate }: JobOfferDetailsProps) => {
  return (
    <Card className="border-blue-200/30 dark:border-blue-800/30 bg-white/70 dark:bg-navy-dark/50 shadow-lg backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/30 dark:to-purple-900/20 border-b border-blue-100 dark:border-blue-800/30">
        <CardTitle className="text-lg font-semibold text-navy dark:text-sand flex items-center">
          <FileCode className="h-5 w-5 mr-2 text-navy/70 dark:text-blue-400" />
          Détails de l'offre
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {jobOffer.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-navy dark:text-sand flex items-center text-lg mb-3">
              Description
            </h3>
            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100/70 dark:border-blue-800/30">
              <p className="whitespace-pre-line text-navy-dark/80 dark:text-sand/90">{jobOffer.description}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/70 dark:bg-navy/30 p-4 rounded-lg border border-blue-100/50 dark:border-blue-800/30 shadow-sm">
            <h3 className="font-semibold text-navy dark:text-sand flex items-center mb-4">
              <Briefcase className="h-4 w-4 mr-2 text-navy/70 dark:text-blue-400" />
              Informations générales
            </h3>
            <div className="space-y-3">
              {jobOffer.contract_type && (
                <div className="flex justify-between items-center">
                  <span className="text-navy-dark/70 dark:text-sand/70">Type de contrat:</span>
                  <Badge variant="outline" className="font-medium bg-blue-50 text-navy dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700">
                    {jobOffer.contract_type}
                  </Badge>
                </div>
              )}
              
              {jobOffer.remote_preference && (
                <div className="flex justify-between items-center">
                  <span className="text-navy-dark/70 dark:text-sand/70">Télétravail:</span>
                  <Badge variant="outline" className="font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700">
                    {jobOffer.remote_preference}
                  </Badge>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-navy-dark/70 dark:text-sand/70">Expérience requise:</span>
                <span className="font-medium text-navy dark:text-sand">
                  {jobOffer.experience_years_min || 0} - {jobOffer.experience_years_max || '∞'} ans
                </span>
              </div>
              
              {jobOffer.education_level && (
                <div className="flex justify-between items-center">
                  <span className="text-navy-dark/70 dark:text-sand/70">Niveau d'éducation:</span>
                  <span className="font-medium text-navy dark:text-sand">{jobOffer.education_level}</span>
                </div>
              )}
              
              {(jobOffer.salary_min || jobOffer.salary_max) && (
                <div className="flex justify-between items-center">
                  <span className="text-navy-dark/70 dark:text-sand/70">Salaire:</span>
                  <span className="font-medium text-navy dark:text-sand">
                    {jobOffer.salary_min ? jobOffer.salary_min.toLocaleString() : '-'} - {jobOffer.salary_max ? jobOffer.salary_max.toLocaleString() : '-'} {jobOffer.salary_currency}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-navy/30 p-4 rounded-lg border border-blue-100/50 dark:border-blue-800/30 shadow-sm">
            <h3 className="font-semibold text-navy dark:text-sand flex items-center mb-4">
              <Clock className="h-4 w-4 mr-2 text-navy/70 dark:text-blue-400" />
              Détails supplémentaires
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-navy-dark/70 dark:text-sand/70">Statut:</span>
                <Badge className={`${
                  jobOffer.status === 'active' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gray-400 hover:bg-gray-500'
                }`}>
                  {jobOffer.status === 'active' ? 'Active' : jobOffer.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-navy-dark/70 dark:text-sand/70">Création:</span>
                <span className="font-medium text-navy dark:text-sand">{formatDate(jobOffer.created_at)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-navy-dark/70 dark:text-sand/70">Mise à jour:</span>
                <span className="font-medium text-navy dark:text-sand">{formatDate(jobOffer.updated_at)}</span>
              </div>
              
              {jobOffer.valid_until && (
                <div className="flex justify-between items-center">
                  <span className="text-navy-dark/70 dark:text-sand/70">Valide jusqu'au:</span>
                  <span className="font-medium text-navy dark:text-sand">{formatDate(jobOffer.valid_until)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {jobOffer.required_skills && (
          <div className="mt-6 bg-white/70 dark:bg-navy/30 p-4 rounded-lg border border-blue-100/50 dark:border-blue-800/30 shadow-sm">
            <h3 className="font-semibold text-navy dark:text-sand flex items-center mb-4">
              <FileCode className="h-4 w-4 mr-2 text-navy/70 dark:text-blue-400" />
              Compétences requises
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(jobOffer.required_skills) ? 
                jobOffer.required_skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="py-1 px-3 bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">{skill}</Badge>
                ))
                : 
                Object.values(jobOffer.required_skills).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="py-1 px-3 bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">{String(skill)}</Badge>
                ))
              }
              {(!jobOffer.required_skills || 
                (Array.isArray(jobOffer.required_skills) && jobOffer.required_skills.length === 0) || 
                (typeof jobOffer.required_skills === 'object' && Object.keys(jobOffer.required_skills).length === 0)) && (
                <span className="text-gray-500 italic dark:text-gray-400">Aucune compétence spécifiée</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobOfferDetails;
