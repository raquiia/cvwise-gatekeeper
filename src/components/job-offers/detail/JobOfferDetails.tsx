
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { JobOffer } from '@/services/data/job-offers/types';

interface JobOfferDetailsProps {
  jobOffer: JobOffer;
  formatDate: (dateString?: string) => string;
}

const JobOfferDetails = ({ jobOffer, formatDate }: JobOfferDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Détails de l'offre</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {jobOffer.description && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="whitespace-pre-line text-gray-700">{jobOffer.description}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Informations générales</h3>
            <div className="space-y-2">
              {jobOffer.contract_type && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Type de contrat:</span>
                  <span className="font-medium">{jobOffer.contract_type}</span>
                </div>
              )}
              
              {jobOffer.remote_preference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Télétravail:</span>
                  <span className="font-medium">{jobOffer.remote_preference}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Expérience requise:</span>
                <span className="font-medium">
                  {jobOffer.experience_years_min || 0} - {jobOffer.experience_years_max || '∞'} ans
                </span>
              </div>
              
              {jobOffer.education_level && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Niveau d'éducation:</span>
                  <span className="font-medium">{jobOffer.education_level}</span>
                </div>
              )}
              
              {(jobOffer.salary_min || jobOffer.salary_max) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Salaire:</span>
                  <span className="font-medium">
                    {jobOffer.salary_min ? jobOffer.salary_min.toLocaleString() : '-'} - {jobOffer.salary_max ? jobOffer.salary_max.toLocaleString() : '-'} {jobOffer.salary_currency}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Détails supplémentaires</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <Badge variant={jobOffer.status === 'active' ? 'default' : 'secondary'}>
                  {jobOffer.status === 'active' ? 'Active' : jobOffer.status}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Création:</span>
                <span className="font-medium">{formatDate(jobOffer.created_at)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Mise à jour:</span>
                <span className="font-medium">{formatDate(jobOffer.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {jobOffer.required_skills && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Compétences requises</h3>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(jobOffer.required_skills) ? 
                jobOffer.required_skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))
                : 
                Object.values(jobOffer.required_skills).map((skill, index) => (
                  <Badge key={index} variant="secondary">{String(skill)}</Badge>
                ))
              }
              {(!jobOffer.required_skills || 
                (Array.isArray(jobOffer.required_skills) && jobOffer.required_skills.length === 0) || 
                (typeof jobOffer.required_skills === 'object' && Object.keys(jobOffer.required_skills).length === 0)) && (
                <span className="text-gray-500 italic">Aucune compétence spécifiée</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobOfferDetails;
