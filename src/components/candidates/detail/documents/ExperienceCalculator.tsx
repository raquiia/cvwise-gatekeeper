import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus } from 'lucide-react';
import { ExperienceBreakdown, ExperienceBreakdownItem } from '@/services/data/salaryCalculatorService';

interface ExperienceCalculatorProps {
  value: ExperienceBreakdown;
  onChange: (breakdown: ExperienceBreakdown) => void;
  totalExperience: number;
  onTotalChange: (total: number) => void;
}

export const ExperienceCalculator: React.FC<ExperienceCalculatorProps> = ({
  value,
  onChange,
  totalExperience,
  onTotalChange
}) => {
  const [items, setItems] = useState<ExperienceBreakdownItem[]>(
    value.length > 0 ? value : [{ years: 0, ratePerYear: 100, total: 0, description: '' }]
  );

  const calculateTotal = (newItems: ExperienceBreakdownItem[]) => {
    return newItems.reduce((sum, item) => sum + item.total, 0);
  };

  const updateItem = (index: number, field: keyof ExperienceBreakdownItem, newValue: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: newValue };

    // Recalcule le total si années ou taux change
    if (field === 'years' || field === 'ratePerYear') {
      newItems[index].total = newItems[index].years * newItems[index].ratePerYear;
    }

    setItems(newItems);
    
    const newTotal = calculateTotal(newItems);
    onChange(newItems);
    onTotalChange(newTotal);
  };

  const addItem = () => {
    const newItems = [...items, { years: 0, ratePerYear: 100, total: 0, description: '' }];
    setItems(newItems);
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      
      const newTotal = calculateTotal(newItems);
      onChange(newItems);
      onTotalChange(newTotal);
    }
  };

  const totalYears = items.reduce((sum, item) => sum + item.years, 0);
  const calculatedTotal = calculateTotal(items);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Calculateur d'expérience détaillé</CardTitle>
        <p className="text-sm text-muted-foreground">
          Valorisez chaque période d'expérience individuellement (50-150€/an recommandé)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
            <div className="col-span-2">
              <Label className="text-xs">Années</Label>
              <Input
                type="number"
                min="0"
                value={item.years || ''}
                onChange={(e) => updateItem(index, 'years', parseInt(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">€/an</Label>
              <Input
                type="number"
                min="0"
                max="200"
                value={item.ratePerYear || ''}
                onChange={(e) => updateItem(index, 'ratePerYear', parseInt(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Total</Label>
              <div className="h-8 px-3 py-1 bg-muted rounded-md text-sm font-medium">
                {item.total}€
              </div>
            </div>
            <div className="col-span-5">
              <Label className="text-xs">Description (optionnel)</Label>
              <Input
                placeholder="Ex: Expérience junior, senior..."
                value={item.description || ''}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                className="h-8"
              />
            </div>
            <div className="col-span-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center pt-2">
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une période
          </Button>
          
          <div className="text-right space-y-1">
            <div className="text-sm text-muted-foreground">
              Total années: {totalYears} ans
            </div>
            <div className="text-lg font-semibold">
              Total bonus: {calculatedTotal}€
            </div>
          </div>
        </div>

        {calculatedTotal < 50 && calculatedTotal > 0 && (
          <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            ⚠️ Le total est en dessous de la fourchette recommandée (50-150€)
          </div>
        )}
        
        {calculatedTotal > 150 && (
          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
            ⚠️ Le total dépasse la fourchette recommandée (50-150€)
          </div>
        )}
      </CardContent>
    </Card>
  );
};