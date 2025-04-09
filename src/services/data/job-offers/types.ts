
/**
 * Interface pour les offres d'emploi
 */
export interface JobOffer {
  id: string;
  user_id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  contract_type?: string;
  remote_preference?: string;
  experience_years_min?: number;
  experience_years_max?: number;
  education_level?: string;
  required_degrees?: string[];
  required_schools?: string[];
  required_skills?: any[];
  preferred_skills?: any[];
  industry_sectors?: string[];
  preferred_companies?: string[];
  required_languages?: any[];
  mobility?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  benefits?: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
  valid_until?: string;
}
