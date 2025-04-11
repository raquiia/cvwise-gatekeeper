
import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles, Upload } from 'lucide-react';
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
        
        {/* Animated particles */}
        <div className="absolute top-0 left-0 w-full h-screen overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-purple-400 opacity-20 animate-float" style={{ animationDuration: '15s' }}></div>
          <div className="absolute top-3/4 left-1/2 w-3 h-3 rounded-full bg-blue-400 opacity-10 animate-float" style={{ animationDuration: '25s', animationDelay: '2s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-teal-400 opacity-15 animate-float" style={{ animationDuration: '20s', animationDelay: '5s' }}></div>
        </div>
        
        {/* Affichage conditionnel selon l'état */}
        {uploadSuccess ? (
          <div className="relative rounded-xl overflow-hidden p-8 text-center animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-teal-500/20 to-blue-500/20 opacity-70"></div>
            <div className="absolute inset-0 backdrop-blur-sm bg-white/70 dark:bg-navy/70"></div>
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
            
            <div className="relative z-10">
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-lg animate-scale">
                <Check size={32} className="text-white" />
                <div className="absolute inset-0 rounded-full animate-pulse bg-white/20"></div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles size={14} className="text-yellow-300 animate-pulse" />
                </div>
                {/* Circles around success icon */}
                <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="absolute -inset-2 rounded-full border-2 border-white/20 animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
              </div>
              
              <h2 className="text-xl font-bold mb-3 text-navy-dark bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-600">
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
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md transition-all duration-300 hover:shadow-lg border-0 relative overflow-hidden group">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
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
            
            {/* Pulsing corner accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-bl-full animate-pulse"></div>
            
            {/* Upload icon watermark */}
            <div className="absolute bottom-4 right-4 opacity-10">
              <Upload size={120} className="text-purple-900" />
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
