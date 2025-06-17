
import React, { useState, useEffect } from 'react';
import { 
  Users, Settings, Shield, RefreshCw, 
  UserCheck, AlertTriangle, Info as InfoIcon, UserPlus, Clock
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
import { formatDate } from '@/utils/dateFormatter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useRecruiterPerformance } from '@/hooks/useRecruiterPerformance';
import ConfirmClaireButton from '@/components/admin/ConfirmClaireButton';

// Admin components
import PendingUsersList from '@/components/admin/PendingUsersList';
import ExampleUsersList from '@/components/admin/ExampleUsersList';
import RecruiterActivityStats from '@/components/admin/RecruiterActivityStats';
import RecruiterPerformanceTable from '@/components/admin/RecruiterPerformanceTable';
import SystemActivities from '@/components/admin/SystemActivities';
import AppSettings from '@/components/admin/AppSettings';
import UserManagement from '@/components/admin/UserManagement';

// Mock data pour les activités système
const systemActivitiesData = [
  {
    id: 1,
    action: 'Mise à jour du système',
    description: 'Mise à jour des modèles d\'IA pour l\'analyse des CV',
    timestamp: '26/07/2023 08:00',
    icon: <RefreshCw size={16} className="text-blue-500 dark:text-blue-400" />
  },
  {
    id: 2,
    action: 'Nouvel utilisateur validé',
    description: 'L\'administrateur a validé l\'inscription de Jean Dupont',
    timestamp: '25/07/2023 15:32',
    icon: <UserCheck size={16} className="text-emerald-500 dark:text-emerald-400" />
  },
  {
    id: 3,
    action: 'Limite d\'utilisation atteinte',
    description: 'TechConsult SA a atteint 80% de sa limite mensuelle d\'analyses de CV',
    timestamp: '25/07/2023 10:15',
    icon: <AlertTriangle size={16} className="text-amber-500 dark:text-amber-400" />
  },
  {
    id: 4,
    action: 'Nouveau candidat',
    description: 'Un nouveau candidat "Pierre Martin" a été ajouté au système',
    timestamp: '24/07/2023 14:20',
    icon: <UserCheck size={16} className="text-purple-500 dark:text-purple-400" />
  },
  {
    id: 5,
    action: 'Tentative de connexion échouée',
    description: 'Plusieurs tentatives de connexion échouées pour l\'utilisateur marc.dupont@example.com',
    timestamp: '24/07/2023 09:45',
    icon: <Shield size={16} className="text-red-500 dark:text-red-400" />
  }
];

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { recruiters, stats, loading } = useRecruiterPerformance();

  // Redirection si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-dark mb-4">Administration</h1>
          <p className="text-muted-foreground mb-2">
            Tableau de bord administratif pour le suivi des performances de recrutement.
          </p>
          
          {/* Bouton de confirmation pour Claire Laurent - conditionnel */}
          <div className="mt-4">
            <ConfirmClaireButton />
          </div>
        </div>

        {/* Interface principale d'administration */}
        <Tabs defaultValue="performance" className="mb-8">
          <TabsList className="mb-6 bg-background/80 dark:bg-muted/10 w-full flex overflow-x-auto">
            <TabsTrigger 
              value="performance" 
              className="flex-shrink-0 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-navy/50"
            >
              <Users size={16} />
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="pending-users" 
              className="flex-shrink-0 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-navy/50"
            >
              <Clock size={16} />
              Demandes en attente
            </TabsTrigger>
            <TabsTrigger 
              value="create-user" 
              className="flex-shrink-0 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-navy/50"
            >
              <UserPlus size={16} />
              Créer un utilisateur
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex-shrink-0 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-navy/50"
            >
              <Settings size={16} />
              Paramètres
            </TabsTrigger>
            <TabsTrigger 
              value="system" 
              className="flex-shrink-0 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-navy/50"
            >
              <Shield size={16} />
              Système
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <RecruiterActivityStats 
                  totalRecruiters={stats.totalRecruiters}
                  totalCandidates={stats.totalCandidates}
                  candidatesInMission={stats.candidatesInMission}
                  recentActivity={stats.recentActivity}
                  averageConversionRate={stats.averageConversionRate}
                  totalRevenuePotential={stats.totalRevenuePotential}
                />
              </div>
              
              <div className="md:col-span-3">
                <RecruiterPerformanceTable 
                  recruiters={recruiters}
                  loading={loading}
                  formatDate={formatDate}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="pending-users" className="mt-4">
            <PendingUsersList />
          </TabsContent>
          
          <TabsContent value="create-user" className="mt-4">
            <div className="max-w-2xl mx-auto">
              <UserManagement />
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
            <Card className="dark:border-border/10">
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
