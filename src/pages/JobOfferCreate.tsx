
import React from 'react';
import Layout from '@/components/Layout';
import JobOfferForm from '@/components/job-offers/JobOfferForm';
import { Sparkles } from 'lucide-react';

const JobOfferCreate = () => {
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col space-y-6">
          <h1 className="text-2xl font-bold text-navy">Créer une offre d'emploi</h1>
          
          <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-200 rounded-lg p-5 flex items-start space-x-4">
            <div className="bg-blue-100 rounded-full p-3 mt-1">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 text-lg">Assistant IA avancé à votre service</h3>
              <p className="text-blue-700 mt-1">
                Notre assistant IA vous aide à créer une offre d'emploi complète et performante pour attirer les candidats idéaux :
              </p>
              <ul className="mt-2 space-y-1 text-blue-600">
                <li className="flex items-center">
                  <span className="mr-2">•</span> 
                  <span>Descriptions de poste détaillées et professionnelles</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span> 
                  <span>Compétences techniques spécifiques au poste (hard skills)</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span> 
                  <span>Outils et technologies pertinents pour le rôle</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span> 
                  <span>Suggestions adaptées au contexte du marché actuel</span>
                </li>
              </ul>
              <p className="mt-3 text-sm text-blue-600 italic">
                Commencez par saisir le titre du poste et cliquez sur "Assistant IA" pour générer des recommandations complètes.
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
