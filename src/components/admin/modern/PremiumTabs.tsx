
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Users, 
  TrendingUp, 
  Settings, 
  Bell 
} from 'lucide-react';

interface PremiumTabsProps {
  defaultValue: string;
  pendingUsersCount: number;
  children: React.ReactNode;
}

const PremiumTabs: React.FC<PremiumTabsProps> = ({ 
  defaultValue, 
  pendingUsersCount, 
  children 
}) => {
  const tabs = [
    {
      value: "create-user",
      label: "Ajouter un recruteur",
      icon: UserPlus,
      description: "Nouveau membre"
    },
    {
      value: "users",
      label: "Équipe de recrutement",
      icon: Users,
      description: "Gestion équipe",
      badge: pendingUsersCount > 0 ? pendingUsersCount : undefined
    },
    {
      value: "analytics",
      label: "KPI Recruteurs",
      icon: TrendingUp,
      description: "Performance"
    },
    {
      value: "settings",
      label: "Paramètres",
      icon: Settings,
      description: "Configuration"
    }
  ];

  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      <div className="mb-8">
        <TabsList className="grid w-full grid-cols-4 h-auto p-2 bg-white/80 dark:bg-navy-dark/80 backdrop-blur-xl border border-navy/10 rounded-2xl shadow-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center gap-2 p-4 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-navy/50 data-[state=active]:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center gap-2 relative">
                  <div className="p-2 rounded-lg bg-navy/10 dark:bg-white/10 group-data-[state=active]:bg-navy/20 dark:group-data-[state=active]:bg-white/20 transition-colors">
                    <Icon className="w-5 h-5 text-navy dark:text-white" />
                  </div>
                  {tab.badge && (
                    <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                      {tab.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm text-navy dark:text-white">
                    {tab.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {tab.description}
                  </div>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      
      {children}
    </Tabs>
  );
};

export default PremiumTabs;
