
import React, { useState } from 'react';
import { ArrowLeft, Check, Scan, Upload, BrainCircuit, Zap } from 'lucide-react';
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
    <Layout className="py-8 bg-gradient-to-b from-white to-indigo-50/30">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header with link back */}
        <div className="mb-6">
          <Link to="/resumes" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-3 transition-colors duration-300 group">
            <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="border-b border-transparent group-hover:border-indigo-600 transition-colors duration-300">Retour aux CV</span>
          </Link>
          
          <h1 className="text-2xl font-bold ai-gradient-text mb-2">
            {uploadSuccess ? "Téléchargement réussi" : "Importer des CV"}
          </h1>
        </div>
        
        {/* Animated particles */}
        <div className="absolute top-0 left-0 w-full h-screen overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-indigo-400 opacity-20 ai-float" style={{ animationDuration: '15s' }}></div>
          <div className="absolute top-3/4 left-1/2 w-3 h-3 rounded-full bg-purple-400 opacity-10 ai-float" style={{ animationDuration: '25s', animationDelay: '2s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-pink-400 opacity-15 ai-float" style={{ animationDuration: '20s', animationDelay: '5s' }}></div>
        </div>
        
        {/* Conditional display based on state */}
        {uploadSuccess ? (
          <div className="relative overflow-hidden ai-card p-8 text-center animate-fade-in">
            <div className="absolute inset-0 ai-gradient-bg opacity-70"></div>
            <div className="absolute inset-0 ai-grid-bg opacity-20"></div>
            <div className="absolute ai-card-accent ai-card-accent-1 ai-pulse"></div>
            <div className="absolute ai-card-accent ai-card-accent-2 ai-pulse" style={{ animationDelay: '1.5s' }}></div>
            
            <div className="relative z-10">
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-lg ai-glow animate-scale">
                <Check size={32} className="text-white" />
                <div className="absolute inset-0 rounded-full animate-pulse bg-white/20"></div>
                <div className="absolute -top-2 -right-2">
                  <Zap size={14} className="text-yellow-300 animate-pulse" />
                </div>
                {/* Circles around success icon */}
                <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="absolute -inset-2 rounded-full border-2 border-white/20 animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
              </div>
              
              <h2 className="text-xl font-bold mb-3 ai-gradient-text">
                {uploadCount} CV {uploadCount > 1 ? 'téléchargés' : 'téléchargé'} avec succès
              </h2>
              
              <p className="text-muted-foreground mb-6">
                Vous pouvez maintenant consulter ou analyser vos CV
              </p>
              
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleResetUpload} className="border-indigo-200/50 hover:border-indigo-300/70 text-indigo-600 hover:bg-indigo-50/50 transition-all duration-300">
                  Télécharger d'autres CV
                </Button>
                
                <Link to="/resumes">
                  <button className="ai-button group">
                    <Scan className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    Voir tous mes CV
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden ai-card animate-fade-in">
            <div className="absolute inset-0 ai-gradient-bg opacity-50"></div>
            <div className="absolute inset-0 ai-grid-bg opacity-20"></div>
            <div className="absolute ai-card-accent ai-card-accent-1 ai-pulse"></div>
            <div className="absolute ai-card-accent ai-card-accent-2 ai-pulse" style={{ animationDelay: '1.5s' }}></div>
            
            {/* Pulsing corner accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-bl-full animate-pulse"></div>
            
            {/* Animated geometric shapes */}
            <div className="absolute top-1/2 left-1/4 w-32 h-32 border border-indigo-300/10 rounded-full ai-rotate opacity-30"></div>
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-purple-300/10 rounded-full ai-rotate opacity-30" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
            
            {/* Upload icon watermark */}
            <div className="absolute bottom-4 right-4 opacity-10">
              <BrainCircuit size={120} className="text-indigo-900" />
            </div>
            
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
