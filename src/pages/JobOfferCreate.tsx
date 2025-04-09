
import React from 'react';
import Layout from '@/components/Layout';
import JobOfferForm from '@/components/job-offers/JobOfferForm';

const JobOfferCreate = () => {
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-navy mb-6">Créer une offre d'emploi</h1>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <JobOfferForm />
        </div>
      </div>
    </Layout>
  );
};

export default JobOfferCreate;
