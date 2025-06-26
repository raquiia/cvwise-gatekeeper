import React, { useState, useEffect } from 'react';
import { 
  Users, Settings, Shield, Building, RefreshCw, 
  UserCheck, AlertTriangle, Info as InfoIcon, UserPlus, TrendingUp
} from 'lucide-react';
import Layout from '@/components/Layout';
import { TabsContent } from '@/components/ui/tabs';
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
import { recruitmentAnalyticsService, GlobalRecruitmentStats, RecruiterKPI } from '@/services/analytics/recruitmentAnalyticsService';

// Import des nouveaux composants modernes
import AdminDashboardHeader from '@/components/admin/modern/AdminDashboardHeader';
import PremiumTabs from '@/components/admin/modern/PremiumTabs';
import ModernUserTable from '@/components/admin/modern/ModernUserTable';

// Import des composants existants
import PendingUsersList from '@/components/admin/PendingUsersList';
import UserStats from '@/components/admin/UserStats';
import SystemActivities from '@/components/admin/SystemActivities';
import AppSettings from '@/components/admin/AppSettings';
import UserManagement from '@/components/admin/UserManagement';
import RecruitmentUserStats from '@/components/admin/RecruitmentUserStats';
import RecruiterOverviewCard from '@/components/admin/RecruiterOverviewCard';
import RecruiterDetailedKPI from '@/components/admin/RecruiterDetailedKPI';

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
  const [recruiterKPIs, setRecruiterKPIs] = useState<RecruiterKPI[]>([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState<{id: string, name: string, email: string} | null>(null);
  const [selectedRecruiterKPI, setSelectedRecruiterKPI] = useState<RecruiterKPI | null>(null);
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

  // Load recruiter KPIs
  useEffect(() => {
    const loadRecruiterKPIs = async () => {
      try {
        const kpis = await recruitmentAnalyticsService.getAllRecruitersKPIs('current_month');
        setRecruiterKPIs(kpis);
      } catch (error) {
        console.error('Error loading recruiter KPIs:', error);
      }
    };

    loadRecruiterKPIs();
  }, []);

  const handleApproveUser = async (userId: string) => {
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
  
  const handleRejectUser = async (userId: string) => {
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
  
  const handleRecruiterClick = async (recruiter: {id: string, name: string, email: string}) => {
    try {
      const kpi = await recruitmentAnalyticsService.getRecruiterKPIs(recruiter.id, 'current_month');
      setSelectedRecruiter(recruiter);
      setSelectedRecruiterKPI(kpi);
    } catch (error) {
      console.error('Error loading recruiter detailed KPI:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les KPI du recruteur",
        variant: "destructive",
      });
    }
  };

  const handleBackToOverview = () => {
    setSelectedRecruiter(null);
    setSelectedRecruiterKPI(null);
  };

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="space-y-8">
        {/* Header Premium */}
        <AdminDashboardHeader 
          activeUsersCount={realUsers.length}
          totalCVsThisMonth={recruitmentStats?.totalCVsThisMonth || 0}
          totalCandidatesInMission={recruitmentStats?.totalCandidatesInMission || 0}
          globalConversionRate={recruitmentStats?.globalConversionRate || 0}
          pendingUsersCount={pendingUsers.length}
        />

        {/* Contenu principal */}
        <div className="container mx-auto px-4 pb-8">
          <PremiumTabs 
            defaultValue="create-user" 
            pendingUsersCount={pendingUsers.length}
          >
            <TabsContent value="create-user" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <UserManagement />
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="mt-6">
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
                  
                  <ModernUserTable
                    users={realUsers}
                    loading={usersDataLoading}
                    currentUserId={user?.id}
                    formatDate={formatDate}
                    title="Équipe de Recrutement Active"
                    emptyMessage="Aucun recruteur trouvé"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-6">
                {selectedRecruiter && selectedRecruiterKPI ? (
                  <RecruiterDetailedKPI
                    recruiter={selectedRecruiter}
                    kpi={selectedRecruiterKPI}
                    onBack={handleBackToOverview}
                  />
                ) : (
                  <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-navy/10 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        Vue globale des recruteurs
                      </CardTitle>
                      <CardDescription>
                        Cliquez sur un recruteur pour voir ses KPI détaillés
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {realUsers.map(user => {
                          const recruiterKPI = recruiterKPIs.find(kpi => kpi.recruiterId === user.id);
                          const recruiterInfo = {
                            id: user.id,
                            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Recruteur',
                            email: user.email || '',
                          };

                          return (
                            <RecruiterOverviewCard
                              key={user.id}
                              recruiter={recruiterInfo}
                              kpi={recruiterKPI || null}
                              onClick={() => handleRecruiterClick(recruiterInfo)}
                            />
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <AppSettings />
                </div>
                
                <div>
                  <SystemActivities activities={systemActivitiesData} />
                </div>
              </div>
            </TabsContent>
          </PremiumTabs>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
