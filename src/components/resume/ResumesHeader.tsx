
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Sparkles, FileUp, FileDigit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ResumesHeader: React.FC = () => {
  return (
    <div className="relative rounded-2xl overflow-hidden animate-fade-in mb-10">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/30 to-teal-500/20"></div>
      <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-navy/30"></div>
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between p-8 z-10">
        {/* Content section */}
        <div className="mb-6 md:mb-0 max-w-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 blur-sm rounded-xl animate-pulse"></div>
              <div className="relative p-5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg overflow-hidden">
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-yellow-300/30 rounded-full blur-xl"></div>
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-300/30 rounded-full blur-lg"></div>
                <FileDigit size={28} className="text-white relative z-10" />
                <div className="absolute top-0 right-0">
                  <Sparkles size={12} className="text-yellow-300 animate-pulse" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-600 animate-fade-in">
                CV Manager
              </h1>
              <div className="h-1 w-3/4 mt-1 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500 rounded-full"></div>
            </div>
          </div>
          
          <p className="text-slate-700 dark:text-slate-200 text-base md:text-lg mt-3 leading-relaxed max-w-md">
            Gérez tous les CV importés dans le système et transformez-les en profils de candidats qualifiés.
          </p>
          
          <div className="flex flex-wrap gap-3 mt-4 items-center">
            <div className="flex items-center text-xs text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full">
              <FileText size={12} className="mr-1" />
              Extraction automatique
            </div>
            <div className="flex items-center text-xs text-purple-800 bg-purple-100 px-3 py-1 rounded-full">
              <Sparkles size={12} className="mr-1" />
              Analyse IA
            </div>
            <div className="flex items-center text-xs text-teal-800 bg-teal-100 px-3 py-1 rounded-full">
              <FileUp size={12} className="mr-1" />
              Import facile
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link to="/resumes/upload">
            <Button className="relative overflow-hidden group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg border-0 px-5 py-6">
              {/* Background animation effects */}
              <div className="absolute inset-0 w-full h-full">
                <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[200%] transition-all duration-1000 ease-out"></div>
              </div>
              
              <div className="relative flex items-center">
                <div className="mr-3 bg-white/20 p-2 rounded-full">
                  <Upload size={20} className="text-white" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-lg">Importer un CV</span>
                  <span className="text-xs opacity-80">PDF, DOCX, TXT</span>
                </div>
              </div>
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Bottom border with animation */}
      <div className="relative h-1 w-full overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500"></div>
        <div className="absolute bottom-0 left-0 h-1 w-20 bg-white/30 animate-[shine_4s_ease-in-out_infinite]"></div>
      </div>
    </div>
  );
};

export default ResumesHeader;
