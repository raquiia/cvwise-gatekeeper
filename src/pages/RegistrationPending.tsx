
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RegistrationPending = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sand via-sand to-sand/80 py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass max-w-md w-full p-8 rounded-xl text-center animate-scale-in">
        <div className="w-20 h-20 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={40} className="text-navy" />
        </div>
        
        <h2 className="text-2xl font-bold text-navy-dark mb-3">
          Inscription en attente
        </h2>
        
        <p className="text-navy-dark/80 mb-6">
          Votre demande d'inscription a bien été reçue et est en cours d'examen par notre équipe d'administration.
        </p>
        
        <div className="bg-navy/5 border border-navy/10 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-navy-dark mb-2">Que se passe-t-il maintenant ?</h3>
          <ol className="text-sm text-left text-navy-dark/80 space-y-2">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-navy text-sand text-xs mr-2 mt-0.5">1</span>
              <span>Votre demande est examinée par un administrateur</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-navy text-sand text-xs mr-2 mt-0.5">2</span>
              <span>Vous recevrez un email dès que votre compte sera validé</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-navy text-sand text-xs mr-2 mt-0.5">3</span>
              <span>Vous pourrez alors vous connecter et commencer à utiliser l'application</span>
            </li>
          </ol>
        </div>
        
        <Link to="/">
          <Button className="button-primary">
            <Home size={18} className="mr-2" />
            Retour à l'accueil
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RegistrationPending;
