
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CandidateEditForm from '@/components/candidates/edit/CandidateEditForm';

const CandidateEdit = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();

  if (!candidateId) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-700">Identifiant de candidat manquant</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => navigate('/candidates')}
            >
              Retour à la liste des candidats
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSave = () => {
    navigate(`/candidates/${candidateId}`);
  };

  const handleCancel = () => {
    navigate(`/candidates/${candidateId}`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground mb-4 hover:bg-navy/5 transition-all duration-300 group"
            onClick={() => navigate(`/candidates/${candidateId}`)}
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="border-b border-transparent group-hover:border-muted-foreground transition-colors duration-300">
              Retour au profil
            </span>
          </Button>
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between">
            <div className="relative animate-fade-in">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700">
                Modifier le profil candidat
              </h1>
              <div className="absolute -bottom-1 left-0 w-1/4 h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
            </div>
          </div>
        </div>

        <CandidateEditForm 
          candidateId={candidateId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </Layout>
  );
};

export default CandidateEdit;
