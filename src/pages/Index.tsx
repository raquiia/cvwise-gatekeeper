
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Rediriger automatiquement vers le tableau de bord si l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <Layout>
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-4xl font-bold mb-6">Bienvenue sur CVwise</h1>
        <p className="text-xl mb-8">
          La plateforme intelligente pour gérer vos candidats et leurs CVs
        </p>
        
        {user ? (
          <div className="space-y-4">
            <div className="flex justify-center gap-4">
              <Button asChild>
                <Link to="/dashboard">
                  Tableau de bord
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/resumes/upload">
                  Télécharger un CV
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link to="/login">
                Connexion
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/register">
                Inscription
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
