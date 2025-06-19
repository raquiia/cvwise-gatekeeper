
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const CandidateLoading: React.FC = () => {
  const [loadingText, setLoadingText] = useState('Chargement du profil...');
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeouts = [
      setTimeout(() => setLoadingText('Récupération des données'), 3000),
      setTimeout(() => setLoadingText('Traitement des informations'), 6000),
      setTimeout(() => setLoadingText('Finalisation du chargement'), 10000),
      setTimeout(() => setLoadingText('Cela prend plus de temps que prévu'), 15000),
    ];

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4">
      <div className="relative">
        <Loader2 className="h-12 w-12 animate-spin text-navy" />
        <div className="absolute inset-0 h-12 w-12 border-4 border-transparent border-t-navy/20 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-navy-dark">{loadingText}{dots}</p>
        <p className="text-sm text-muted-foreground">Veuillez patienter...</p>
      </div>
    </div>
  );
};

export default CandidateLoading;
