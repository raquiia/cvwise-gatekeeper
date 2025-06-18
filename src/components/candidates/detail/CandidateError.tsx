
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, AlertTriangle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CandidateErrorProps {
  errorMessage: string | null;
  errorType?: 'not_found' | 'access_denied' | 'generic';
}

const CandidateError: React.FC<CandidateErrorProps> = ({ 
  errorMessage, 
  errorType = 'generic' 
}) => {
  const navigate = useNavigate();

  const getErrorDisplay = () => {
    switch (errorType) {
      case 'not_found':
        return {
          icon: <User size={32} className="text-amber-600" />,
          title: "Candidat non trouvé",
          description: "Le profil que vous recherchez n'existe pas ou a été supprimé.",
          bgColor: "bg-amber-100",
        };
      case 'access_denied':
        return {
          icon: <AlertTriangle size={32} className="text-red-600" />,
          title: "Accès refusé",
          description: "Vous n'avez pas l'autorisation de voir ce candidat. Il appartient peut-être à un autre utilisateur.",
          bgColor: "bg-red-100",
        };
      default:
        return {
          icon: <User size={32} className="text-gray-600" />,
          title: "Erreur",
          description: errorMessage || "Une erreur s'est produite lors du chargement du profil.",
          bgColor: "bg-gray-100",
        };
    }
  };

  const errorDisplay = getErrorDisplay();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className={`w-16 h-16 rounded-full ${errorDisplay.bgColor} flex items-center justify-center mb-4`}>
        {errorDisplay.icon}
      </div>
      
      <h2 className="text-xl font-semibold text-foreground mb-2">
        {errorDisplay.title}
      </h2>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        {errorDisplay.description}
      </p>
      
      <div className="flex gap-3">
        <Button 
          onClick={() => navigate('/candidates')}
          className="gap-2"
        >
          <User className="h-4 w-4" />
          Retour aux candidats
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Tableau de bord
        </Button>
      </div>
      
      {errorType === 'access_denied' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
          <p className="text-sm text-blue-700">
            <strong>Conseil :</strong> Si vous pensez que vous devriez avoir accès à ce candidat, 
            vérifiez que vous êtes connecté avec le bon compte ou contactez l'administrateur.
          </p>
        </div>
      )}
    </div>
  );
};

export default CandidateError;
