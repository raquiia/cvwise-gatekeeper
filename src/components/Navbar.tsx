
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  User,
  LogOut,
  UserPlus,
  LogIn,
  FileText,
  BarChart,
  Users,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import ThemeToggle from './ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const NavLink = ({ href, children, icon: Icon, onClick = () => {} }) => {
    const isActive = location.pathname === href;
    
    return (
      <Link
        to={href}
        onClick={() => {
          setIsMenuOpen(false);
          onClick();
        }}
        className={`nav-item ${isActive ? 'active' : ''}`}
      >
        {Icon && <Icon className="mr-2 h-4 w-4" />}
        <span>{children}</span>
      </Link>
    );
  };
  
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/50">
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-primary-foreground text-lg font-bold">R</span>
            </div>
            <span className="font-bold text-foreground group-hover:text-primary transition-colors">
              ResuScan
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-2 text-sm font-medium">
            {user ? (
              <>
                <NavLink href="/dashboard" icon={BarChart}>
                  Tableau de bord
                </NavLink>
                <NavLink href="/candidates" icon={Users}>
                  Candidats
                </NavLink>
                <NavLink href="/resumes" icon={FileText}>
                  CV
                </NavLink>
                <NavLink href="/job-offers" icon={Briefcase}>
                  Offres d'emploi
                </NavLink>
                {isAdmin && (
                  <NavLink href="/admin" icon={ShieldCheck}>
                    Administration
                  </NavLink>
                )}
              </>
            ) : (
              <NavLink href="/" icon={null}>
                Accueil
              </NavLink>
            )}
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-end">
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-9 w-9 rounded-lg hover:bg-accent/80"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 glass">
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Mon Profil</span>
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            <span>Administration</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={signOut} className="flex items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Déconnexion</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <ThemeToggle />
                
                <Button
                  variant="ghost"
                  className="md:hidden h-9 w-9 rounded-lg hover:bg-accent/80"
                  size="icon"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="hidden md:flex gap-2">
                  <Button asChild variant="ghost" className="rounded-lg">
                    <Link to="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Se connecter
                    </Link>
                  </Button>
                  <Button asChild className="rounded-lg">
                    <Link to="/register">
                      <UserPlus className="mr-2 h-4 w-4" />
                      S'inscrire
                    </Link>
                  </Button>
                </div>
                
                <ThemeToggle />
                
                <Button
                  variant="ghost"
                  className="md:hidden h-9 w-9 rounded-lg hover:bg-accent/80"
                  size="icon"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {isMenuOpen && isMobile && (
        <div className="md:hidden border-t border-border/50 glass animate-slide-up">
          <div className="container p-4 space-y-2">
            {user ? (
              <>
                <NavLink href="/dashboard" icon={BarChart}>
                  Tableau de bord
                </NavLink>
                <NavLink href="/candidates" icon={Users}>
                  Candidats
                </NavLink>
                <NavLink href="/resumes" icon={FileText}>
                  CV
                </NavLink>
                <NavLink href="/job-offers" icon={Briefcase}>
                  Offres d'emploi
                </NavLink>
                {isAdmin && (
                  <NavLink href="/admin" icon={ShieldCheck}>
                    Administration
                  </NavLink>
                )}
                <NavLink href="/profile" icon={User}>
                  Mon Profil
                </NavLink>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                  }}
                  className="nav-item w-full justify-start"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <>
                <NavLink href="/" icon={null}>
                  Accueil
                </NavLink>
                <NavLink href="/login" icon={LogIn}>
                  Se connecter
                </NavLink>
                <NavLink href="/register" icon={UserPlus}>
                  S'inscrire
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
