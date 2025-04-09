
import React from 'react';
import Layout from '@/components/Layout';
import JobOfferForm from '@/components/job-offers/JobOfferForm';
import { Sparkles } from 'lucide-react';

const JobOfferCreate = () => {
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold text-navy">Créer une offre d'emploi</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-2 mt-1">
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-blue-800">Assistant IA disponible</h3>
              <p className="text-blue-600 text-sm">
                Utilisez notre assistant IA pour générer automatiquement une description de poste pertinente et des compétences clés.
                Cela permettra d'améliorer le matching avec les candidats appropriés.
              </p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <JobOfferForm />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobOfferCreate;
