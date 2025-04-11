
import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import UploadForm from '@/components/resume/UploadForm';

const ResumeUpload = () => {
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const { user } = useAuth();
  
  const handleUploadComplete = (count: number) => {
    setUploadCount(count);
    setUploadSuccess(true);
  };
  
  const handleResetUpload = () => {
    setUploadSuccess(false);
  };
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header avec lien de retour */}
        <div className="mb-6">
          <Link to="/resumes" className="flex items-center text-navy hover:text-navy-dark mb-3 transition-colors duration-300 group">
            <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="border-b border-transparent group-hover:border-navy transition-colors duration-300">Retour aux CV</span>
          </Link>
          
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-blue-700 to-teal-600 mb-2">
            {uploadSuccess ? "Téléchargement réussi" : "Importer des CV"}
          </h1>
        </div>
        
        {/* Affichage conditionnel selon l'état */}
        {uploadSuccess ? (
          <div className="relative rounded-xl overflow-hidden p-8 text-center animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-teal-500/20 to-blue-500/20 opacity-70"></div>
            <div className="absolute inset-0 backdrop-blur-sm bg-white/70 dark:bg-navy/70"></div>
            
            <div className="relative z-10">
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Check size={32} className="text-white" />
                <div className="absolute inset-0 rounded-full animate-pulse bg-white/20"></div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles size={14} className="text-yellow-300 animate-pulse" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold mb-3 text-navy-dark">
                {uploadCount} CV {uploadCount > 1 ? 'téléchargés' : 'téléchargé'} avec succès
              </h2>
              
              <p className="text-muted-foreground mb-6">
                Vous pouvez maintenant consulter ou analyser vos CV
              </p>
              
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleResetUpload} className="border-navy/20 hover:border-navy/40 text-navy hover:bg-navy/5 transition-all duration-300">
                  Télécharger d'autres CV
                </Button>
                
                <Link to="/resumes">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md transition-all duration-300 hover:shadow-lg border-0">
                    Voir tous mes CV
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 opacity-50"></div>
            <div className="absolute inset-0 backdrop-blur-sm bg-white/50"></div>
            <div className="relative z-10">
              <UploadForm 
                userId={user?.id} 
                onUploadComplete={handleUploadComplete} 
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResumeUpload;
