import { supabase } from '@/integrations/supabase/client';

export interface SalaryCalculation {
  id: string;
  candidate_id: string;
  user_id: string;
  base_city: string;
  category_group: string;
  base_salary: number;
  ms_bonus: number;
  experience_bonus: number;
  stage_bonus: number;
  adequation_bonus: number;
  final_monthly: number;
  final_annual: number;
  calculation_date: string;
  created_at: string;
  updated_at: string;
}

export const SALARY_CONFIG = {
  cities: {
    'Paris': { base4: 2900, base5: 2800 },
    'Lyon': { base4: 2750, base5: 2650 },
    'Vitrolles': { base4: 2750, base5: 2650 },
    'Nice': { base4: 2750, base5: 2650 },
    'Lille': { base4: 2750, base5: 2650 },
    'Bordeaux': { base4: 2750, base5: 2650 },
    'Nantes': { base4: 2700, base5: 2600 },
    'Rennes': { base4: 2700, base5: 2600 },
    'Cherbourg': { base4: 2700, base5: 2600 },
    'Tours': { base4: 2700, base5: 2600 },
    'Toulouse': { base4: 2700, base5: 2600 }
  },
  groups: {
    'Groupe 1': { min: 150, max: 150 },
    'Groupe 2': { min: 100, max: 100 },
    'Groupe 3': { min: 50, max: 50 },
    'Groupe 4 (base ingé)': { min: 0, max: 0 },
    'Groupe 5 (non-ingé)': { min: -100, max: -100 },
    'MS (Bac+6)': { min: 50, max: 150 },
    'Expériences (années)': { min: 50, max: 150 },
    'Exp Bac+2': { min: 0, max: 50 },
    'Valorisation stage MI-GSO': { min: 0, max: 50 },
    'Adéquation Cursus/Métier': { min: -50, max: 50 }
  }
} as const;

export interface SalaryCalculationInput {
  candidateId: string;
  baseCity: keyof typeof SALARY_CONFIG.cities;
  categoryGroup: 'Groupe 4 (base ingé)' | 'Groupe 5 (non-ingé)';
  msBonus?: number;
  experienceBonus?: number;
  stageBonus?: number;
  adequationBonus?: number;
}

class SalaryCalculatorService {
  calculateSalary(input: SalaryCalculationInput): {
    baseSalary: number;
    finalMonthly: number;
    finalAnnual: number;
  } {
    const cityConfig = SALARY_CONFIG.cities[input.baseCity];
    const baseSalary = input.categoryGroup === 'Groupe 4 (base ingé)' 
      ? cityConfig.base4 
      : cityConfig.base5;

    const totalBonuses = (input.msBonus || 0) + 
                        (input.experienceBonus || 0) + 
                        (input.stageBonus || 0) + 
                        (input.adequationBonus || 0);

    const finalMonthly = baseSalary + totalBonuses;
    const finalAnnual = Math.round(finalMonthly * 12.12); // Base 12,12 mois

    return {
      baseSalary,
      finalMonthly,
      finalAnnual
    };
  }

  async saveCalculation(input: SalaryCalculationInput): Promise<SalaryCalculation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const calculation = this.calculateSalary(input);

    const { data, error } = await supabase
      .from('salary_calculations')
      .insert({
        candidate_id: input.candidateId,
        user_id: user.id,
        base_city: input.baseCity,
        category_group: input.categoryGroup,
        base_salary: calculation.baseSalary,
        ms_bonus: input.msBonus || 0,
        experience_bonus: input.experienceBonus || 0,
        stage_bonus: input.stageBonus || 0,
        adequation_bonus: input.adequationBonus || 0,
        final_monthly: calculation.finalMonthly,
        final_annual: calculation.finalAnnual
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error saving salary calculation: ${error.message}`);
    }

    return data;
  }

  async getCalculationsByCandidate(candidateId: string): Promise<SalaryCalculation[]> {
    const { data, error } = await supabase
      .from('salary_calculations')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('calculation_date', { ascending: false });

    if (error) {
      throw new Error(`Error fetching salary calculations: ${error.message}`);
    }

    return data || [];
  }

  async deleteCalculation(calculationId: string): Promise<void> {
    const { error } = await supabase
      .from('salary_calculations')
      .delete()
      .eq('id', calculationId);

    if (error) {
      throw new Error(`Error deleting calculation: ${error.message}`);
    }
  }

  validateBonusRange(bonusType: keyof typeof SALARY_CONFIG.groups, value: number): boolean {
    const config = SALARY_CONFIG.groups[bonusType];
    if (!config) return false;
    return value >= config.min && value <= config.max;
  }

  getBonusConfig(bonusType: keyof typeof SALARY_CONFIG.groups) {
    return SALARY_CONFIG.groups[bonusType];
  }

  getCityOptions(): string[] {
    return Object.keys(SALARY_CONFIG.cities);
  }

  getGroupOptions(): string[] {
    return ['Groupe 4 (base ingé)', 'Groupe 5 (non-ingé)'];
  }
}

export const salaryCalculatorService = new SalaryCalculatorService();