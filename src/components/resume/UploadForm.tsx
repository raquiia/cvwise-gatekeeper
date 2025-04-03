
import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import UploadDropZone from './UploadDropZone';
import FileList from './FileList';
import { uploadResume } from '@/services/resumeService';

interface UploadFormProps {
  userId: string | undefined;
  onUploadComplete: (fileCount: number) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ userId, onUploadComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();
  
  const handleFileSelect = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setUploadProgress(prev => [...prev, ...newFiles.map(() => 0)]);
    setErrors(prev => [...prev, ...newFiles.map(() => '')]);
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "Aucun fichier",
        description: "Veuillez sélectionner au moins un fichier à télécharger",
        variant: "destructive",
      });
      return;
    }
    
    if (!userId) {
      toast({
        title: "Non connecté",
        description: "Vous devez être connecté pour télécharger des fichiers",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    let successCount = 0;
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setErrors(prev => {
          const newErrors = [...prev];
          newErrors[i] = '';
          return newErrors;
        });
        
        // Simuler la progression
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = [...prev];
            if (newProgress[i] < 90) {
              newProgress[i] += Math.random() * 15;
              if (newProgress[i] > 90) newProgress[i] = 90;
            }
            return newProgress;
          });
        }, 300);
        
        try {
          const result = await uploadResume(file, userId);
          
          clearInterval(progressInterval);
          
          if (result) {
            setUploadProgress(prev => {
              const newProgress = [...prev];
              newProgress[i] = 100;
              return newProgress;
            });
            successCount++;
          } else {
            setUploadProgress(prev => {
              const newProgress = [...prev];
              newProgress[i] = -1; // Erreur
              return newProgress;
            });
            setErrors(prev => {
              const newErrors = [...prev];
              newErrors[i] = "Échec du téléchargement";
              return newErrors;
            });
          }
        } catch (error: any) {
          clearInterval(progressInterval);
          
          setUploadProgress(prev => {
            const newProgress = [...prev];
            newProgress[i] = -1; // Erreur
            return newProgress;
          });
          
          setErrors(prev => {
            const newErrors = [...prev];
            newErrors[i] = error.message || "Erreur inconnue";
            return newErrors;
          });
        }
      }
      
      if (successCount > 0) {
        toast({
          title: "Téléchargement réussi",
          description: `${successCount} CV sur ${files.length} ont été téléchargés avec succès`,
        });
        
        if (successCount === files.length) {
          setTimeout(() => {
            onUploadComplete(successCount);
          }, 1000);
        }
      } else {
        toast({
          title: "Échec du téléchargement",
          description: "Aucun CV n'a pu être téléchargé",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({
        title: "Échec du téléchargement",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleReset = () => {
    setFiles([]);
    setUploadProgress([]);
    setErrors([]);
  };
  
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border/20">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-sand mr-3">
            <Upload size={18} />
          </div>
          <h2 className="text-lg font-semibold text-navy-dark">Téléchargement de CV</h2>
        </div>
      </div>
      
      <div className="p-6">
        <UploadDropZone 
          onFileSelect={handleFileSelect}
          uploading={uploading}
          dragging={dragging}
          setDragging={setDragging}
        />
        
        <FileList 
          files={files}
          uploadProgress={uploadProgress}
          errors={errors}
          removeFile={removeFile}
          uploading={uploading}
        />
        
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={uploading}
            onClick={handleReset}
          >
            Réinitialiser
          </Button>
          
          <Button
            className="button-primary"
            disabled={files.length === 0 || uploading}
            onClick={handleUpload}
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Téléchargement en cours...
              </>
            ) : (
              <>
                <Upload size={18} className="mr-2" />
                Télécharger ({files.length})
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadForm;
