
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Loader2, Sparkles } from 'lucide-react';
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
      className="ml-2 bg-white/80 hover:bg-white/90 border-navy/10 hover:border-navy/20 text-navy transition-all duration-300" 
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
    <div className="relative rounded-xl overflow-hidden animate-fade-in mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-blue-500/20 to-teal-500/30 opacity-50"></div>
      <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-navy/30"></div>
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between p-6 z-10">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-3">
            <div className="relative p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
              <div className="absolute inset-0 bg-white/10 rounded-xl animate-pulse"></div>
              <Upload size={24} className="text-white relative z-10" />
              <div className="absolute -top-1 -right-1">
                <Sparkles size={12} className="text-yellow-300 animate-pulse" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-blue-700 to-teal-600 animate-fade-in">
              CV
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base mt-2 max-w-md">
            Gérez tous les CV importés dans le système et transformez-les en profils de candidats
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Link to="/resumes/upload">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md transition-all duration-300 hover:shadow-lg border-0 group">
              <Upload size={18} className="mr-2 group-hover:animate-bounce" />
              <span className="relative">
                Importer un CV
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </span>
            </Button>
          </Link>
          
          {userId && <DebugUploadButton userId={userId} />}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500"></div>
    </div>
  );
};

export default ResumesHeader;
