
import React, { useState, useRef } from 'react';
import { Upload, File, FileText, X, Check, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { uploadResume } from '@/services/resumeService';
import { useAuth } from '@/context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

const ResumeUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
    
    setFiles(prev => [...prev, ...newFiles]);
    setUploadProgress(prev => [...prev, ...newFiles.map(() => 0)]);
    setErrors(prev => [...prev, ...newFiles.map(() => '')]);
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
      
      setFiles(prev => [...prev, ...newFiles]);
      setUploadProgress(prev => [...prev, ...newFiles.map(() => 0)]);
      setErrors(prev => [...prev, ...newFiles.map(() => '')]);
    }
  };
  
  // Remove a file
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => prev.filter((_, i) => i !== index));
  };
  
  // Upload files to Supabase
  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "Aucun fichier",
        description: "Veuillez sélectionner au moins un fichier à télécharger",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
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
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setErrors(prev => {
          const newErrors = [...prev];
          newErrors[i] = '';
          return newErrors;
        });
        
        // Simulate progress updates
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
          // Upload to Supabase
          const result = await uploadResume(file, user.id);
          
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
              newProgress[i] = -1; // Mark as error
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
          console.error(`Error uploading file ${file.name}:`, error);
          
          setUploadProgress(prev => {
            const newProgress = [...prev];
            newProgress[i] = -1; // Mark as error
            return newProgress;
          });
          
          setErrors(prev => {
            const newErrors = [...prev];
            newErrors[i] = error.message || "Erreur inconnue";
            return newErrors;
          });
        }
      }
      
      // Check if any uploads were successful
      if (successCount > 0) {
        toast({
          title: "Téléchargement réussi",
          description: `${successCount} CV sur ${files.length} ont été téléchargés avec succès`,
        });
        
        if (successCount === files.length) {
          setTimeout(() => {
            setCompleted(true);
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
        description: error.message || "Une erreur s'est produite lors du téléchargement des fichiers",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Redirect to resumes page after upload
  const handleNavigateToResumes = () => {
    navigate('/resumes');
  };
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/resumes" className="flex items-center text-navy hover:text-navy-dark mb-4">
            <ArrowLeft size={16} className="mr-1" />
            Retour aux CV
          </Link>
          
          <h1 className="text-2xl font-bold text-navy-dark mb-2">Importer des CV</h1>
          <p className="text-muted-foreground">
            Téléchargez des CV pour les analyser automatiquement avec l'IA
          </p>
        </div>
        
        {/* Upload Section */}
        {!completed ? (
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
              {/* Drag & Drop Zone */}
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
              
              {/* Selected Files */}
              {files.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-navy-dark mb-3">
                    Fichiers sélectionnés ({files.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center bg-navy/5 rounded-lg p-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3">
                          <File size={16} className="text-navy" />
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-navy-dark truncate max-w-md">
                              {file.name}
                            </p>
                            {!uploading && (
                              <button 
                                className="text-red-500 hover:text-red-700" 
                                onClick={() => removeFile(index)}
                                aria-label="Supprimer le fichier"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground mb-1">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                          
                          {errors[index] && (
                            <div className="text-xs text-red-500 mb-1">
                              {errors[index]}
                            </div>
                          )}
                          
                          {uploadProgress[index] > 0 && (
                            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  uploadProgress[index] === -1 ? 'bg-red-500' : 'bg-navy'
                                }`}
                                style={{ width: `${uploadProgress[index] === -1 ? 100 : uploadProgress[index]}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                        
                        {uploadProgress[index] === 100 && (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center ml-2">
                            <Check size={14} className="text-emerald-600" />
                          </div>
                        )}
                        
                        {uploadProgress[index] === -1 && (
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center ml-2">
                            <X size={14} className="text-red-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Upload Button */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  disabled={uploading}
                  onClick={() => {
                    setFiles([]);
                    setUploadProgress([]);
                    setErrors([]);
                  }}
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
                      Télécharger et analyser ({files.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="glass rounded-xl p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-6">
              <Check size={32} className="text-emerald-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-navy-dark mb-2">
              Téléchargement réussi!
            </h2>
            
            <p className="text-lg text-muted-foreground mb-6">
              {files.length} CV ont été téléchargés avec succès
            </p>
            
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                className="px-6"
                onClick={() => {
                  setFiles([]);
                  setUploadProgress([]);
                  setErrors([]);
                  setUploading(false);
                  setCompleted(false);
                }}
              >
                Télécharger d'autres CV
              </Button>
              
              <Button
                className="button-primary px-6"
                onClick={handleNavigateToResumes}
              >
                Voir tous les CV
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResumeUpload;
