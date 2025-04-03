
import React, { ReactNode, useEffect } from 'react';
import Navbar from './Navbar';

type LayoutProps = {
  children: ReactNode;
  className?: string;
  isAdminPage?: boolean;
};

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  className = '',
  isAdminPage = false
}) => {
  // Check for system dark mode preference
  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-grow pt-20 ${isAdminPage ? 'bg-sand/30 dark:bg-navy-dark/50' : ''} ${className}`}>
        {children}
      </main>
      
      <footer className="bg-navy-dark text-sand py-6 mt-auto dark:bg-navy-dark/95">
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
