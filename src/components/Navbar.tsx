
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
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          isActive
            ? 'bg-foreground/10 text-foreground'
            : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
        }`}
      >
        {Icon && <Icon className="mr-2 h-4 w-4" />}
        <span>{children}</span>
      </Link>
    );
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">ResuScan</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
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
              <>
                <NavLink href="/" icon={null}>
                  Accueil
                </NavLink>
              </>
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
                        className="relative h-8 w-8 rounded-full"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            <span>Administration</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild onClick={signOut}>
                        <button className="w-full flex items-center">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Déconnexion</span>
                        </button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <ThemeToggle />
                <Button
                  variant="ghost"
                  className="md:hidden"
                  size="icon"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="hidden md:flex gap-2">
                  <Button asChild variant="ghost">
                    <Link to="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Se connecter
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register">
                      <UserPlus className="mr-2 h-4 w-4" />
                      S'inscrire
                    </Link>
                  </Button>
                </div>
                <ThemeToggle />
                <Button
                  variant="ghost"
                  className="md:hidden"
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
        <div className="md:hidden border-t border-border/40 p-4 flex flex-col space-y-3 bg-background">
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
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut();
                }}
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/5"
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
      )}
    </header>
  );
};

export default Navbar;
