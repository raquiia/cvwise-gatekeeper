
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Loader2, Sparkles, ArrowUp, Star } from 'lucide-react';
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
    <div className="relative rounded-xl overflow-hidden animate-fade-in mb-8 group">
      {/* Animated background circles */}
      <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-purple-400/20 blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-blue-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-blue-500/20 to-teal-500/30 opacity-60"></div>
      <div className="absolute inset-0 backdrop-blur-sm bg-white/40 dark:bg-navy/40"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between p-6 z-10">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-3">
            <div className="relative p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-white/10 rounded-xl animate-pulse"></div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-600/30 blur-xl group-hover:blur-xl group-hover:scale-110 transition-all duration-700 opacity-70"></div>
              <Upload size={24} className="text-white relative z-10" />
              <div className="absolute -top-1 -right-1">
                <Sparkles size={12} className="text-yellow-300 animate-pulse" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-blue-700 to-teal-600 animate-fade-in">
              CV
              <span className="ml-2 inline-flex items-center text-sm font-normal px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-700">
                <Star size={10} className="mr-1" />
                Pro
              </span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base mt-2 max-w-md leading-relaxed">
            Gérez tous les CV importés dans le système et transformez-les en profils de candidats
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Link to="/resumes/upload">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md transition-all duration-300 hover:shadow-lg border-0 relative overflow-hidden group">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600/40 to-blue-600/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
              <Upload size={18} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative">
                Importer un CV
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </span>
              <span className="absolute right-0 top-0 h-full w-9 flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-all duration-300">
                <ArrowUp size={14} className="text-white" />
              </span>
            </Button>
          </Link>
          
          {userId && <DebugUploadButton userId={userId} />}
        </div>
      </div>
      
      {/* Animated border */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500"></div>
      
      {/* Subtle shine effect on hover */}
      <div className="absolute -inset-px opacity-0 group-hover:opacity-30 bg-gradient-to-r from-transparent via-white to-transparent group-hover:animate-shine pointer-events-none"></div>
    </div>
  );
};

export default ResumesHeader;
