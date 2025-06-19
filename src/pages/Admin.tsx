import React, { useState, useEffect } from 'react';
import { 
  Users, Settings, Shield, Building, RefreshCw, 
  UserCheck, AlertTriangle, Info as InfoIcon, UserPlus, TrendingUp
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
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { recruitmentAnalyticsService, GlobalRecruitmentStats } from '@/services/analytics/recruitmentAnalyticsService';

// Admin components
import PendingUsersList from '@/components/admin/PendingUsersList';
import ActiveUsersList from '@/components/admin/ActiveUsersList';
import ExampleUsersList from '@/components/admin/ExampleUsersList';
import UserStats from '@/components/admin/UserStats';
import SystemActivities from '@/components/admin/SystemActivities';
import AppSettings from '@/components/admin/AppSettings';
import UserManagement from '@/components/admin/UserManagement';
import RecruitmentUserStats from '@/components/admin/RecruitmentUserStats';
import RecruiterKPICard from '@/components/admin/RecruiterKPICard';

// Mock data pour les utilisateurs en attente
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
  }
];

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
  }
];

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [recruitmentStats, setRecruitmentStats] = useState<GlobalRecruitmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { realUsers, loading: usersDataLoading } = useUserData();

  // Redirection si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  // Charger les vraies données de demandes en attente
  useEffect(() => {
    const loadPendingRegistrations = async () => {
      try {
        const { data, error } = await supabase
          .from('pending_registrations')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error loading pending registrations:', error);
        } else {
          // Mapper les données pour correspondre au format attendu par PendingUsersList
          const mappedData = data?.map(reg => ({
            id: reg.id,
            name: `${reg.first_name} ${reg.last_name}`,
            email: reg.email,
            company: reg.company || 'Non spécifiée',
            role: 'Recruteur',
            registrationDate: formatDate(reg.created_at),
            avatar: null
          })) || [];
          
          setPendingUsers(mappedData);
        }
      } catch (error) {
        console.error('Error loading pending registrations:', error);
      }
    };

    loadPendingRegistrations();
  }, []);

  // Charger les stats de recrutement
  useEffect(() => {
    const loadRecruitmentStats = async () => {
      try {
        const stats = await recruitmentAnalyticsService.getGlobalStats();
        setRecruitmentStats(stats);
      } catch (error) {
        console.error('Error loading recruitment stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecruitmentStats();
  }, []);

  const handleApproveUser = async (userId: number) => {
    try {
      // Mettre à jour le statut dans la base de données
      const { error } = await supabase
        .from('pending_registrations')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'approuver l'utilisateur",
          variant: "destructive",
        });
        return;
      }

      // Retirer de la liste locale
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "Utilisateur approuvé",
        description: "L'utilisateur a été approuvé avec succès",
      });
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  };
  
  const handleRejectUser = async (userId: number) => {
    try {
      // Mettre à jour le statut dans la base de données
      const { error } = await supabase
        .from('pending_registrations')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de rejeter l'utilisateur",
          variant: "destructive",
        });
        return;
      }

      // Retirer de la liste locale
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "Utilisateur rejeté",
        description: "L'utilisateur a été rejeté",
      });
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      });
    }
  };
  
  // Extraction du nombre d'entreprises uniques
  const uniqueCompanies = new Set(
    realUsers
      .filter(user => user.profile?.company || user.company)
      .map(user => user.profile?.company || user.company)
  );
  
  const companiesCount = uniqueCompanies.size;
  
  const recentUsers = realUsers.slice()
    .sort((a, b) => {
      const dateA = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
      const dateB = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      return dateB - dateA;
    })
    .map(user => ({
      id: user.id,
      email: user.email || '',
      first_name: user.profile?.first_name || user.first_name || '',
      last_name: user.profile?.last_name || user.last_name || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    }));
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-dark mb-4">Administration ATS</h1>
          <p className="text-muted-foreground mb-2">
            Gérez votre équipe de recrutement et suivez les performances.
          </p>
        </div>

        {/* Métriques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recruteurs actifs</p>
                  <p className="text-2xl font-bold">{realUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CVs ce mois</p>
                  <p className="text-2xl font-bold">{recruitmentStats?.totalCVsThisMonth || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En mission</p>
                  <p className="text-2xl font-bold">{recruitmentStats?.totalCandidatesInMission || 0}</p>
                </div>
                <UserCheck className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taux conversion</p>
                  <p className="text-2xl font-bold">{recruitmentStats?.globalConversionRate || 0}%</p>
                </div>
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interface principale d'administration */}
        <Tabs defaultValue="create-user" className="mb-8">
          <TabsList className="mb-6 bg-background/80 dark:bg-muted/10 w-full flex overflow-x-auto">
            <TabsTrigger 
              value="create-user" 
              className="flex-shrink-0 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-navy/50"
            >
              <UserPlus size={16} />
              Ajouter un recruteur
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex-shrink-0 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-navy/50"
            >
              <Users size={16} />
              Équipe de recrutement
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex-shrink-0 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-navy/50"
            >
              <TrendingUp size={16} />
              KPI Recruteurs
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex-shrink-0 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-navy/50"
            >
              <Settings size={16} />
              Paramètres
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create-user" className="mt-4">
            <div className="max-w-2xl mx-auto">
              <UserManagement />
            </div>
          </TabsContent>
          
          <TabsContent value="users">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <RecruitmentUserStats 
                  activeUsersCount={realUsers.length}
                  pendingUsersCount={pendingUsers.length}
                  recentUsers={recentUsers}
                  formatDate={formatDate}
                  totalRecruiterCVs={recruitmentStats?.totalCVsThisMonth || 0}
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
                  loading={usersDataLoading}
                  currentUserId={user?.id}
                  formatDate={formatDate}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="space-y-6">
              <Card className="dark:border-border/10">
                <CardHeader>
                  <CardTitle>KPI par recruteur</CardTitle>
                  <CardDescription>
                    Performance individuelle de chaque membre de l'équipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {realUsers.map(user => (
                      <RecruiterKPICard
                        key={user.id}
                        kpi={{
                          recruiterId: user.id,
                          recruiterName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Recruteur',
                          recruiterEmail: user.email || '',
                          totalCVs: 0, // À calculer dynamiquement
                          candidatesInPrequalification: 0,
                          candidatesInEC1: 0,
                          candidatesInEC2: 0,
                          candidatesInPresentation: 0,
                          candidatesInMission: 0,
                          conversionPrequalToEC1: 0,
                          conversionEC1ToEC2: 0,
                          conversionEC2ToPresentation: 0,
                          conversionEC2ToMission: 0,
                          period: 'current_month'
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
