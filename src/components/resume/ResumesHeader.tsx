
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResumesHeaderProps {
  userId?: string;
}

const ResumesHeader: React.FC<ResumesHeaderProps> = () => {
  return (
    <div className="relative rounded-xl overflow-hidden animate-fade-in mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-blue-500/20 to-teal-500/30 opacity-50"></div>
      <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-navy/30"></div>
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between p-6 z-10">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-3">
            <div className="relative p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
              <div className="absolute inset-0 bg-white/10 rounded-xl animate-pulse"></div>
              <Upload size={24} className="text-white relative z-10" />
              <div className="absolute -top-1 -right-1">
                <Sparkles size={12} className="text-yellow-300 animate-pulse" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-blue-700 to-teal-600 animate-fade-in">
              CV
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base mt-2 max-w-md">
            Gérez tous les CV importés dans le système et transformez-les en profils de candidats
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Link to="/resumes/upload">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md transition-all duration-300 hover:shadow-lg border-0 group">
              <Upload size={18} className="mr-2 group-hover:animate-bounce" />
              <span className="relative">
                Importer un CV
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </span>
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500"></div>
    </div>
  );
};

export default ResumesHeader;
