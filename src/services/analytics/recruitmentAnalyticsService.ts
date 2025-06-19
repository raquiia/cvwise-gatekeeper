
import { supabase } from '@/integrations/supabase/client';

export interface RecruiterKPI {
  recruiterId: string;
  recruiterName: string;
  recruiterEmail: string;
  totalCVs: number;
  candidatesInPrequalification: number;
  candidatesInEC1: number;
  candidatesInEC2: number;
  candidatesInPresentation: number;
  candidatesInMission: number;
  conversionPrequalToEC1: number;
  conversionEC1ToEC2: number;
  conversionEC2ToPresentation: number;
  conversionEC2ToMission: number;
  period: 'current_month' | 'last_month' | 'quarter';
}

export interface GlobalRecruitmentStats {
  totalCVsThisMonth: number;
  totalCandidatesInMission: number;
  globalConversionRate: number;
  recruiterKPIs: RecruiterKPI[];
}

export class RecruitmentAnalyticsService {
  
  async getGlobalStats(): Promise<GlobalRecruitmentStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Récupérer tous les candidats directement depuis la table candidates
      const { data: candidates, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;

      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      // Filtrer les CVs de ce mois
      const cvsThisMonth = candidates?.filter(candidate => 
        new Date(candidate.created_at || '') >= firstDayOfMonth
      ) || [];

      // Candidats en mission
      const candidatesInMission = candidates?.filter(candidate => 
        candidate.detailed_status === 'en_mission'
      ) || [];

      // Calculer le taux de conversion global
      const totalCandidates = candidates?.length || 0;
      const globalConversionRate = totalCandidates > 0 
        ? Math.round((candidatesInMission.length / totalCandidates) * 100)
        : 0;

      return {
        totalCVsThisMonth: cvsThisMonth.length,
        totalCandidatesInMission: candidatesInMission.length,
        globalConversionRate,
        recruiterKPIs: [] // À implémenter quand on aura plusieurs recruteurs
      };
    } catch (error) {
      console.error('Error fetching global recruitment stats:', error);
      throw error;
    }
  }

  async getAllRecruitersKPIs(period: 'current_month' | 'last_month' | 'quarter' = 'current_month'): Promise<RecruiterKPI[]> {
    try {
      // Récupérer tous les profils (recruteurs)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
      
      if (profilesError) throw profilesError;

      // Récupérer tous les candidats avec les infos utilisateur
      const { data: allCandidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*, profiles!inner(first_name, last_name)');
      
      if (candidatesError) throw candidatesError;

      // Calculer la période
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const recruiterKPIs: RecruiterKPI[] = [];

      // Grouper les candidats par recruteur
      const candidatesByRecruiter = new Map<string, any[]>();
      allCandidates?.forEach(candidate => {
        const recruiterId = candidate.user_id;
        if (!candidatesByRecruiter.has(recruiterId)) {
          candidatesByRecruiter.set(recruiterId, []);
        }
        candidatesByRecruiter.get(recruiterId)?.push(candidate);
      });

      // Calculer les KPI pour chaque recruteur
      for (const [recruiterId, candidates] of candidatesByRecruiter.entries()) {
        const recruiterProfile = profiles?.find(p => p.id === recruiterId);
        if (!recruiterProfile) continue;

        const periodCandidates = candidates.filter(candidate => 
          new Date(candidate.created_at || '') >= startDate
        );

        // Compter par statut
        const prequalification = periodCandidates.filter(c => c.detailed_status === 'prequalification').length;
        const ec1 = periodCandidates.filter(c => c.detailed_status === 'ec1').length;
        const ec2 = periodCandidates.filter(c => c.detailed_status === 'ec2').length;
        const presentation = periodCandidates.filter(c => c.detailed_status === 'presentation_client').length;
        const mission = periodCandidates.filter(c => c.detailed_status === 'en_mission').length;

        // Calculer les taux de conversion
        const conversionPrequalToEC1 = prequalification > 0 ? Math.round((ec1 / prequalification) * 100) : 0;
        const conversionEC1ToEC2 = ec1 > 0 ? Math.round((ec2 / ec1) * 100) : 0;
        const conversionEC2ToPresentation = ec2 > 0 ? Math.round((presentation / ec2) * 100) : 0;
        const conversionEC2ToMission = ec2 > 0 ? Math.round((mission / ec2) * 100) : 0;

        recruiterKPIs.push({
          recruiterId,
          recruiterName: `${recruiterProfile.first_name || ''} ${recruiterProfile.last_name || ''}`.trim() || 'Recruteur',
          recruiterEmail: '', // À récupérer si nécessaire
          totalCVs: periodCandidates.length,
          candidatesInPrequalification: prequalification,
          candidatesInEC1: ec1,
          candidatesInEC2: ec2,
          candidatesInPresentation: presentation,
          candidatesInMission: mission,
          conversionPrequalToEC1,
          conversionEC1ToEC2,
          conversionEC2ToPresentation,
          conversionEC2ToMission,
          period
        });
      }

      return recruiterKPIs;
    } catch (error) {
      console.error('Error fetching all recruiters KPIs:', error);
      throw error;
    }
  }

  async getRecruiterKPIs(recruiterId: string, period: 'current_month' | 'last_month' | 'quarter' = 'current_month'): Promise<RecruiterKPI> {
    try {
      // Récupérer tous les candidats du recruteur directement
      const { data: candidates, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', recruiterId);
      
      if (error) throw error;

      // Calculer la période
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const periodCandidates = candidates?.filter(candidate => 
        new Date(candidate.created_at || '') >= startDate
      ) || [];

      // Compter par statut
      const prequalification = periodCandidates.filter(c => c.detailed_status === 'prequalification').length;
      const ec1 = periodCandidates.filter(c => c.detailed_status === 'ec1').length;
      const ec2 = periodCandidates.filter(c => c.detailed_status === 'ec2').length;
      const presentation = periodCandidates.filter(c => c.detailed_status === 'presentation_client').length;
      const mission = periodCandidates.filter(c => c.detailed_status === 'en_mission').length;

      // Calculer les taux de conversion
      const conversionPrequalToEC1 = prequalification > 0 ? Math.round((ec1 / prequalification) * 100) : 0;
      const conversionEC1ToEC2 = ec1 > 0 ? Math.round((ec2 / ec1) * 100) : 0;
      const conversionEC2ToPresentation = ec2 > 0 ? Math.round((presentation / ec2) * 100) : 0;
      const conversionEC2ToMission = ec2 > 0 ? Math.round((mission / ec2) * 100) : 0;

      // Récupérer les infos du recruteur
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', recruiterId)
        .single();

      return {
        recruiterId,
        recruiterName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Recruteur',
        recruiterEmail: '', // À récupérer si nécessaire
        totalCVs: periodCandidates.length,
        candidatesInPrequalification: prequalification,
        candidatesInEC1: ec1,
        candidatesInEC2: ec2,
        candidatesInPresentation: presentation,
        candidatesInMission: mission,
        conversionPrequalToEC1,
        conversionEC1ToEC2,
        conversionEC2ToPresentation,
        conversionEC2ToMission,
        period
      };
    } catch (error) {
      console.error('Error fetching recruiter KPIs:', error);
      throw error;
    }
  }
}

export const recruitmentAnalyticsService = new RecruitmentAnalyticsService();
