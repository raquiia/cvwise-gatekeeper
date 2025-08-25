import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Calculator, Save, Trash2, Info, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  salaryCalculatorService, 
  SalaryCalculation, 
  SALARY_CONFIG, 
  SalaryCalculationInput,
  ExperienceBreakdown 
} from '@/services/data/salaryCalculatorService';
import { toast } from '@/hooks/use-toast';
import { ExperienceCalculator } from './ExperienceCalculator';

interface SalaryCalculatorProps {
  candidateId: string;
  calculations: SalaryCalculation[];
  onCalculationSaved: () => void;
}

export const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({
  candidateId,
  calculations,
  onCalculationSaved
}) => {
  const [calculation, setCalculation] = useState<Omit<SalaryCalculationInput, 'candidateId'>>({
    baseCity: 'Paris',
    categoryGroup: 'Groupe 4 (base ingé)',
    msBonus: 0,
    experienceBonus: 0,
    experienceBreakdown: [],
    stageBonus: 0,
    adequationBonus: 0
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [showExperienceCalculator, setShowExperienceCalculator] = useState(false);

  const handleInputChange = (field: keyof typeof calculation, value: string | number) => {
    setCalculation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExperienceBreakdownChange = (breakdown: ExperienceBreakdown) => {
    setCalculation(prev => ({
      ...prev,
      experienceBreakdown: breakdown
    }));
  };

  const handleExperienceTotalChange = (total: number) => {
    setCalculation(prev => ({
      ...prev,
      experienceBonus: total
    }));
  };

  const handleCalculate = () => {
    const input: SalaryCalculationInput = {
      candidateId,
      ...calculation
    };
    
    return salaryCalculatorService.calculateSalary(input);
  };

  const handleSave = async () => {
    try {
      setIsCalculating(true);
      const input: SalaryCalculationInput = {
        candidateId,
        ...calculation
      };
      
      await salaryCalculatorService.saveCalculation(input);
      onCalculationSaved();
      toast({
        title: "Succès",
        description: "Calcul sauvegardé avec succès",
      });
    } catch (error) {
      console.error('Error saving calculation:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleDelete = async (calculationId: string) => {
    try {
      await salaryCalculatorService.deleteCalculation(calculationId);
      onCalculationSaved();
      toast({
        title: "Succès",
        description: "Calcul supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting calculation:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const currentCalculation = handleCalculate();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculateur de grille salariale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseCity">Ville de base</Label>
              <Select
                value={calculation.baseCity}
                onValueChange={(value) => handleInputChange('baseCity', value as keyof typeof SALARY_CONFIG.cities)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {salaryCalculatorService.getCityOptions().map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryGroup">Groupe de catégorie</Label>
              <Select
                value={calculation.categoryGroup}
                onValueChange={(value) => handleInputChange('categoryGroup', value as keyof typeof SALARY_CONFIG.groups)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {salaryCalculatorService.getGroupOptions().map(group => (
                    <SelectItem key={group} value={group}>
                      <div className="flex items-center justify-between w-full">
                        <span>{group}</span>
                        <Badge variant={salaryCalculatorService.getGroupModulation(group) >= 0 ? "default" : "destructive"} className="ml-2">
                          {salaryCalculatorService.getGroupModulation(group) > 0 ? '+' : ''}{salaryCalculatorService.getGroupModulation(group)}€
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="msBonus">MS (Bac+6) - Bonus (50-150€)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bonus pour Master Spécialisé (Bac+6)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="msBonus"
                type="number"
                min="50"
                max="150"
                value={calculation.msBonus}
                onChange={(e) => handleInputChange('msBonus', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="experienceBonus">Expériences - Valorisation flexible (50-150€)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Valorisation flexible selon l'expérience : 100€/an en général. 
                        Exemple : 2 ans à 50€ + 7 ans à 100€ + 1 an à 150€ = Total personnalisé</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExperienceCalculator(!showExperienceCalculator)}
                  className="text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Détailler
                </Button>
              </div>
              <Input
                id="experienceBonus"
                type="number"
                min="50"
                max="300"
                value={calculation.experienceBonus}
                onChange={(e) => handleInputChange('experienceBonus', parseInt(e.target.value) || 0)}
                placeholder="100€/an standard"
                disabled={showExperienceCalculator}
              />
              {calculation.experienceBreakdown && calculation.experienceBreakdown.length > 0 && !showExperienceCalculator && (
                <div className="text-xs text-muted-foreground">
                  Détail configuré: {calculation.experienceBreakdown.length} période(s)
                </div>
              )}
            </div>

            <Collapsible open={showExperienceCalculator} onOpenChange={setShowExperienceCalculator}>
              <CollapsibleContent className="col-span-2 mt-4">
                <ExperienceCalculator
                  value={calculation.experienceBreakdown || []}
                  onChange={handleExperienceBreakdownChange}
                  totalExperience={calculation.experienceBonus || 0}
                  onTotalChange={handleExperienceTotalChange}
                />
              </CollapsibleContent>
            </Collapsible>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="stageBonus">Valorisation stage MI-GSO (0-50€)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bonus pour stage MI-GSO validé</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="stageBonus"
                type="number"
                min="0"
                max="50"
                value={calculation.stageBonus}
                onChange={(e) => handleInputChange('stageBonus', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="adequationBonus">Adéquation Cursus/Métier (-50 à 50€)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bonus/malus selon l'adéquation entre le cursus et le métier visé</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="adequationBonus"
                type="number"
                min="-50"
                max="50"
                value={calculation.adequationBonus}
                onChange={(e) => handleInputChange('adequationBonus', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {/* Base et modulation groupe */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Base ville</div>
                <div className="text-xl font-bold">{currentCalculation.baseSalary}€</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Modulation groupe</div>
                <div className={`text-xl font-bold ${currentCalculation.groupModulation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {currentCalculation.groupModulation > 0 ? '+' : ''}{currentCalculation.groupModulation}€
                </div>
              </div>
            </div>

            {/* Détail des bonus */}
            <div className="border-t pt-4">
              <div className="text-sm font-medium text-muted-foreground mb-3 text-center">Détail des bonus</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">MS Bonus</div>
                  <div className={`text-lg font-semibold ${currentCalculation.msBonus > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {currentCalculation.msBonus > 0 ? '+' : ''}{currentCalculation.msBonus}€
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Expérience</div>
                  <div className={`text-lg font-semibold ${currentCalculation.experienceBonus > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {currentCalculation.experienceBonus > 0 ? '+' : ''}{currentCalculation.experienceBonus}€
                  </div>
                  {calculation.experienceBreakdown && calculation.experienceBreakdown.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {calculation.experienceBreakdown.length} période(s)
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Stage</div>
                  <div className={`text-lg font-semibold ${currentCalculation.stageBonus > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {currentCalculation.stageBonus > 0 ? '+' : ''}{currentCalculation.stageBonus}€
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Adéquation</div>
                  <div className={`text-lg font-semibold ${
                    currentCalculation.adequationBonus > 0 ? 'text-green-600' : 
                    currentCalculation.adequationBonus < 0 ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {currentCalculation.adequationBonus > 0 ? '+' : ''}{currentCalculation.adequationBonus}€
                  </div>
                </div>
              </div>
            </div>

            {/* Totaux finaux */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Total bonus</div>
                  <div className={`text-xl font-bold ${currentCalculation.totalBonuses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {currentCalculation.totalBonuses > 0 ? '+' : ''}{currentCalculation.totalBonuses}€
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Total mensuel</div>
                  <div className="text-2xl font-bold text-primary">{currentCalculation.finalMonthly}€</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Total annuel (base 12,12)</div>
                  <div className="text-2xl font-bold text-primary">{currentCalculation.finalAnnual}€</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isCalculating}>
              <Save className="h-4 w-4 mr-2" />
              {isCalculating ? 'Sauvegarde...' : 'Sauvegarder le calcul'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des calculs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calculations.map((calc) => (
                <div key={calc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{calc.base_city}</Badge>
                      <Badge variant="outline">{calc.category_group}</Badge>
                      {calc.experience_breakdown && calc.experience_breakdown.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Expérience détaillée
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(calc.calculation_date).toLocaleDateString('fr-FR')} à {new Date(calc.calculation_date).toLocaleTimeString('fr-FR')}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-medium">{calc.final_monthly}€/mois</div>
                    <div className="text-sm text-muted-foreground">{calc.final_annual}€/an</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(calc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};