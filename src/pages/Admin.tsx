import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserX, Clock, Settings, Shield, 
  Briefcase, RefreshCw, Building, ArrowUpRight, 
  LogOut, Mail, CheckCircle, XCircle, MessageSquare,
  AlertTriangle, MoreHorizontal, FileQuestion, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Données fictives pour les utilisateurs en attente de validation
const pendingUsersData = [
  {
    id: 1,
    name: 'Sophie Martin',
    email: 'sophie.martin@example.com',
    company: 'TechConsult SA',
    role: 'Recruteur',
    registrationDate: '25/07/2023',
    avatar: null
  },
  {
    id: 2,
    name: 'François Dubois',
    email: 'francois.dubois@example.com',
    company: 'IndustrieGroup',
    role: 'Responsable RH',
    registrationDate: '24/07/2023',
    avatar: null
  },
  {
    id: 3,
    name: 'Camille Petit',
    email: 'camille.petit@example.com',
    company: 'PME Solutions',
    role: 'Directrice des Opérations',
    registrationDate: '23/07/2023',
    avatar: null
  }
];

// Données fictives pour les utilisateurs actifs
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
  }
];

// Données fictives pour les activités système
const systemActivitiesData = [
  {
    id: 1,
    action: 'Mise à jour du système',
    description: 'Mise à jour des modèles d\'IA pour l\'analyse des CV',
    timestamp: '26/07/2023 08:00',
    icon: <RefreshCw size={16} className="text-blue-500" />
  },
  {
    id: 2,
    action: 'Nouvel utilisateur validé',
    description: 'L\'administrateur a validé l\'inscription de Jean Dupont',
    timestamp: '25/07/2023 15:32',
    icon: <UserCheck size={16} className="text-emerald-500" />
  },
  {
    id: 3,
    action: 'Limite d\'utilisation atteinte',
    description: 'TechConsult SA a atteint 80% de sa limite mensuelle d\'analyses de CV',
    timestamp: '25/07/2023 10:15',
    icon: <AlertTriangle size={16} className="text-amber-500" />
  },
  {
    id: 4,
    action: 'Nouvelle entreprise',
    description: 'L\'entreprise "PME Solutions" a été ajoutée au système',
    timestamp: '24/07/2023 14:20',
    icon: <Building size={16} className="text-purple-500" />
  },
  {
    id: 5,
    action: 'Tentative de connexion échouée',
    description: 'Plusieurs tentatives de connexion échouées pour l\'utilisateur marc.dupont@example.com',
    timestamp: '24/07/2023 09:45',
    icon: <Shield size={16} className="text-red-500" />
  }
];

// Interface pour les utilisateurs réels
interface RealUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  created_at: string;
  last_sign_in_at?: string;
  avatar_url?: string;
}

const Admin = () => {
  // État pour suivre les utilisateurs validés/rejetés
  const [pendingUsers, setPendingUsers] = useState(pendingUsersData);
  const [activeUsers, setActiveUsers] = useState(activeUsersData);
  const [realUsers, setRealUsers] = useState<RealUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Charger les utilisateurs réels depuis Supabase
  useEffect(() => {
    const fetchRealUsers = async () => {
      try {
        setLoading(true);
        
        // Récupérer les utilisateurs depuis auth.users
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('Erreur lors de la récupération des utilisateurs:', authError);
          toast({
            title: "Erreur",
            description: "Impossible de récupérer les utilisateurs",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Récupérer les profils pour obtenir les noms et autres informations
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) {
          console.error('Erreur lors de la récupération des profils:', profilesError);
        }
        
        // Combiner les données des utilisateurs et des profils
        if (authUsers) {
          const usersWithProfiles = authUsers.users.map(user => {
            const profile = profiles?.find(p => p.id === user.id);
            return {
              id: user.id,
              email: user.email || '',
              first_name: profile?.first_name || user.user_metadata?.first_name || '',
              last_name: profile?.last_name || user.user_metadata?.last_name || '',
              company: profile?.company || user.user_metadata?.company || '',
              created_at: user.created_at,
              last_sign_in_at: user.last_sign_in_at,
              avatar_url: profile?.avatar_url || null
            };
          });
          
          setRealUsers(usersWithProfiles);
          console.log("Utilisateurs réels chargés:", usersWithProfiles);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur inattendue:', error);
        setLoading(false);
      }
    };
    
    fetchRealUsers();
  }, [toast]);
  
  // Gérer la validation d'un utilisateur
  const handleApproveUser = (userId: number) => {
    const userToApprove = pendingUsers.find(user => user.id === userId);
    if (userToApprove) {
      // Ajouter l'utilisateur à la liste des actifs
      setActiveUsers(prev => [
        ...prev, 
        { 
          ...userToApprove, 
          id: 1000 + userToApprove.id, // Éviter les conflits d'ID
          lastLogin: 'Jamais',
          status: 'offline'
        }
      ]);
      
      // Retirer l'utilisateur de la liste des en attente
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
    }
  };
  
  // Gérer le rejet d'un utilisateur
  const handleRejectUser = (userId: number) => {
    setPendingUsers(prev => prev.filter(user => user.id !== userId));
  };
  
  // Formater la date en français
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-dark mb-2">Administration</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs, les paramètres système et contrôlez l'accès à l'application
          </p>
        </div>
        
        {/* Admin Dashboard Tabs */}
        <Tabs defaultValue="users" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users size={16} />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} />
              Paramètres
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Shield size={16} />
              Système
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building size={16} />
              Entreprises
            </TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Statistiques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                            <UserCheck size={16} className="text-emerald-600" />
                          </div>
                          <span className="text-sm font-medium">Utilisateurs actifs</span>
                        </div>
                        <span className="font-semibold">{realUsers.length}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                            <Clock size={16} className="text-amber-600" />
                          </div>
                          <span className="text-sm font-medium">En attente</span>
                        </div>
                        <span className="font-semibold">{pendingUsers.length}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <Building size={16} className="text-blue-600" />
                          </div>
                          <span className="text-sm font-medium">Entreprises</span>
                        </div>
                        <span className="font-semibold">5</span>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Accès récents</h4>
                        <div className="space-y-2">
                          {realUsers.slice(0, 3).map((user, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-gray-300 mr-2"></div>
                                <span className="text-xs">{user.first_name} {user.last_name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {user.last_sign_in_at 
                                  ? formatDate(user.last_sign_in_at) 
                                  : 'Jamais connecté'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-3 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Clock size={18} className="text-amber-500" />
                        Utilisateurs en attente
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={16} className="text-muted-foreground ml-1 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Données fictives pour démonstration</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CardTitle>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">
                        {pendingUsers.length} demandes
                      </Badge>
                    </div>
                    <CardDescription>
                      Validez ou rejetez les demandes d'inscription
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle size={24} className="text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Aucune demande en attente</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between bg-card p-4 rounded-lg border border-border">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-4">
                                <AvatarFallback className="bg-navy/10 text-navy-dark">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium text-navy-dark">{user.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail size={12} />
                                  {user.email}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                    <Briefcase size={10} className="mr-1" />
                                    {user.company}
                                  </Badge>
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                                    {user.role}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                onClick={() => handleApproveUser(user.id)}
                              >
                                <CheckCircle size={16} className="mr-1" />
                                Valider
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleRejectUser(user.id)}
                              >
                                <XCircle size={16} className="mr-1" />
                                Rejeter
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Utilisateurs réels */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck size={18} className="text-emerald-500" />
                        Utilisateurs actifs
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        <div className="flex items-center gap-1">
                          {loading ? "Chargement..." : `${realUsers.length} utilisateurs`}
                        </div>
                      </Button>
                    </div>
                    <CardDescription>
                      Utilisateurs enregistrés dans la base de données
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Chargement des utilisateurs...</p>
                      </div>
                    ) : realUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users size={24} className="text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Utilisateur</th>
                              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Entreprise</th>
                              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rôle</th>
                              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Création</th>
                              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Dernière connexion</th>
                              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {realUsers.map((user) => (
                              <tr key={user.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                <td className="p-3">
                                  <div className="flex items-center">
                                    <Avatar className="h-8 w-8 mr-3">
                                      <AvatarImage src={user.avatar_url || undefined} />
                                      <AvatarFallback className="bg-navy/10 text-navy-dark text-xs">
                                        {user.first_name && user.last_name 
                                          ? `${user.first_name[0]}${user.last_name[0]}`
                                          : user.email.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-navy-dark flex items-center">
                                        {user.first_name && user.last_name 
                                          ? `${user.first_name} ${user.last_name}`
                                          : 'Utilisateur'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-sm">{user.company || '-'}</td>
                                <td className="p-3">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    Admin
                                  </Badge>
                                </td>
                                <td className="p-3 text-sm text-muted-foreground">
                                  {formatDate(user.created_at)}
                                </td>
                                <td className="p-3 text-sm text-muted-foreground">
                                  {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Jamais'}
                                </td>
                                <td className="p-3 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal size={16} />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <MessageSquare size={14} className="mr-2" />
                                        Contacter
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Settings size={14} className="mr-2" />
                                        Modifier les droits
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-red-600">
                                        <LogOut size={14} className="mr-2" />
                                        Déconnecter
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Utilisateurs fictifs */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck size={18} className="text-emerald-500" />
                        Exemples d'utilisateurs
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FileQuestion size={16} className="text-muted-foreground ml-1 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Données fictives pour démonstration</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        <div className="flex items-center gap-1">
                          Voir tous
                          <ArrowUpRight size={14} />
                        </div>
                      </Button>
                    </div>
                    <CardDescription>
                      Exemples d'utilisateurs (données fictives)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Utilisateur</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Entreprise</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rôle</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Dernière connexion</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeUsers.map((user) => (
                            <tr key={user.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-3">
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
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-sm">{user.company}</td>
                              <td className="p-3">
                                <Badge variant={user.role === 'Administrateur' ? 'default' : 'outline'} className={
                                  user.role === 'Administrateur' 
                                    ? 'bg-navy text-sand' 
                                    : 'bg-blue-50 text-blue-700'
                                }>
                                  {user.role}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">{user.lastLogin}</td>
                              <td className="p-3 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal size={16} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <MessageSquare size={14} className="mr-2" />
                                      Contacter
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Settings size={14} className="mr-2" />
                                      Modifier les droits
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <LogOut size={14} className="mr-2" />
                                      Déconnecter
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Paramètres de l'application</CardTitle>
                    <CardDescription>
                      Configurez les paramètres généraux de l'application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3">Analyse des CV</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label htmlFor="api-key" className="text-sm font-medium block mb-1">Clé API OpenAI</label>
                            <input
                              id="api-key"
                              type="password"
                              className="input-field w-full max-w-lg"
                              placeholder="sk-••••••••••••••••••••••••"
                              defaultValue="sk-••••••••••••••••••••••••"
                            />
                          </div>
                          <Button variant="outline" size="sm">
                            Mettre à jour
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label htmlFor="model" className="text-sm font-medium block mb-1">Modèle d'IA</label>
                            <select id="model" className="input-field w-full max-w-lg">
                              <option>gpt-4o-mini</option>
                              <option>gpt-4o</option>
                              <option>gpt-4-turbo</option>
                            </select>
                          </div>
                          <Button variant="outline" size="sm">
                            Mettre à jour
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-3">Limites d'utilisation</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label htmlFor="cv-limit" className="text-sm font-medium block mb-1">Limite mensuelle de CV</label>
                            <input
                              id="cv-limit"
                              type="number"
                              className="input-field w-full max-w-lg"
                              defaultValue="500"
                            />
                          </div>
                          <Button variant="outline" size="sm">
                            Mettre à jour
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label htmlFor="user-limit" className="text-sm font-medium block mb-1">Limite d'utilisateurs par entreprise</label>
                            <input
                              id="user-limit"
                              type="number"
                              className="input-field w-full max-w-lg"
                              defaultValue="10"
                            />
                          </div>
                          <Button variant="outline" size="sm">
                            Mettre à jour
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-3">Notification par email</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="email-new-user" className="h-4 w-4" defaultChecked />
                            <label htmlFor="email-new-user" className="text-sm">Nouvel utilisateur en attente</label>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="email-limit" className="h-4 w-4" defaultChecked />
                            <label htmlFor="email-limit" className="text-sm">Limite d'utilisation atteinte</label>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="email-error" className="h-4 w-4" defaultChecked />
                            <label htmlFor="email-error" className="text-sm">Erreurs système</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end space-x-2 border-t border-border/20 pt-4">
                    <Button variant="outline">Annuler</Button>
                    <Button className="bg-navy text-sand hover:bg-navy/90">
                      Enregistrer les modifications
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Activité système</CardTitle>
                    <CardDescription>
                      Journal des événements système récents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {systemActivitiesData.map((activity) => (
                        <div key={activity.id} className="flex gap-3">
                          <div className="mt-0.5">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              {activity.icon}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground mb-1">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="justify-center border-t border-border/20 pt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      Voir tout l'historique
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* System Tab (Placeholder) */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>Statut du système</CardTitle>
                <CardDescription>
                  Paramètres avancés et informations système
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Cette section est en cours de développement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Companies Tab (Placeholder) */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des entreprises</CardTitle>
                <CardDescription>
                  Ajoutez, modifiez ou supprimez des entreprises
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Cette section est en cours de développement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
