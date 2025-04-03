
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
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
        selected ? "ring-2 ring-navy shadow-md dark:shadow-dark-sm" : "hover:shadow-sm",
        className
      )}
      onClick={onSelect}
    >
      <div 
        className={cn(
          "absolute top-3 right-3 z-10 w-6 h-6 rounded-md flex items-center justify-center transition-colors",
          selected 
            ? "bg-navy text-white" 
            : "bg-background border-2 border-navy/30 text-transparent"
        )}
      >
        <Check size={16} className={selected ? "opacity-100" : "opacity-0"} />
      </div>
      {children}
    </div>
  );
};

export default SelectableCard;
