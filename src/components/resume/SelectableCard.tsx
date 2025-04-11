
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface SelectableCardProps {
  children: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const SelectableCard: React.FC<SelectableCardProps> = ({ 
  children, 
  selected, 
  onSelect,
  className,
  style
}) => {
  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden transition-all duration-300 animate-fade-in group",
        selected 
          ? "ring-2 ring-navy shadow-lg dark:shadow-dark-sm transform -translate-y-1" 
          : "hover:shadow-md hover:-translate-y-1",
        className
      )}
      onClick={onSelect}
      style={style}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-navy rounded-full flex items-center justify-center z-10">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
      {selected && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-navy via-blue-500 to-navy"></div>
      )}
      {children}
    </div>
  );
};

export default SelectableCard;
