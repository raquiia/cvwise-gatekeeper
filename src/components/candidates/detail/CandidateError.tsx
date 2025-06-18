
import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CandidateErrorProps {
  errorMessage: string | null;
}

const CandidateError: React.FC<CandidateErrorProps> = ({ errorMessage }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <User size={32} className="text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-navy-dark mb-2">
        {errorMessage || "Candidat non trouvé"}
      </h2>
      <p className="text-muted-foreground mb-6">
        Le profil que vous recherchez n'existe pas ou n'est plus disponible.
      </p>
      <Button onClick={() => navigate('/candidates')}>
        Retour à la liste des candidats
      </Button>
    </div>
  );
};

export default CandidateError;
