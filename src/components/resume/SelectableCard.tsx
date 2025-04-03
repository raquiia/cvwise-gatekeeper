
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface SelectableCardProps {
  children: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}

const SelectableCard: React.FC<SelectableCardProps> = ({ 
  children, 
  selected, 
  onSelect,
  className
}) => {
  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden transition-all",
        selected 
          ? "ring-2 ring-navy shadow-md dark:shadow-dark-sm transform -translate-y-1" 
          : "hover:shadow-sm hover:-translate-y-0.5",
        className
      )}
      onClick={onSelect}
    >
      {selected && (
        <div className="absolute top-0 left-0 w-full h-1 bg-navy"></div>
      )}
      {children}
    </div>
  );
};

export default SelectableCard;
