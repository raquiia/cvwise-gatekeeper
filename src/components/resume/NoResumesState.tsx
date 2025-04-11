
import React from 'react';
import { Link } from 'react-router-dom';
import { FileUp, FileText, Scan, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NoResumesState: React.FC = () => {
  return (
    <div className="ai-card p-8 flex flex-col items-center justify-center text-center h-80 animate-fade-in">
      <div className="absolute inset-0 ai-gradient-bg opacity-50"></div>
      <div className="absolute inset-0 ai-grid-bg opacity-10"></div>
      <div className="absolute ai-card-accent ai-card-accent-1 ai-pulse"></div>
      <div className="absolute ai-card-accent ai-card-accent-2 ai-pulse" style={{ animationDelay: '1.5s' }}></div>
      
      <div className="relative w-20 h-20 mb-6 ai-float">
        <div className="absolute inset-0 rounded-full bg-indigo-400/20 blur-xl"></div>
        <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ai-glow">
          <FileText className="h-10 w-10 text-white" />
          <div className="absolute top-0 right-0">
            <Zap className="h-5 w-5 text-yellow-300 animate-pulse" />
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-4 ai-gradient-text">Aucun CV importé</h2>
      
      <p className="text-muted-foreground mb-8 max-w-md">
        Importez vos premiers CV pour commencer à analyser les profils 
        des candidats avec notre technologie d'intelligence artificielle avancée.
      </p>
      
      <Link to="/resumes/upload">
        <button className="ai-button group">
          <FileUp className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
          <span className="relative">Importer des CV</span>
          <span className="absolute right-0 top-0 h-full w-10 flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-all duration-300">
            <Scan className="h-4 w-4 text-white" />
          </span>
        </button>
      </Link>
      
      {/* Orbiting particle effect */}
      <div className="absolute left-1/2 top-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="absolute w-2 h-2 rounded-full bg-indigo-400/40 animate-orbit" style={{ animationDuration: '8s', left: '50%', top: '0%' }}></div>
        <div className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/40 animate-orbit" style={{ animationDuration: '12s', animationDelay: '1s', left: '80%', top: '30%' }}></div>
        <div className="absolute w-1 h-1 rounded-full bg-pink-400/40 animate-orbit" style={{ animationDuration: '10s', animationDelay: '2s', left: '20%', top: '70%' }}></div>
      </div>
    </div>
  );
};

export default NoResumesState;
