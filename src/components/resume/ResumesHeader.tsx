
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Loader2, Sparkles, ArrowUp, Zap, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { uploadResume } from '@/services/resumeService';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';

interface DebugUploadButtonProps {
  userId: string;
}

interface ResumesHeaderProps {
  userId?: string;
}

const DebugUploadButton = ({ userId }: DebugUploadButtonProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  
  const handleTestUpload = async () => {
    setUploading(true);
    try {
      // Ensure bucket exists before uploading
      await ensureResumesBucketExists();
      
      const testContent = "This is a test CV file";
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test-cv.txt', { type: 'text/plain' });
      
      toast({
        title: "Test en cours",
        description: "Tentative de téléchargement d'un fichier test...",
      });
      
      const result = await uploadResume(testFile, userId);
      
      if (result) {
        toast({
          title: "Test réussi",
          description: "Le test de téléchargement a réussi. ID: " + result.id,
        });
      } else {
        throw new Error("Le test de téléchargement a échoué");
      }
    } catch (error: any) {
      console.error('Test upload failed:', error);
      toast({
        title: "Test échoué",
        description: error.message || "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="ml-2 ai-glass hover:bg-white/90 border-indigo-200/30 hover:border-indigo-300/40 text-indigo-600 transition-all duration-300" 
      onClick={handleTestUpload}
      disabled={uploading}
    >
      {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
      Tester Upload
    </Button>
  );
};

const ResumesHeader: React.FC<ResumesHeaderProps> = ({ userId }) => {
  return (
    <div className="relative overflow-hidden ai-card mb-8 group">
      {/* Animated background elements */}
      <div className="absolute inset-0 ai-gradient-bg opacity-70"></div>
      <div className="absolute inset-0 ai-grid-bg opacity-20"></div>
      <div className="absolute ai-card-accent ai-card-accent-1 ai-pulse"></div>
      <div className="absolute ai-card-accent ai-card-accent-2 ai-pulse" style={{ animationDelay: '1.5s' }}></div>
      
      {/* Animated geometric shapes */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-indigo-300/20 rounded-full ai-rotate opacity-30"></div>
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border border-purple-300/20 rounded-full ai-rotate opacity-30" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between p-6 z-10">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-3">
            <div className="relative p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg ai-glow group-hover:scale-105 transition-transform duration-700">
              <div className="absolute inset-0 rounded-2xl bg-white/10 animate-pulse"></div>
              <Scan size={28} className="text-white relative z-10" />
              <div className="absolute -top-1 -right-1">
                <Sparkles size={12} className="text-yellow-300 animate-pulse" />
              </div>
            </div>
            <h1 className="text-3xl font-bold ai-gradient-text animate-fade-in inline-flex items-center">
              CV
              <span className="ml-2 inline-flex items-center text-sm font-normal px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700">
                <Zap size={12} className="mr-1" />
                AI Scan
              </span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base mt-2 max-w-md leading-relaxed">
            Gérez tous les CV importés dans le système et transformez-les en profils de candidats
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Link to="/resumes/upload">
            <button className="ai-button group">
              <Upload size={18} className="mr-2 inline-block group-hover:scale-110 transition-transform duration-300" />
              <span className="relative inline-block">
                Importer un CV
              </span>
              <span className="absolute right-0 top-0 h-full w-9 flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-all duration-300">
                <ArrowUp size={14} className="text-white" />
              </span>
            </button>
          </Link>
          
          {userId && <DebugUploadButton userId={userId} />}
        </div>
      </div>
      
      {/* Holographic border effect */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
    </div>
  );
};

export default ResumesHeader;
