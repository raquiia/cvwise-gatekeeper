
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import UploadForm from '@/components/resume/UploadForm';
import UploadSuccess from '@/components/resume/UploadSuccess';

const ResumeUpload = () => {
  const [completed, setCompleted] = useState(false);
  const [uploadedFileCount, setUploadedFileCount] = useState(0);
  const { user } = useAuth();
  
  const handleUploadComplete = () => {
    // Get the number of uploaded files from the form component
    const fileInputs = document.querySelectorAll('input[type="file"]');
    let totalFileCount = 0;
    fileInputs.forEach(input => {
      if (input.files) {
        totalFileCount += input.files.length;
      }
    });
    
    setUploadedFileCount(totalFileCount);
    setCompleted(true);
  };
  
  const handleUploadMore = () => {
    setCompleted(false);
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
        {!completed ? (
          <UploadForm 
            userId={user?.id} 
            onUploadComplete={handleUploadComplete} 
          />
        ) : (
          <UploadSuccess 
            fileCount={uploadedFileCount} 
            onUploadMore={handleUploadMore} 
          />
        )}
      </div>
    </Layout>
  );
};

export default ResumeUpload;
