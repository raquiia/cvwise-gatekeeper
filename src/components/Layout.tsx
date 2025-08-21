import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import ChatBot from '@/components/ai-chat/ChatBot';

type LayoutProps = {
  children: ReactNode;
  className?: string;
  isAdminPage?: boolean;
};

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  className = '',
  isAdminPage = false
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className={`flex-grow pt-16 ${isAdminPage ? 'bg-muted/30' : ''} ${className}`}>
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
      
      <footer className="bg-card border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-lg font-bold">CV</span>
              </div>
              <span className="text-lg font-semibold text-foreground">CVwise</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} CVwise. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
      
      <ChatBot />
    </div>
  );
};

export default Layout;