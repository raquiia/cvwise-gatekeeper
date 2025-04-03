
import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
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
          <Link to="/resumes" className="flex items-center text-navy hover:text-navy-dark mb-3">
            <ArrowLeft size={16} className="mr-1" />
            Retour aux CV
          </Link>
          
          <h1 className="text-2xl font-bold text-navy-dark mb-2">
            {uploadSuccess ? "Téléchargement réussi" : "Importer des CV"}
          </h1>
        </div>
        
        {/* Affichage conditionnel selon l'état */}
        {uploadSuccess ? (
          <div className="glass rounded-xl p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check size={32} className="text-green-600" />
            </div>
            
            <h2 className="text-xl font-bold mb-3">
              {uploadCount} CV {uploadCount > 1 ? 'téléchargés' : 'téléchargé'} avec succès
            </h2>
            
            <p className="text-muted-foreground mb-6">
              Vous pouvez maintenant consulter ou analyser vos CV
            </p>
            
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleResetUpload}>
                Télécharger d'autres CV
              </Button>
              
              <Link to="/resumes">
                <Button className="bg-navy text-white hover:bg-navy-dark">
                  Voir tous mes CV
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <UploadForm 
            userId={user?.id} 
            onUploadComplete={handleUploadComplete} 
          />
        )}
      </div>
    </Layout>
  );
};

export default ResumeUpload;
