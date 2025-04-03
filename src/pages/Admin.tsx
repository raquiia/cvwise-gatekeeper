
import React, { useState } from 'react';
import { 
  Users, Settings, Shield, Building, RefreshCw, 
  UserCheck, AlertTriangle
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { formatDate } from '@/utils/dateFormatter';

// Admin components
import PendingUsersList from '@/components/admin/PendingUsersList';
import ActiveUsersList from '@/components/admin/ActiveUsersList';
import ExampleUsersList from '@/components/admin/ExampleUsersList';
import UserStats from '@/components/admin/UserStats';
import SystemActivities from '@/components/admin/SystemActivities';
import AppSettings from '@/components/admin/AppSettings';

// Mock data
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

const Admin = () => {
  const [pendingUsers, setPendingUsers] = useState(pendingUsersData);
  const { user } = useAuth();
  const { realUsers, loading } = useUserData();
  
  const handleApproveUser = (userId: number) => {
    const userToApprove = pendingUsers.find(user => user.id === userId);
    if (userToApprove) {
      // In a real application, this would call an API to approve the user
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
    }
  };
  
  const handleRejectUser = (userId: number) => {
    // In a real application, this would call an API to reject the user
    setPendingUsers(prev => prev.filter(user => user.id !== userId));
  };
  
  const recentUsers = realUsers.slice()
    .sort((a, b) => {
      const dateA = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
      const dateB = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      return dateB - dateA;
    })
    .map(user => ({
      first_name: user.profile?.first_name || user.first_name || '',
      last_name: user.profile?.last_name || user.last_name || '',
      last_sign_in_at: user.last_sign_in_at
    }));
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-dark mb-2">Administration</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs, les paramètres système et contrôlez l'accès à l'application
          </p>
        </div>
        
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
          
          <TabsContent value="users">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <UserStats 
                  activeUsersCount={realUsers.length}
                  pendingUsersCount={pendingUsers.length}
                  recentUsers={recentUsers}
                  formatDate={formatDate}
                />
              </div>
              
              <div className="md:col-span-3 space-y-6">
                <PendingUsersList 
                  pendingUsers={pendingUsers}
                  onApproveUser={handleApproveUser}
                  onRejectUser={handleRejectUser}
                />
                
                <ActiveUsersList 
                  users={realUsers}
                  loading={loading}
                  currentUserId={user?.id}
                  formatDate={formatDate}
                />
                
                <ExampleUsersList users={activeUsersData} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <AppSettings />
              </div>
              
              <div>
                <SystemActivities activities={systemActivitiesData} />
              </div>
            </div>
          </TabsContent>
          
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
