
import React, { ReactNode } from 'react';
import Navbar from './Navbar';

type LayoutProps = {
  children: ReactNode;
  className?: string;
};

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-grow pt-20 ${className}`}>
        {children}
      </main>
      
      <footer className="bg-navy-dark text-sand py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-sand rounded-lg flex items-center justify-center">
                <span className="text-navy-dark text-lg font-bold">CV</span>
              </div>
              <span className="text-lg font-semibold">CVwise</span>
            </div>
            
            <div className="text-sm text-sand/80">
              &copy; {new Date().getFullYear()} CVwise. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
