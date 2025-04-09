
import React from 'react';
import Layout from '@/components/Layout';
import JobOfferForm from '@/components/job-offers/JobOfferForm';
import { Sparkles, MapPin, CheckCircle2, BrainCircuit } from 'lucide-react';

const JobOfferCreate = () => {
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col space-y-6">
          <h1 className="text-2xl font-bold text-navy">Créer une offre d'emploi</h1>
          
          <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-200 rounded-lg p-5 flex items-start space-x-4">
            <div className="bg-blue-100 rounded-full p-3 mt-1">
              <BrainCircuit className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 text-lg">Assistant IA avancé à votre service</h3>
              <p className="text-blue-700 mt-1">
                Notre assistant IA analyse votre texte et génère automatiquement une offre d'emploi complète et professionnelle :
              </p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1 text-blue-600">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1.5 flex-shrink-0 text-green-500" />
                    <span>Descriptions de poste détaillées</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1.5 flex-shrink-0 text-green-500" />
                    <span>Compétences techniques (hard skills)</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1.5 flex-shrink-0 text-green-500" />
                    <span>Compétences comportementales (soft skills)</span>
                  </div>
                </div>
                <div className="space-y-1 text-blue-600">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1.5 flex-shrink-0 text-green-500" />
                    <span>Outils et technologies pertinents</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1.5 flex-shrink-0 text-green-500" />
                    <span>Fourchettes salariales adaptées</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1.5 flex-shrink-0 text-green-500" />
                    <span>Qualifications et niveau d'études</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-blue-100/70 p-3 rounded-md flex items-center text-sm text-blue-700">
                <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span><strong>Mode libre</strong> : Décrivez simplement le poste et laissez notre IA structurer les informations en une offre complète.</span>
              </div>
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
