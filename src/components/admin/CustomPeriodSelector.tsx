
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { format } from 'date-fns';

interface CustomPeriodSelectorProps {
  onPeriodChange: (period: { type: 'preset' | 'custom', value: string, startDate?: Date, endDate?: Date }) => void;
  currentPeriod: string;
  customStartDate?: Date;
  customEndDate?: Date;
}

const CustomPeriodSelector: React.FC<CustomPeriodSelectorProps> = ({
  onPeriodChange,
  currentPeriod,
  customStartDate,
  customEndDate
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(customStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(customEndDate);
  const [showCustomSelector, setShowCustomSelector] = useState(false);

  const presetPeriods = [
    { value: 'current_month', label: 'Ce mois' },
    { value: 'last_month', label: 'Mois dernier' },
    { value: 'quarter', label: 'Ce trimestre' }
  ];

  const handlePresetSelect = (value: string) => {
    onPeriodChange({ type: 'preset', value });
    setShowCustomSelector(false);
  };

  const handleCustomPeriodApply = () => {
    if (startDate && endDate) {
      onPeriodChange({ 
        type: 'custom', 
        value: 'custom',
        startDate,
        endDate
      });
      setShowCustomSelector(false);
    }
  };

  const isCustomPeriod = currentPeriod === 'custom';

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5" />
          Période d'analyse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Preset periods */}
          <div className="flex flex-wrap gap-2">
            {presetPeriods.map((period) => (
              <Badge
                key={period.value}
                variant={currentPeriod === period.value ? "default" : "outline"}
                className={`cursor-pointer hover:bg-primary/10 ${
                  currentPeriod === period.value ? 'bg-primary text-white' : ''
                }`}
                onClick={() => handlePresetSelect(period.value)}
              >
                {currentPeriod === period.value && <Check className="w-3 h-3 mr-1" />}
                {period.label}
              </Badge>
            ))}
            <Badge
              variant={isCustomPeriod ? "default" : "outline"}
              className={`cursor-pointer hover:bg-primary/10 ${
                isCustomPeriod ? 'bg-primary text-white' : ''
              }`}
              onClick={() => setShowCustomSelector(!showCustomSelector)}
            >
              {isCustomPeriod && <Check className="w-3 h-3 mr-1" />}
              Période personnalisée
            </Badge>
          </div>

          {/* Current period display */}
          {isCustomPeriod && customStartDate && customEndDate && (
            <div className="text-sm text-muted-foreground">
              Période actuelle : {format(customStartDate, 'dd/MM/yyyy')} - {format(customEndDate, 'dd/MM/yyyy')}
            </div>
          )}

          {/* Custom period selector */}
          {showCustomSelector && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date de début</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'dd/MM/yyyy') : 'Sélectionner...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Date de fin</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'dd/MM/yyyy') : 'Sélectionner...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => startDate && date < startDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomSelector(false)}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleCustomPeriodApply}
                  disabled={!startDate || !endDate}
                >
                  Appliquer
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomPeriodSelector;
