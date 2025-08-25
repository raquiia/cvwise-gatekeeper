import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploaderProps {
  onUpload: (file: File) => Promise<void>;
  documentType: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onUpload,
  documentType
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      await onUpload(file);
      setIsOpen(false);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Télécharger - {documentType}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              {isDragActive ? (
                <p className="text-primary">Déposez le fichier ici...</p>
              ) : (
                <>
                  <p className="font-medium">Glissez et déposez votre fichier ici</p>
                  <p className="text-sm text-muted-foreground">
                    ou cliquez pour sélectionner
                  </p>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                PDF, DOC, DOCX, PNG, JPG jusqu'à 10MB
              </p>
            </div>
          </div>

          {fileRejections.length > 0 && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>
                {fileRejections[0].errors[0].code === 'file-too-large' 
                  ? 'Fichier trop volumineux (max 10MB)'
                  : 'Type de fichier non supporté'
                }
              </span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{uploadError}</span>
            </div>
          )}

          {isUploading && (
            <div className="text-center text-sm text-muted-foreground">
              Téléchargement en cours...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};