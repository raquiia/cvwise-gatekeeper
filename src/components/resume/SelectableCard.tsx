
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

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
        selected ? "ring-2 ring-navy" : "",
        className
      )}
    >
      <div className="absolute top-3 left-3 z-10">
        <Checkbox 
          checked={selected} 
          onCheckedChange={onSelect}
          className="h-5 w-5 border-2" 
        />
      </div>
      {children}
    </div>
  );
};

export default SelectableCard;
