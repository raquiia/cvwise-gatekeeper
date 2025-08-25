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
    'Paris': { baseIngenieur: 2900, baseNonIngenieur: 2800 },
    'Lyon': { baseIngenieur: 2750, baseNonIngenieur: 2650 },
    'Vitrolles': { baseIngenieur: 2750, baseNonIngenieur: 2650 },
    'Nice': { baseIngenieur: 2750, baseNonIngenieur: 2650 },
    'Lille': { baseIngenieur: 2750, baseNonIngenieur: 2650 },
    'Bordeaux': { baseIngenieur: 2750, baseNonIngenieur: 2650 },
    'Nantes': { baseIngenieur: 2700, baseNonIngenieur: 2600 },
    'Rennes': { baseIngenieur: 2700, baseNonIngenieur: 2600 },
    'Cherbourg': { baseIngenieur: 2700, baseNonIngenieur: 2600 },
    'Tours': { baseIngenieur: 2700, baseNonIngenieur: 2600 },
    'Toulouse': { baseIngenieur: 2700, baseNonIngenieur: 2600 }
  },
  groups: {
    'Groupe 1': { modulation: 150 },
    'Groupe 2': { modulation: 100 },
    'Groupe 3': { modulation: 50 },
    'Groupe 4 (base ingé)': { modulation: 0 },
    'Groupe 5 (non-ingé, hors business school ++)': { modulation: -100 }
  },
  bonuses: {
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
  categoryGroup: keyof typeof SALARY_CONFIG.groups;
  msBonus?: number;
  experienceBonus?: number;
  stageBonus?: number;
  adequationBonus?: number;
}

class SalaryCalculatorService {
  calculateSalary(input: SalaryCalculationInput): {
    baseSalary: number;
    groupModulation: number;
    msBonus: number;
    experienceBonus: number;
    stageBonus: number;
    adequationBonus: number;
    totalBonuses: number;
    finalMonthly: number;
    finalAnnual: number;
  } {
    const cityConfig = SALARY_CONFIG.cities[input.baseCity];
    const groupConfig = SALARY_CONFIG.groups[input.categoryGroup];
    
    // Détermine la base selon le groupe (ingénieur vs non-ingénieur)
    const isEngineerGroup = ['Groupe 1', 'Groupe 2', 'Groupe 3', 'Groupe 4 (base ingé)'].includes(input.categoryGroup);
    const baseSalary = isEngineerGroup ? cityConfig.baseIngenieur : cityConfig.baseNonIngenieur;
    
    // Ajoute la modulation du groupe
    const groupModulation = groupConfig.modulation;
    const salaryWithGroup = baseSalary + groupModulation;

    // Récupère chaque bonus individuellement
    const msBonus = input.msBonus || 0;
    const experienceBonus = input.experienceBonus || 0;
    const stageBonus = input.stageBonus || 0;
    const adequationBonus = input.adequationBonus || 0;
    
    const totalBonuses = msBonus + experienceBonus + stageBonus + adequationBonus;
    const finalMonthly = salaryWithGroup + totalBonuses;
    const finalAnnual = Math.round(finalMonthly * 12.12); // Base 12,12 mois

    return {
      baseSalary,
      groupModulation,
      msBonus,
      experienceBonus,
      stageBonus,
      adequationBonus,
      totalBonuses,
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

  validateBonusRange(bonusType: keyof typeof SALARY_CONFIG.bonuses, value: number): boolean {
    const config = SALARY_CONFIG.bonuses[bonusType];
    if (!config) return false;
    return value >= config.min && value <= config.max;
  }

  getBonusConfig(bonusType: keyof typeof SALARY_CONFIG.bonuses) {
    return SALARY_CONFIG.bonuses[bonusType];
  }

  getCityOptions(): string[] {
    return Object.keys(SALARY_CONFIG.cities);
  }

  getGroupOptions(): Array<keyof typeof SALARY_CONFIG.groups> {
    return Object.keys(SALARY_CONFIG.groups) as Array<keyof typeof SALARY_CONFIG.groups>;
  }

  getGroupModulation(group: keyof typeof SALARY_CONFIG.groups): number {
    return SALARY_CONFIG.groups[group].modulation;
  }
}

export const salaryCalculatorService = new SalaryCalculatorService();