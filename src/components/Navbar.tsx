
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  User, LogOut, Moon, Sun, Menu, X,
  Home, Users, FileText, Settings, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type NavLink = {
  label: string;
  path: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

const navLinks: NavLink[] = [
  { label: 'Tableau de bord', path: '/dashboard', icon: Home },
  { label: 'Candidats', path: '/candidates', icon: Users },
  { label: 'CV', path: '/resumes', icon: FileText },
  { label: 'Administration', path: '/admin', icon: Settings, adminOnly: true },
];

const Navbar = () => {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if user is admin (to be replaced with actual auth check)
  const isAdmin = true;
  
  // Filter links based on admin status
  const visibleLinks = navLinks.filter(link => !link.adminOnly || isAdmin);
  
  // Toggle dark mode
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
  };
  
  // Check if the user is authenticated (to be replaced with actual auth check)
  const isAuthenticated = true;
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass shadow-sm py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center">
            <span className="text-sand text-xl font-bold">CV</span>
          </div>
          <span className="text-xl font-semibold text-navy-dark dark:text-sand">CVwise</span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-1">
          {visibleLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              <span className="flex items-center gap-1.5">
                <link.icon size={18} />
                {link.label}
              </span>
            </Link>
          ))}
        </nav>
        
        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-gold animate-pulse" />
          </Button>
          
          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
          
          {/* User Menu - Desktop */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User size={16} className="text-muted-foreground" />
                </div>
                <span className="font-medium">Mon Compte</span>
              </Button>
              <Button variant="ghost" size="icon">
                <LogOut size={20} />
              </Button>
            </div>
          ) : (
            <div className="hidden md:block">
              <Link to="/login">
                <Button className="button-primary">Connexion</Button>
              </Link>
            </div>
          )}
          
          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass animate-fade-in py-4 border-t border-border/10">
          <div className="container px-4 flex flex-col space-y-2">
            {visibleLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 p-3 rounded-md transition-colors ${
                  location.pathname === link.path 
                    ? 'bg-navy/10 text-navy-dark dark:bg-navy/20 dark:text-sand font-medium' 
                    : 'hover:bg-navy/5 dark:hover:bg-navy/10'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <>
                <hr className="border-border/10 my-2" />
                <div className="flex items-center justify-between">
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      <User size={18} className="mr-2" />
                      Mon Compte
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon">
                    <LogOut size={20} />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <hr className="border-border/10 my-2" />
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="button-primary w-full">Connexion</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
