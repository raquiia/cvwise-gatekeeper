
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Users, 
  Shield, 
  UserCheck, 
  Plus,
  Bell,
  Settings,
  ChevronRight
} from 'lucide-react';

interface AdminDashboardHeaderProps {
  activeUsersCount: number;
  totalCVsThisMonth: number;
  totalCandidatesInMission: number;
  globalConversionRate: number;
  pendingUsersCount: number;
}

const AdminDashboardHeader: React.FC<AdminDashboardHeaderProps> = ({
  activeUsersCount,
  totalCVsThisMonth,
  totalCandidatesInMission,
  globalConversionRate,
  pendingUsersCount
}) => {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-dark to-purple-900 opacity-95" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-gold/5 to-transparent" />
      
      <div className="relative z-10 p-8">
        {/* Breadcrumb et actions rapides */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-white/80">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Administration</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-sm font-medium text-white">Dashboard ATS</span>
          </div>
          
          <div className="flex items-center gap-3">
            {pendingUsersCount > 0 && (
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-400/30">
                {pendingUsersCount} en attente
              </Badge>
            )}
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
          </div>
        </div>

        {/* Titre principal */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Centre de Pilotage RH
          </h1>
          <p className="text-white/70 text-lg">
            Gérez votre équipe de recrutement avec des insights en temps réel
          </p>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Recruteurs actifs */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm font-medium">Recruteurs</p>
                    <p className="text-white text-2xl font-bold">{activeUsersCount}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12%</span>
                  </div>
                  <p className="text-white/50 text-xs">vs mois passé</p>
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </CardContent>
          </Card>

          {/* CVs ce mois */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-500/20 text-green-300">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm font-medium">CVs ce mois</p>
                    <p className="text-white text-2xl font-bold">{totalCVsThisMonth}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>+24%</span>
                  </div>
                  <p className="text-white/50 text-xs">vs mois passé</p>
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </CardContent>
          </Card>

          {/* En mission */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm font-medium">En mission</p>
                    <p className="text-white text-2xl font-bold">{totalCandidatesInMission}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>+8%</span>
                  </div>
                  <p className="text-white/50 text-xs">vs mois passé</p>
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-purple-400 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </CardContent>
          </Card>

          {/* Taux conversion */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gold/20 text-gold-light">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm font-medium">Taux conversion</p>
                    <p className="text-white text-2xl font-bold">{globalConversionRate}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>+3%</span>
                  </div>
                  <p className="text-white/50 text-xs">vs mois passé</p>
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gold h-2 rounded-full" style={{ width: `${globalConversionRate}%` }}></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau recruteur
          </Button>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Exporter données
          </Button>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Rapport mensuel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHeader;
