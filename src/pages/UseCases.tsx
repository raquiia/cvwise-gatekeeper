
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UseCasesSlider from '@/components/usecases/UseCasesSlider';

const UseCases = () => {
  return (
    <Layout className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-navy-dark/50 dark:to-navy-dark min-h-screen">
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
          Cas d'Utilisation de l'IA pour notre Entreprise
        </h1>
        
        <UseCasesSlider />
      </div>
    </Layout>
  );
};

export default UseCases;
