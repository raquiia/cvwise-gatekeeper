
import React, { useRef } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface UploadDropZoneProps {
  onFileSelect: (files: File[]) => void;
  uploading: boolean;
  dragging: boolean;
  setDragging: (dragging: boolean) => void;
}

const UploadDropZone: React.FC<UploadDropZoneProps> = ({
  onFileSelect,
  uploading,
  dragging,
  setDragging,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const validateFiles = (files: File[]): File[] => {
    const validTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Format non supporté",
          description: `Le fichier "${file.name}" n'est pas dans un format supporté.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "Fichier trop volumineux",
          description: `Le fichier "${file.name}" dépasse la limite de 10MB.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });
    
    return validFiles;
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (uploading) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(droppedFiles);
    
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !uploading) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = validateFiles(selectedFiles);
      
      if (validFiles.length > 0) {
        onFileSelect(validFiles);
      }
      
      e.target.value = '';
    }
  };
  
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
        dragging 
          ? 'border-navy bg-navy/5' 
          : 'border-border hover:border-navy/50 hover:bg-navy/5'
      } ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="w-16 h-16 mx-auto rounded-full bg-navy/10 flex items-center justify-center mb-4">
        <FileText size={28} className="text-navy" />
      </div>
      
      <h3 className="text-lg font-medium text-navy-dark mb-2">
        Glissez-déposez vos fichiers ici
      </h3>
      
      <p className="text-muted-foreground mb-4">
        Ou cliquez sur le bouton ci-dessous pour parcourir vos fichiers
      </p>
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt"
        multiple
        disabled={uploading}
      />
      
      <Button
        onClick={() => {
          if (!uploading && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        className="button-primary"
        disabled={uploading}
      >
        <Upload size={18} className="mr-2" />
        Parcourir
      </Button>
      
      <p className="text-xs text-muted-foreground mt-4">
        Formats acceptés: PDF, DOC, DOCX, TXT. Taille maximale: 10MB par fichier.
      </p>
    </div>
  );
};

export default UploadDropZone;
