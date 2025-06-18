
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, AlertTriangle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CandidateErrorProps {
  errorMessage: string | null;
}

const CandidateError: React.FC<CandidateErrorProps> = ({ errorMessage }) => {
  const navigate = useNavigate();

  // Determine if this is an authentication error
  const isAuthError = errorMessage?.toLowerCase().includes('connecté') || 
                     errorMessage?.toLowerCase().includes('session') ||
                     errorMessage?.toLowerCase().includes('authorized') ||
                     errorMessage?.toLowerCase().includes('access denied');

  const getIcon = () => {
    if (isAuthError) {
      return <LogIn size={32} className="text-orange-600" />;
    }
    return <User size={32} className="text-red-600" />;
  };

  const getIconBgColor = () => {
    if (isAuthError) {
      return "bg-orange-100";
    }
    return "bg-red-100";
  };

  const getTitle = () => {
    if (isAuthError) {
      return "Connexion requise";
    }
    return errorMessage || "Candidat non trouvé";
  };

  const getDescription = () => {
    if (isAuthError) {
      return "Votre session a expiré ou vous devez vous connecter pour accéder à ce candidat.";
    }
    return "Le profil que vous recherchez n'existe pas ou n'est plus disponible.";
  };

  const getActionButtons = () => {
    if (isAuthError) {
      return (
        <div className="flex gap-3">
          <Button onClick={() => navigate('/login')} className="bg-orange-600 hover:bg-orange-700">
            <LogIn size={16} className="mr-2" />
            Se connecter
          </Button>
          <Button variant="outline" onClick={() => navigate('/candidates')}>
            Retour à la liste
          </Button>
        </div>
      );
    }
    
    return (
      <Button onClick={() => navigate('/candidates')}>
        Retour à la liste des candidats
      </Button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className={`w-16 h-16 rounded-full ${getIconBgColor()} flex items-center justify-center mb-4`}>
        {getIcon()}
      </div>
      <h2 className="text-xl font-semibold text-navy-dark mb-2">
        {getTitle()}
      </h2>
      <p className="text-muted-foreground mb-6">
        {getDescription()}
      </p>
      {getActionButtons()}
    </div>
  );
};

export default CandidateError;
