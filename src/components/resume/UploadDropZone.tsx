
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
  
  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
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
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    const newFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || 
             file.type === 'application/msword' || 
             file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    
    if (newFiles.length === 0) {
      toast({
        title: "Format non supporté",
        description: "Veuillez télécharger des fichiers PDF ou Word (.docx)",
        variant: "destructive",
      });
      return;
    }
    
    onFileSelect(newFiles);
  };
  
  // Handle file selection via button
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        file => file.type === 'application/pdf' || 
               file.type === 'application/msword' || 
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      
      if (newFiles.length === 0) {
        toast({
          title: "Format non supporté",
          description: "Veuillez télécharger des fichiers PDF ou Word (.docx)",
          variant: "destructive",
        });
        return;
      }
      
      onFileSelect(newFiles);
    }
  };
  
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
        dragging 
          ? 'border-navy bg-navy/5' 
          : 'border-border hover:border-navy/50 hover:bg-navy/5'
      }`}
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
        accept=".pdf,.doc,.docx"
        multiple
      />
      
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="button-primary"
        disabled={uploading}
      >
        <Upload size={18} className="mr-2" />
        Parcourir
      </Button>
      
      <p className="text-xs text-muted-foreground mt-4">
        Formats acceptés: PDF, DOC, DOCX. Taille maximale: 5MB par fichier.
      </p>
    </div>
  );
};

export default UploadDropZone;
