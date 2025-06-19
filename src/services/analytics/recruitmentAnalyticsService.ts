
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
      
      if (error) {
        console.error('Error fetching candidates for global stats:', error);
        throw error;
      }

      console.log(`Global stats: Found ${candidates?.length || 0} candidates for user ${user.id}`);

      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      // Filtrer les CVs de ce mois
      const cvsThisMonth = candidates?.filter(candidate => 
        new Date(candidate.created_at || '') >= firstDayOfMonth
      ) || [];

      console.log(`CVs this month: ${cvsThisMonth.length}`);

      // Candidats en mission
      const candidatesInMission = candidates?.filter(candidate => 
        candidate.detailed_status === 'en_mission'
      ) || [];

      console.log(`Candidates in mission: ${candidatesInMission.length}`);

      // Calculer le taux de conversion global
      const totalCandidates = candidates?.length || 0;
      const globalConversionRate = totalCandidates > 0 
        ? Math.round((candidatesInMission.length / totalCandidates) * 100)
        : 0;

      return {
        totalCVsThisMonth: cvsThisMonth.length,
        totalCandidatesInMission: candidatesInMission.length,
        globalConversionRate,
        recruiterKPIs: []
      };
    } catch (error) {
      console.error('Error fetching global recruitment stats:', error);
      throw error;
    }
  }

  async getAllRecruitersKPIs(period: 'current_month' | 'last_month' | 'quarter' = 'current_month'): Promise<RecruiterKPI[]> {
    try {
      // Récupérer tous les profils (recruteurs) avec leurs infos auth
      const { data: profiles, error: profilesError } = await supabase
        .rpc('get_all_profiles_secure');
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log(`Found ${profiles?.length || 0} profiles`);

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

      console.log(`Calculating KPIs from ${startDate.toISOString()}`);

      const recruiterKPIs: RecruiterKPI[] = [];

      // Pour chaque profil, récupérer ses candidats et calculer les KPI
      for (const profile of profiles || []) {
        try {
          // Récupérer tous les candidats du recruteur
          const { data: candidates, error: candidatesError } = await supabase
            .from('candidates')
            .select('*')
            .eq('user_id', profile.id);
          
          if (candidatesError) {
            console.error(`Error fetching candidates for user ${profile.id}:`, candidatesError);
            continue;
          }

          console.log(`User ${profile.id} has ${candidates?.length || 0} candidates`);

          const periodCandidates = candidates?.filter(candidate => 
            new Date(candidate.created_at || '') >= startDate
          ) || [];

          console.log(`User ${profile.id} has ${periodCandidates.length} candidates in period`);

          // Compter par statut détaillé
          const prequalification = periodCandidates.filter(c => c.detailed_status === 'prequalification').length;
          const ec1 = periodCandidates.filter(c => c.detailed_status === 'ec1').length;
          const ec2 = periodCandidates.filter(c => c.detailed_status === 'ec2').length;
          const presentation = periodCandidates.filter(c => c.detailed_status === 'presentation_client').length;
          const mission = periodCandidates.filter(c => c.detailed_status === 'en_mission').length;

          console.log(`User ${profile.id} status breakdown:`, {
            prequalification,
            ec1,
            ec2,
            presentation,
            mission
          });

          // LOGIQUE DE CONVERSION CORRIGÉE
          // Les taux de conversion doivent être calculés de manière logique
          const totalActive = prequalification + ec1 + ec2 + presentation + mission;
          
          // Conversion: candidats ayant progressé par rapport au total actif
          const conversionPrequalToEC1 = totalActive > 0 ? Math.round(((ec1 + ec2 + presentation + mission) / totalActive) * 100) : 0;
          const conversionEC1ToEC2 = (ec1 + ec2 + presentation + mission) > 0 ? Math.round(((ec2 + presentation + mission) / (ec1 + ec2 + presentation + mission)) * 100) : 0;
          const conversionEC2ToPresentation = (ec2 + presentation + mission) > 0 ? Math.round(((presentation + mission) / (ec2 + presentation + mission)) * 100) : 0;
          const conversionEC2ToMission = (ec2 + presentation + mission) > 0 ? Math.round((mission / (ec2 + presentation + mission)) * 100) : 0;

          recruiterKPIs.push({
            recruiterId: profile.id,
            recruiterName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Recruteur',
            recruiterEmail: '', // L'email n'est pas disponible dans les profils
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
        } catch (userError) {
          console.error(`Error processing KPIs for user ${profile.id}:`, userError);
          continue;
        }
      }

      console.log(`Generated ${recruiterKPIs.length} recruiter KPIs`);
      return recruiterKPIs;
    } catch (error) {
      console.error('Error fetching all recruiters KPIs:', error);
      throw error;
    }
  }

  async getRecruiterKPIs(recruiterId: string, period: 'current_month' | 'last_month' | 'quarter' = 'current_month'): Promise<RecruiterKPI> {
    try {
      console.log(`Getting KPIs for recruiter ${recruiterId}, period: ${period}`);

      // Récupérer tous les candidats du recruteur directement
      const { data: candidates, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', recruiterId);
      
      if (error) {
        console.error('Error fetching candidates:', error);
        throw error;
      }

      console.log(`Found ${candidates?.length || 0} candidates for recruiter ${recruiterId}`);

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

      console.log(`Period start date: ${startDate.toISOString()}`);

      const periodCandidates = candidates?.filter(candidate => 
        new Date(candidate.created_at || '') >= startDate
      ) || [];

      console.log(`${periodCandidates.length} candidates in period`);

      // Compter par statut détaillé
      const prequalification = periodCandidates.filter(c => c.detailed_status === 'prequalification').length;
      const ec1 = periodCandidates.filter(c => c.detailed_status === 'ec1').length;
      const ec2 = periodCandidates.filter(c => c.detailed_status === 'ec2').length;
      const presentation = periodCandidates.filter(c => c.detailed_status === 'presentation_client').length;
      const mission = periodCandidates.filter(c => c.detailed_status === 'en_mission').length;

      console.log('Status breakdown:', {
        prequalification,
        ec1,
        ec2,
        presentation,
        mission
      });

      // LOGIQUE DE CONVERSION CORRIGÉE
      const totalActive = prequalification + ec1 + ec2 + presentation + mission;
      
      // Conversion: candidats ayant progressé par rapport au total actif
      const conversionPrequalToEC1 = totalActive > 0 ? Math.round(((ec1 + ec2 + presentation + mission) / totalActive) * 100) : 0;
      const conversionEC1ToEC2 = (ec1 + ec2 + presentation + mission) > 0 ? Math.round(((ec2 + presentation + mission) / (ec1 + ec2 + presentation + mission)) * 100) : 0;
      const conversionEC2ToPresentation = (ec2 + presentation + mission) > 0 ? Math.round(((presentation + mission) / (ec2 + presentation + mission)) * 100) : 0;
      const conversionEC2ToMission = (ec2 + presentation + mission) > 0 ? Math.round((mission / (ec2 + presentation + mission)) * 100) : 0;

      // Récupérer les infos du recruteur
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', recruiterId)
        .single();

      const result = {
        recruiterId,
        recruiterName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Recruteur',
        recruiterEmail: '',
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

      console.log('Final KPI result:', result);
      return result;
    } catch (error) {
      console.error('Error fetching recruiter KPIs:', error);
      throw error;
    }
  }
}

export const recruitmentAnalyticsService = new RecruitmentAnalyticsService();
