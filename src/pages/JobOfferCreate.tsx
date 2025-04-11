
import React from 'react';
import Layout from '@/components/Layout';
import JobOfferForm from '@/components/job-offers/JobOfferForm';
import { Sparkles, MapPin, CheckCircle2, BrainCircuit, Zap, FileText, Lightbulb, ChevronsDown } from 'lucide-react';

const JobOfferCreate = () => {
  // Smooth scroll function
  const scrollToForm = () => {
    const formElement = document.getElementById('job-offer-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Layout className="py-8 bg-gradient-to-br from-purple-50/50 to-white dark:from-navy-dark/90 dark:to-navy-dark">
      <div className="container mx-auto px-4">
        <div className="flex flex-col space-y-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-navy to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">Créer une offre d'emploi</h1>
          
          <div className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-navy-dark/80 dark:to-purple-900/30 border border-blue-200/50 dark:border-blue-700/30 rounded-xl p-6 shadow-xl backdrop-blur-sm transform hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-start space-x-5">
              <div className="bg-gradient-to-br from-blue-400 to-purple-500 dark:from-blue-500 dark:to-purple-600 rounded-full p-3 mt-1 shadow-lg">
                <BrainCircuit className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-navy-dark dark:text-blue-300 text-xl">Assistant IA avancé à votre service</h3>
                <p className="text-navy-dark/80 dark:text-sand/80 mt-2 text-lg">
                  Notre assistant IA analyse votre texte et génère automatiquement une offre d'emploi complète et professionnelle :
                </p>
                
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white/60 dark:bg-navy/30 rounded-lg p-4 shadow-md border border-blue-100/50 dark:border-blue-800/30 transform hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="space-y-2.5 text-navy-dark dark:text-sand/90">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                        <span>Descriptions de poste détaillées</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                        <span>Compétences techniques (hard skills)</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                        <span>Compétences comportementales (soft skills)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/60 dark:bg-navy/30 rounded-lg p-4 shadow-md border border-blue-100/50 dark:border-blue-800/30 transform hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="space-y-2.5 text-navy-dark dark:text-sand/90">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                        <span>Outils et technologies pertinents</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                        <span>Fourchettes salariales adaptées</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                        <span>Qualifications et niveau d'études</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/60 dark:bg-navy/30 rounded-lg p-4 shadow-md border border-blue-100/50 dark:border-blue-800/30 transform hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="space-y-2.5 text-navy-dark dark:text-sand/90">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                        <span>Types de contrat recommandés</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                        <span>Suggestions de télétravail</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                        <span>Années d'expérience recommandées</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-lg shadow-md border border-blue-200/50 dark:border-blue-700/30 backdrop-blur-sm flex items-center text-sm text-navy-dark dark:text-sand/90 flex-1 min-w-[280px]">
                    <Zap className="h-5 w-5 mr-2.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <span><strong className="text-navy dark:text-blue-300">Mode standard</strong> : Remplissez le formulaire détaillé et obtenez des suggestions intelligentes pour chaque champ.</span>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-lg shadow-md border border-green-200/50 dark:border-green-700/30 backdrop-blur-sm flex items-center text-sm text-navy-dark dark:text-sand/90 flex-1 min-w-[280px]">
                    <FileText className="h-5 w-5 mr-2.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <span><strong className="text-navy dark:text-green-300">Mode libre</strong> : Décrivez simplement le poste et laissez notre IA structurer toutes les informations.</span>
                  </div>
                </div>
                
                <div className="mt-6 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 border border-amber-200/70 dark:border-amber-700/30 p-4 rounded-lg shadow-md backdrop-blur-sm flex items-start">
                  <Lightbulb className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
                  <div className="text-navy-dark dark:text-sand/90">
                    <strong className="font-medium text-navy dark:text-amber-300">Conseil</strong> : Pour de meilleurs résultats en mode libre, mentionnez le titre du poste, la localisation, 
                    les compétences requises et toute information spécifique comme le télétravail ou la fourchette de salaire.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-8">
              <button 
                onClick={scrollToForm}
                className="flex flex-col items-center text-navy dark:text-sand/80 hover:text-purple-600 dark:hover:text-purple-400 transition-colors animate-bounce"
              >
                <span className="text-sm font-medium mb-1">Commencer</span>
                <ChevronsDown className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div id="job-offer-form" className="bg-white dark:bg-navy-dark/50 p-6 sm:p-8 rounded-xl shadow-xl border border-blue-100/50 dark:border-blue-900/30 backdrop-blur-sm animate-fade-in">
            <JobOfferForm />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobOfferCreate;
