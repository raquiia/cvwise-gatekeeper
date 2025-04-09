
import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import JobOfferForm from '@/components/job-offers/JobOfferForm';

const JobOfferEdit = () => {
  const { jobOfferId } = useParams<{ jobOfferId: string }>();
  
  if (!jobOfferId) {
    return (
      <Layout className="py-8 bg-sand/30">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 p-6 rounded-lg">
            <h1 className="text-2xl font-bold text-red-700 mb-2">Erreur</h1>
            <p className="text-red-600">Identifiant de l'offre d'emploi non fourni.</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-navy mb-6">Modifier l'offre d'emploi</h1>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <JobOfferForm jobOfferId={jobOfferId} isEditing={true} />
        </div>
      </div>
    </Layout>
  );
};

export default JobOfferEdit;
