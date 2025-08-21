
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  const handleNotifications = () => {
    toast({
      title: "Notifications",
      description: "Panneau de notifications ouvert.",
    });
  };

  const handleSettings = () => {
    toast({
      title: "Paramètres",
      description: "Redirection vers les paramètres avancés.",
    });
  };

  const handleExportData = async () => {
    toast({
      title: "Export en cours",
      description: "Génération du fichier d'export...",
    });

    try {
      // Simuler l'export de données
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Créer un CSV fictif
      const csvData = [
        ['Nom', 'Email', 'Date inscription', 'Dernière connexion'],
        ['John Doe', 'john@example.com', '2024-01-15', '2024-08-20'],
        ['Jane Smith', 'jane@example.com', '2024-02-10', '2024-08-19'],
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-utilisateurs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export terminé",
        description: "Le fichier a été téléchargé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le fichier d'export.",
        variant: "destructive",
      });
    }
  };

  const handleMonthlyReport = async () => {
    toast({
      title: "Génération du rapport",
      description: "Création du rapport mensuel en cours...",
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simuler la génération d'un rapport PDF
      const reportData = `Rapport Mensuel - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
      
Statistiques:
- Recruteurs actifs: ${activeUsersCount}
- CVs traités: ${totalCVsThisMonth}
- Candidats en mission: ${totalCandidatesInMission}
- Taux de conversion: ${globalConversionRate}%
- Utilisateurs en attente: ${pendingUsersCount}

Rapport généré le ${new Date().toLocaleDateString('fr-FR')}`;

      const blob = new Blob([reportData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-mensuel-${new Date().toISOString().slice(0, 7)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Rapport généré",
        description: "Le rapport mensuel a été téléchargé.",
      });
    } catch (error) {
      toast({
        title: "Erreur de génération",
        description: "Impossible de créer le rapport mensuel.",
        variant: "destructive",
      });
    }
  };
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
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleNotifications}
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleSettings}
            >
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
          <Button 
            variant="outline" 
            className="border-white/20 text-white hover:bg-white/10"
            onClick={handleExportData}
          >
            Exporter données
          </Button>
          <Button 
            variant="outline" 
            className="border-white/20 text-white hover:bg-white/10"
            onClick={handleMonthlyReport}
          >
            Rapport mensuel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHeader;
