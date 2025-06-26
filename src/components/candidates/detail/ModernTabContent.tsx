
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';

interface ModernTabContentProps {
  value: string;
  children: React.ReactNode;
  gradient?: string;
}

const ModernTabContent: React.FC<ModernTabContentProps> = ({
  value,
  children,
  gradient = 'from-blue-500/5 to-purple-500/5'
}) => {
  return (
    <TabsContent 
      value={value}
      className="relative rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm border border-border/30 shadow-lg animate-fade-in"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`}></div>
      <div className="relative">
        {children}
      </div>
    </TabsContent>
  );
};

export default ModernTabContent;
