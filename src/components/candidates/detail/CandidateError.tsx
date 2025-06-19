
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, AlertTriangle, LogIn, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CandidateErrorProps {
  errorMessage: string | null;
}

const CandidateError: React.FC<CandidateErrorProps> = ({ errorMessage }) => {
  const navigate = useNavigate();

  // Determine error type
  const isAuthError = errorMessage?.toLowerCase().includes('connecté') || 
                     errorMessage?.toLowerCase().includes('session') ||
                     errorMessage?.toLowerCase().includes('authorized') ||
                     errorMessage?.toLowerCase().includes('access denied');
                     
  const isTimeoutError = errorMessage?.toLowerCase().includes('timeout') ||
                        errorMessage?.toLowerCase().includes('trop de temps');

  const getIcon = () => {
    if (isAuthError) {
      return <LogIn size={32} className="text-orange-600" />;
    }
    if (isTimeoutError) {
      return <RefreshCw size={32} className="text-blue-600" />;
    }
    return <User size={32} className="text-red-600" />;
  };

  const getIconBgColor = () => {
    if (isAuthError) {
      return "bg-orange-100";
    }
    if (isTimeoutError) {
      return "bg-blue-100";
    }
    return "bg-red-100";
  };

  const getTitle = () => {
    if (isAuthError) {
      return "Connexion requise";
    }
    if (isTimeoutError) {
      return "Chargement trop long";
    }
    return errorMessage || "Candidat non trouvé";
  };

  const getDescription = () => {
    if (isAuthError) {
      return "Votre session a expiré ou vous devez vous connecter pour accéder à ce candidat.";
    }
    if (isTimeoutError) {
      return "Le chargement du profil prend trop de temps. Veuillez réessayer.";
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
    
    if (isTimeoutError) {
      return (
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw size={16} className="mr-2" />
            Réessayer
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
