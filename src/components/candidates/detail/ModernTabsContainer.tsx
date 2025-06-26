
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Brain, 
  Briefcase, 
  GraduationCap, 
  StickyNote, 
  FileText,
  Sparkles
} from 'lucide-react';

interface ModernTabsContainerProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

const ModernTabsContainer: React.FC<ModernTabsContainerProps> = ({
  activeTab,
  onTabChange,
  children
}) => {
  const tabs = [
    {
      value: 'profile',
      label: 'Profil',
      icon: User,
      gradient: 'from-blue-600 to-purple-600'
    },
    {
      value: 'ai-analysis',
      label: 'Analyse IA',
      icon: Brain,
      gradient: 'from-purple-600 to-pink-600'
    },
    {
      value: 'experience',
      label: 'Expérience',
      icon: Briefcase,
      gradient: 'from-green-600 to-teal-600'
    },
    {
      value: 'education',
      label: 'Formation',
      icon: GraduationCap,
      gradient: 'from-orange-600 to-red-600'
    },
    {
      value: 'notes',
      label: 'Notes',
      icon: StickyNote,
      gradient: 'from-yellow-600 to-orange-600'
    },
    {
      value: 'details',
      label: 'Détails',
      icon: FileText,
      gradient: 'from-gray-600 to-slate-600'
    }
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="relative mb-8">
        <TabsList className="w-full bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-border/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          
          <div className="relative flex w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              
              return (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className={`
                    flex-1 flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105` 
                      : 'text-foreground hover:bg-accent/50 hover:scale-102'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                  <span className="font-medium text-sm">{tab.label}</span>
                  {isActive && (
                    <Sparkles className="w-3 h-3 ml-1 animate-pulse" />
                  )}
                </TabsTrigger>
              );
            })}
          </div>
        </TabsList>
      </div>
      
      {children}
    </Tabs>
  );
};

export default ModernTabsContainer;
