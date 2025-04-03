
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import UploadForm from '@/components/resume/UploadForm';
import UploadSuccess from '@/components/resume/UploadSuccess';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';
import { useToast } from '@/hooks/use-toast';

const ResumeUpload = () => {
  const [completed, setCompleted] = useState(false);
  const [uploadedFileCount, setUploadedFileCount] = useState(0);
  const [initializingBucket, setInitializingBucket] = useState(false); // Démarrer à false pour éviter le chargement inutile
  const [bucketError, setBucketError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialisation silencieuse du bucket (ne bloque pas l'interface)
    const initializeBucket = async () => {
      if (!user) return;
      
      try {
        // Tenter d'initialiser le bucket sans bloquer l'interface
        await ensureResumesBucketExists();
      } catch (error: any) {
        // Ne pas afficher d'erreur à l'utilisateur, simplement loguer
        console.warn('Bucket initialization issue:', error);
      }
    };
    
    initializeBucket();
  }, [user]);
  
  const handleUploadComplete = (count: number) => {
    setUploadedFileCount(count);
    setCompleted(true);
  };
  
  const handleUploadMore = () => {
    setCompleted(false);
  };
  
  const renderContent = () => {
    if (initializingBucket) {
      return (
        <div className="glass rounded-xl p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-navy/10 flex items-center justify-center mb-4 animate-pulse">
            <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-lg font-medium text-navy-dark mb-2">
            Préparation du stockage...
          </h2>
          <p className="text-muted-foreground">
            Veuillez patienter pendant que nous préparons l'espace de stockage pour vos CV
          </p>
        </div>
      );
    }
    
    if (!completed) {
      return (
        <UploadForm 
          userId={user?.id} 
          onUploadComplete={handleUploadComplete} 
        />
      );
    }
    
    return (
      <UploadSuccess 
        fileCount={uploadedFileCount} 
        onUploadMore={handleUploadMore} 
      />
    );
  };
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/resumes" className="flex items-center text-navy hover:text-navy-dark mb-4">
            <ArrowLeft size={16} className="mr-1" />
            Retour aux CV
          </Link>
          
          <h1 className="text-2xl font-bold text-navy-dark mb-2">Importer des CV</h1>
          <p className="text-muted-foreground">
            Téléchargez des CV pour les analyser automatiquement avec l'IA
          </p>
        </div>
        
        {/* Upload Section */}
        {renderContent()}
      </div>
    </Layout>
  );
};

export default ResumeUpload;
