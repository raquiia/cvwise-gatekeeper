
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Loader2 } from 'lucide-react';
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
      className="ml-2" 
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
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-gradient-to-r from-navy/5 to-navy/10 p-6 rounded-xl shadow-sm animate-fade-in">
      <div className="mb-4 md:mb-0">
        <h1 className="text-3xl font-bold text-navy-dark mb-2 flex items-center">
          <span className="bg-navy/10 p-2 rounded-full mr-3">
            <Upload size={20} className="text-navy" />
          </span>
          CV
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Gérez tous les CV importés dans le système
        </p>
      </div>
      
      <div className="flex">
        <Link to="/resumes/upload">
          <Button className="bg-navy hover:bg-navy-dark text-white shadow-md transition-all duration-300 hover:shadow-lg">
            <Upload size={18} className="mr-2" />
            Importer un CV
          </Button>
        </Link>
        
        {userId && <DebugUploadButton userId={userId} />}
      </div>
    </div>
  );
};

export default ResumesHeader;
