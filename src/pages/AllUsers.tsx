
import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserX, ArrowLeft, 
  MoreHorizontal, MessageSquare, Settings,
  LogOut, Search, Filter, Download, SortAsc,
  SortDesc, FileText, ChevronLeft, Mail, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

// Les mêmes données fictives que dans Admin.tsx
const activeUsersData = [
  {
    id: 101,
    name: 'Antoine Leroy',
    email: 'antoine.leroy@example.com',
    company: 'ConsultPro',
    role: 'Administrateur',
    lastLogin: '26/07/2023 10:45',
    status: 'online',
    avatar: null
  },
  {
    id: 102,
    name: 'Marie Bernard',
    email: 'marie.bernard@example.com',
    company: 'TechConsult SA',
    role: 'Recruteur',
    lastLogin: '25/07/2023 16:20',
    status: 'offline',
    avatar: null
  },
  {
    id: 103,
    name: 'Thomas Durand',
    email: 'thomas.durand@example.com',
    company: 'IndustrieGroup',
    role: 'Recruteur',
    lastLogin: '26/07/2023 09:10',
    status: 'offline',
    avatar: null
  },
  {
    id: 104,
    name: 'Julie Lambert',
    email: 'julie.lambert@example.com',
    company: 'ConsultPro',
    role: 'Recruteur',
    lastLogin: '24/07/2023 14:30',
    status: 'offline',
    avatar: null
  },
  {
    id: 105,
    name: 'Éric Martin',
    email: 'eric.martin@example.com',
    company: 'TechnoSolutions',
    role: 'Recruteur',
    lastLogin: '23/07/2023 11:20',
    status: 'offline',
    avatar: null
  },
  {
    id: 106,
    name: 'Sophie Moreau',
    email: 'sophie.moreau@example.com',
    company: 'ConsultPro',
    role: 'Responsable RH',
    lastLogin: '25/07/2023 09:45',
    status: 'offline',
    avatar: null
  },
  {
    id: 107,
    name: 'Philippe Dubois',
    email: 'philippe.dubois@example.com',
    company: 'IndustrieGroup',
    role: 'Responsable RH',
    lastLogin: '24/07/2023 16:50',
    status: 'offline',
    avatar: null
  },
  {
    id: 108,
    name: 'Camille Petit',
    email: 'camille.petit@example.com',
    company: 'TechConsult SA',
    role: 'Recruteur',
    lastLogin: '26/07/2023 08:30',
    status: 'offline',
    avatar: null
  }
];

const AllUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [filteredUsers, setFilteredUsers] = useState(activeUsersData);
  const { toast } = useToast();

  // Filtrer les utilisateurs en fonction de la recherche et du rôle sélectionné
  useEffect(() => {
    const filtered = activeUsersData.filter(user => {
      const matchesSearch = !searchQuery || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.company.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = !selectedRole || user.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
    
    setFilteredUsers(filtered);
  }, [searchQuery, selectedRole]);

  // Simuler l'envoi d'un e-mail à l'utilisateur
  const handleContactUser = (userName: string) => {
    toast({
      title: "Contact utilisateur",
      description: `Un e-mail a été envoyé à ${userName}`,
    });
  };

  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ChevronLeft size={16} />
                  Retour
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-navy-dark">Tous les utilisateurs</h1>
            </div>
            <p className="text-muted-foreground">
              Liste complète des utilisateurs (données fictives pour démonstration)
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Rechercher un utilisateur..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    <Filter size={16} className="mr-2" />
                    Filtres
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedRole(null)}>
                    Tous les rôles
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedRole('Administrateur')}>
                    Administrateur
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedRole('Recruteur')}>
                    Recruteur
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedRole('Responsable RH')}>
                    Responsable RH
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline">
                <FileText size={16} className="mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total utilisateurs</p>
                <p className="text-xl font-semibold">{activeUsersData.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <UserCheck size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actifs aujourd'hui</p>
                <p className="text-xl font-semibold">1</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Briefcase size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entreprises</p>
                <p className="text-xl font-semibold">4</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Users table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {/* Table Header with Sort Controls */}
          <div className="p-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-navy-dark">
                {filteredUsers.length} utilisateurs
              </span>
              
              {selectedRole && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {selectedRole}
                  <button 
                    className="ml-1 hover:text-blue-900" 
                    onClick={() => setSelectedRole(null)}
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-navy-dark">
                <SortAsc size={14} className="mr-1" />
                Nom
              </Button>
              
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-navy-dark">
                <SortDesc size={14} className="mr-1" />
                Dernière connexion
              </Button>
            </div>
          </div>
          
          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-navy/5">
                  <th className="text-left p-4 text-sm font-medium text-navy-dark">Utilisateur</th>
                  <th className="text-left p-4 text-sm font-medium text-navy-dark">Entreprise</th>
                  <th className="text-left p-4 text-sm font-medium text-navy-dark">Rôle</th>
                  <th className="text-left p-4 text-sm font-medium text-navy-dark">Dernière connexion</th>
                  <th className="text-right p-4 text-sm font-medium text-navy-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9 mr-3">
                          <AvatarFallback className="bg-navy/10 text-navy-dark text-xs">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-navy-dark flex items-center">
                            {user.name}
                            {user.status === 'online' && (
                              <div className="w-2 h-2 rounded-full bg-emerald-500 ml-2"></div>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Mail size={10} className="mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{user.company}</td>
                    <td className="p-4">
                      <Badge variant={user.role === 'Administrateur' ? 'default' : 'outline'} className={
                        user.role === 'Administrateur' 
                          ? 'bg-navy text-sand' 
                          : user.role === 'Responsable RH'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-blue-50 text-blue-700'
                      }>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{user.lastLogin}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleContactUser(user.name)}
                        >
                          <MessageSquare size={16} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Settings size={14} className="mr-2" />
                              Modifier les droits
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserCheck size={14} className="mr-2" />
                              Activer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <LogOut size={14} className="mr-2" />
                              Déconnecter
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AllUsers;
