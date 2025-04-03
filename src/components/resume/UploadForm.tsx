import React, { useState, useRef } from 'react';
import { Upload, Loader2, File, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { uploadResume } from '@/services/resumeService';

interface UploadFormProps {
  userId: string | undefined;
  onUploadComplete: (fileCount: number) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ userId, onUploadComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<Record<number, 'idle' | 'uploading' | 'success' | 'error'>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const currentFilesLength = files.length;
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // Initialize status for new files
      const newStatus: Record<number, 'idle' | 'uploading' | 'success' | 'error'> = {};
      newFiles.forEach((_, index) => {
        newStatus[currentFilesLength + index] = 'idle';
      });
      
      setUploadStatus(prevStatus => ({...prevStatus, ...newStatus}));
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (uploading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(
        file => file.type === 'application/pdf' || 
               file.type === 'application/msword' || 
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               file.type === 'text/plain'
      );
      
      if (newFiles.length === 0) {
        toast({
          title: "Format non supporté",
          description: "Veuillez déposer des fichiers au format PDF, DOC, DOCX ou TXT.",
          variant: "destructive"
        });
        return;
      }
      
      setFiles(prev => [...prev, ...newFiles]);
      
      // Initialize status for new files
      const newStatus: Record<number, 'idle' | 'uploading' | 'success' | 'error'> = {};
      newFiles.forEach((_, index) => {
        newStatus[files.length + index] = 'idle';
      });
      
      setUploadStatus(prev => ({...prev, ...newStatus}));
    }
  };
  
  const clearFiles = () => {
    setFiles([]);
    setUploadStatus({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    
    // Update status object
    const newStatus = {...uploadStatus};
    delete newStatus[index];
    
    // Reindex remaining files
    const updatedStatus: Record<number, 'idle' | 'uploading' | 'success' | 'error'> = {};
    Object.entries(newStatus).forEach(([key, value]) => {
      const keyNum = parseInt(key);
      if (keyNum > index) {
        updatedStatus[keyNum - 1] = value;
      } else {
        updatedStatus[keyNum] = value;
      }
    });
    
    setUploadStatus(updatedStatus);
  };
  
  const handleUpload = async () => {
    if (!files.length) {
      toast({
        title: "Aucun fichier",
        description: "Veuillez sélectionner au moins un fichier à télécharger",
        variant: "destructive"
      });
      return;
    }
    
    if (!userId) {
      toast({
        title: "Non connecté",
        description: "Vous devez être connecté pour télécharger des fichiers",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      try {
        setUploadStatus(prevStatus => ({...prevStatus, [i]: 'uploading'}));
        
        console.log(`Uploading file ${i+1}/${files.length}: ${files[i].name}`);
        const result = await uploadResume(files[i], userId);
        
        if (result) {
          console.log(`Upload succeeded for ${files[i].name}`);
          setUploadStatus(prevStatus => ({...prevStatus, [i]: 'success'}));
          successCount++;
        } else {
          console.error(`Upload failed for ${files[i].name}`);
          setUploadStatus(prevStatus => ({...prevStatus, [i]: 'error'}));
        }
      } catch (error) {
        console.error(`Error uploading ${files[i].name}:`, error);
        setUploadStatus(prevStatus => ({...prevStatus, [i]: 'error'}));
      }
    }
    
    setUploading(false);
    
    if (successCount > 0) {
      toast({
        title: "Téléchargement terminé",
        description: `${successCount} sur ${files.length} fichiers téléchargés avec succès`
      });
      setTimeout(() => onUploadComplete(successCount), 1000);
    } else {
      toast({
        title: "Échec du téléchargement",
        description: "Aucun fichier n'a pu être téléchargé",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-white mr-3">
          <Upload size={20} />
        </div>
        <h2 className="text-xl font-semibold">Télécharger des CV</h2>
      </div>
      
      {/* Zone de dépôt */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-navy/50 hover:bg-navy/5 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt"
          multiple
        />
        
        <Button 
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="mb-3"
          disabled={uploading}
        >
          <Upload size={18} className="mr-2" />
          Sélectionner des fichiers
        </Button>
        
        <p className="text-sm text-muted-foreground">
          Formats acceptés: PDF, DOC, DOCX, TXT
        </p>
      </div>
      
      {/* Liste de fichiers */}
      {files.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">
            Fichiers ({files.length})
          </h3>
          
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center bg-slate-50 p-3 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center mr-3">
                  <File size={14} />
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                
                {uploadStatus[index] === 'success' && (
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-green-600" />
                  </div>
                )}
                
                {uploadStatus[index] === 'error' && (
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <X size={14} className="text-red-600" />
                  </div>
                )}
                
                {uploadStatus[index] === 'uploading' && (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <Loader2 size={14} className="animate-spin text-navy" />
                  </div>
                )}
                
                {(uploadStatus[index] === 'idle' && !uploading) && (
                  <button 
                    onClick={() => removeFile(index)}
                    className="w-6 h-6 hover:bg-gray-200 rounded-full flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={clearFiles}
          disabled={uploading || files.length === 0}
        >
          Annuler
        </Button>
        
        <Button
          className="bg-navy text-white hover:bg-navy-dark"
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <Upload size={16} className="mr-2" />
              Télécharger ({files.length})
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UploadForm;
