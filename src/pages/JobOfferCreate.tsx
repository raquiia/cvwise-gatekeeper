
import React from 'react';
import Layout from '@/components/Layout';
import JobOfferForm from '@/components/job-offers/JobOfferForm';
import { Sparkles, MapPin, CheckCircle2, BrainCircuit, Zap, FileText, Lightbulb } from 'lucide-react';

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
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
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
                <div className="space-y-1 text-blue-600">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1.5 flex-shrink-0 text-green-500" />
                    <span>Types de contrat recommandés</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1.5 flex-shrink-0 text-green-500" />
                    <span>Suggestions de télétravail</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1.5 flex-shrink-0 text-green-500" />
                    <span>Années d'expérience recommandées</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="bg-blue-100/70 p-3 rounded-md flex items-center text-sm text-blue-700">
                  <Zap className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span><strong>Mode standard</strong> : Remplissez le formulaire détaillé et obtenez des suggestions intelligentes pour chaque champ.</span>
                </div>
                <div className="bg-green-100/70 p-3 rounded-md flex items-center text-sm text-green-700">
                  <FileText className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span><strong>Mode libre</strong> : Décrivez simplement le poste et laissez notre IA structurer toutes les informations.</span>
                </div>
              </div>
              
              <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded-md flex items-start text-sm">
                <Lightbulb className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0 text-yellow-500" />
                <span className="text-yellow-700">
                  <strong>Conseil</strong> : Pour de meilleurs résultats en mode libre, mentionnez le titre du poste, la localisation, 
                  les compétences requises et toute information spécifique comme le télétravail ou la fourchette de salaire.
                </span>
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
