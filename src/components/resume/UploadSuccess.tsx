
import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface UploadSuccessProps {
  fileCount: number;
  onUploadMore: () => void;
}

const UploadSuccess: React.FC<UploadSuccessProps> = ({ fileCount, onUploadMore }) => {
  const navigate = useNavigate();

  const handleNavigateToResumes = () => {
    navigate('/resumes');
  };

  return (
    <div className="glass rounded-xl p-8 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-6">
        <Check size={32} className="text-emerald-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-navy-dark mb-2">
        Téléchargement réussi!
      </h2>
      
      <p className="text-lg text-muted-foreground mb-6">
        {fileCount} CV {fileCount > 1 ? 'ont été téléchargés' : 'a été téléchargé'} avec succès
      </p>
      
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          className="px-6"
          onClick={onUploadMore}
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
  );
};

export default UploadSuccess;
