
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return false;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return false;
    }
    
    if (password.length < 8) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !company) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Inscription réussie !",
        description: "Votre demande d'inscription a été envoyée à l'administrateur pour validation.",
      });
      
      setIsLoading(false);
      navigate('/registration-pending');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sand via-sand to-sand/80 py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass max-w-md w-full p-8 rounded-xl animate-scale-in">
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-sand text-xl font-bold">CV</span>
            </div>
            <span className="text-xl font-semibold text-navy-dark">CVwise</span>
          </Link>
        </div>
        
        <h2 className="text-center text-2xl font-bold text-navy-dark mb-4">
          Créer un compte
        </h2>
        
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 1 ? 'bg-navy text-sand' : 'bg-navy/20 text-navy-dark'
            }`}>
              1
            </div>
            <div className={`w-12 h-1 ${step === 1 ? 'bg-navy/30' : 'bg-navy/20'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 2 ? 'bg-navy text-sand' : 'bg-navy/20 text-navy-dark'
            }`}>
              2
            </div>
          </div>
        </div>
        
        {step === 1 && (
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Adresse email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="input-field w-full"
                autoComplete="email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="label">
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full pr-10"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                <div className={`h-1 flex-1 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${/[^A-Za-z0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirmer le mot de passe
              </label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field w-full"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              {password && confirmPassword && (
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {password === confirmPassword ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle size={12} className="mr-1" />
                      Les mots de passe correspondent
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      Les mots de passe ne correspondent pas
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <Button
              type="button"
              className="button-primary w-full mt-6"
              onClick={nextStep}
            >
              Continuer
            </Button>
          </form>
        )}
        
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="label">
                  Prénom
                </label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field w-full"
                  autoComplete="given-name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="label">
                  Nom
                </label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field w-full"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="company" className="label">
                Entreprise
              </label>
              <Input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="input-field w-full"
                autoComplete="organization"
                required
              />
            </div>
            
            <div className="flex items-center mt-4">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-navy focus:ring-navy"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-navy-dark">
                J'accepte les{' '}
                <Link to="/terms" className="text-navy underline hover:text-navy-dark">
                  conditions d'utilisation
                </Link>
                {' '}et la{' '}
                <Link to="/privacy" className="text-navy underline hover:text-navy-dark">
                  politique de confidentialité
                </Link>
              </label>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-1/3"
                onClick={() => setStep(1)}
              >
                Retour
              </Button>
              
              <Button
                type="submit"
                className="button-primary w-2/3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Inscription...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus size={18} />
                    S'inscrire
                  </span>
                )}
              </Button>
            </div>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-navy font-medium hover:text-navy-dark">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
