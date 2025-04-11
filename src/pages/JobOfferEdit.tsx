
import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import JobOfferForm from '@/components/job-offers/JobOfferForm';
import { FileEdit } from 'lucide-react';

const JobOfferEdit = () => {
  const { jobOfferId } = useParams<{ jobOfferId: string }>();
  
  if (!jobOfferId) {
    return (
      <Layout className="py-8 bg-gradient-to-br from-purple-50/50 to-white dark:from-navy-dark/90 dark:to-navy-dark">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-xl shadow-lg border border-red-200 dark:border-red-800/50 backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-3">Erreur</h1>
            <p className="text-red-600 dark:text-red-300">Identifiant de l'offre d'emploi non fourni.</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout className="py-8 bg-gradient-to-br from-purple-50/50 to-white dark:from-navy-dark/90 dark:to-navy-dark">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-br from-blue-400 to-purple-500 dark:from-blue-500 dark:to-purple-600 rounded-full p-2.5 mr-3 shadow-lg">
            <FileEdit className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-navy to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
            Modifier l'offre d'emploi
          </h1>
        </div>
        
        <div className="bg-white dark:bg-navy-dark/50 p-6 sm:p-8 rounded-xl shadow-xl border border-blue-100/50 dark:border-blue-900/30 backdrop-blur-sm animate-fade-in">
          <JobOfferForm jobOfferId={jobOfferId} isEditing={true} />
        </div>
      </div>
    </Layout>
  );
};

export default JobOfferEdit;
