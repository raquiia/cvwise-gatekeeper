
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, Grid3X3, Kanban, BarChart3 } from 'lucide-react';

interface ViewSelectorProps {
  currentView: 'table' | 'cards' | 'kanban' | 'analytics';
  onViewChange: (view: 'table' | 'cards' | 'kanban' | 'analytics') => void;
}

const ViewSelector: React.FC<ViewSelectorProps> = ({ currentView, onViewChange }) => {
  const views = [
    { key: 'table', label: 'Tableau', icon: Table },
    { key: 'cards', label: 'Cartes', icon: Grid3X3 },
    { key: 'kanban', label: 'Kanban', icon: Kanban },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="flex items-center gap-1 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm rounded-lg p-1 border border-purple-200/30 dark:border-purple-800/20">
      {views.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          variant={currentView === key ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(key as any)}
          className={`h-8 px-3 text-xs ${
            currentView === key 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
          }`}
        >
          <Icon size={14} className="mr-1" />
          {label}
        </Button>
      ))}
    </div>
  );
};

export default ViewSelector;
