
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-lg border-0 bg-transparent hover:bg-accent/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200"
      aria-label={resolvedTheme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
    >
      <div className="relative flex items-center justify-center">
        {resolvedTheme === 'light' ? (
          <Moon 
            size={18} 
            className="text-foreground/80 hover:text-foreground transition-colors duration-200" 
          />
        ) : (
          <Sun 
            size={18} 
            className="text-foreground/80 hover:text-foreground transition-colors duration-200" 
          />
        )}
      </div>
    </Button>
  );
};

export default ThemeToggle;
