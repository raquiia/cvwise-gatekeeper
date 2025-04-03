
import React from 'react';
import { File, X, Check } from 'lucide-react';

interface FileListProps {
  files: File[];
  uploadProgress: number[];
  errors: string[];
  removeFile: (index: number) => void;
  uploading: boolean;
}

const FileList: React.FC<FileListProps> = ({
  files,
  uploadProgress,
  errors,
  removeFile,
  uploading,
}) => {
  if (files.length === 0) return null;

  return (
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
  );
};

export default FileList;
