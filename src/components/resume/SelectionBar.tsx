
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface SelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
}

const SelectionBar: React.FC<SelectionBarProps> = ({
  selectedCount,
  totalCount,
  onToggleSelectAll,
  isAllSelected
}) => {
  return (
    <div className="glass rounded-lg p-3 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Checkbox 
          checked={isAllSelected} 
          onCheckedChange={onToggleSelectAll}
          className="h-5 w-5"
        />
        <span className="text-sm font-medium">
          {selectedCount} sur {totalCount} CV sélectionnés
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onToggleSelectAll}
        >
          {isAllSelected ? "Désélectionner tout" : "Sélectionner tout"}
        </Button>
      </div>
    </div>
  );
};

export default SelectionBar;
