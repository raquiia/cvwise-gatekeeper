
import React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle = () => {
  // We can't use the hook directly since we don't have next-themes
  // This is just an example of implementation
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  
  // Check for system preference on mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Update document class and localStorage
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('theme', newTheme);
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full h-8 w-8 p-0 flex items-center justify-center hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors"
      aria-label={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
    >
      {theme === 'light' ? (
        <Moon size={16} className="text-navy dark:text-sand transition-colors" />
      ) : (
        <Sun size={16} className="text-navy dark:text-sand transition-colors" />
      )}
    </Button>
  );
};

export default ThemeToggle;
