
import React, { useState } from 'react';
import { Search, Bell, Plus, Zap, TrendingUp, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
}

interface DashboardHeaderProps {
  onSearch: (query: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const quickActions: QuickAction[] = [
    { icon: Plus, label: 'Importer CV', href: '/resumes/upload', color: 'bg-blue-500' },
    { icon: Users, label: 'Nouveau candidat', href: '/candidates', color: 'bg-green-500' },
    { icon: FileText, label: 'Créer offre', href: '/job-offers/create', color: 'bg-purple-500' },
    { icon: Zap, label: 'IA Matching', href: '/candidates?view=analytics', color: 'bg-orange-500' },
  ];

  const notifications = [
    { type: 'cv', message: '3 nouveaux CVs analysés', time: '5 min', urgent: true },
    { type: 'match', message: 'Candidat parfait trouvé pour "Dev React"', time: '12 min', urgent: false },
    { type: 'system', message: 'Analyse IA terminée', time: '1h', urgent: false },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative z-10 mb-8">
      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-white/70 dark:bg-navy-dark/70 backdrop-blur-xl rounded-2xl border border-purple-200/30 dark:border-purple-800/20 shadow-2xl">
        
        {/* Left: Welcome & Search */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Tableau de bord intelligent
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Optimisé par l'Intelligence Artificielle
            </p>
          </div>
          
          {/* Universal Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Recherche universelle... (candidats, CVs, offres)"
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-navy-dark/80 border border-purple-200/50 dark:border-purple-800/30 rounded-xl focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-200"
            />
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-navy-dark/95 backdrop-blur-xl border border-purple-200/30 rounded-xl shadow-xl p-2 z-50">
                <div className="text-sm text-muted-foreground p-2">
                  Recherche en cours pour "{searchQuery}"...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Notifications & Quick Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative bg-white/50 dark:bg-navy-dark/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-purple-200/30"
            >
              <Bell className="w-5 h-5" />
              {notifications.some(n => n.urgent) && (
                <Badge className="absolute -top-1 -right-1 w-3 h-3 p-0 bg-red-500 text-xs">
                  {notifications.filter(n => n.urgent).length}
                </Badge>
              )}
            </Button>
            
            {showNotifications && (
              <Card className="absolute top-full right-0 mt-2 w-80 bg-white/95 dark:bg-navy-dark/95 backdrop-blur-xl border-purple-200/30 shadow-xl z-50">
                <div className="p-4">
                  <h3 className="font-semibold mb-3">Notifications</h3>
                  <div className="space-y-2">
                    {notifications.map((notif, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${notif.urgent ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30' : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50'}`}>
                        <p className="text-sm">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">Il y a {notif.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} to={action.href}>
                  <Button
                    size="sm"
                    className={`${action.color} hover:scale-105 transition-transform duration-200 text-white border-0 shadow-lg`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
