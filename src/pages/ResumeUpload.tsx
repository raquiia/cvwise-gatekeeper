
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
  const [bucketInitialized, setBucketInitialized] = useState(false);
  const [initializingBucket, setInitializingBucket] = useState(true);
  const [bucketError, setBucketError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Ensure the bucket exists when the component mounts
    const initializeBucket = async () => {
      if (!user) return;
      
      setInitializingBucket(true);
      setBucketError(null);
      
      try {
        console.log('Initializing bucket for user:', user.id);
        await ensureResumesBucketExists();
        console.log('Bucket initialized successfully');
        setBucketInitialized(true);
        setInitializingBucket(false);
      } catch (error: any) {
        console.error('Failed to initialize bucket:', error);
        setBucketError(error.message || 'Failed to initialize storage');
        setInitializingBucket(false);
        toast({
          title: "Erreur de préparation",
          description: "Un problème est survenu lors de la préparation du stockage. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    };
    
    initializeBucket();
  }, [user, toast]);
  
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
    
    if (bucketError) {
      return (
        <div className="glass rounded-xl p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-navy-dark mb-2">
            Erreur de préparation
          </h2>
          <p className="text-muted-foreground mb-4">
            Impossible de préparer l'espace de stockage pour vos CV
          </p>
          <button 
            className="button-primary"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
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
