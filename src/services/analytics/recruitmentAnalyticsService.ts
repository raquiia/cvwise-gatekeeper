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
  period: 'current_month' | 'last_month' | 'quarter' | 'custom';
  customPeriod?: {
    startDate: Date;
    endDate: Date;
  };
  adjustedNumbers?: {
    originalPrequalification: number;
    originalEC1: number;
    originalEC2: number;
    originalPresentation: number;
    originalMission: number;
    adjustmentsApplied: boolean;
    adjustmentDetails: string[];
  };
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

  private calculatePeriodDates(period: 'current_month' | 'last_month' | 'quarter' | 'custom', customStartDate?: Date, customEndDate?: Date): { startDate: Date, endDate?: Date } {
    const now = new Date();
    
    if (period === 'custom' && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    
    switch (period) {
      case 'last_month':
        return { startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1) };
      case 'quarter':
        return { startDate: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1) };
      default:
        return { startDate: new Date(now.getFullYear(), now.getMonth(), 1) };
    }
  }

  private filterCandidatesByPeriod(candidates: any[], period: 'current_month' | 'last_month' | 'quarter' | 'custom', customStartDate?: Date, customEndDate?: Date) {
    const { startDate, endDate } = this.calculatePeriodDates(period, customStartDate, customEndDate);
    
    return candidates.filter(candidate => {
      const candidateDate = new Date(candidate.created_at || '');
      if (endDate) {
        return candidateDate >= startDate && candidateDate <= endDate;
      }
      return candidateDate >= startDate;
    });
  }

  private adjustPipelineNumbers(
    prequalification: number,
    ec1: number,
    ec2: number,
    presentation: number,
    mission: number
  ) {
    const adjustmentDetails: string[] = [];
    let adjustmentsApplied = false;

    // Stocker les nombres originaux
    const originalNumbers = {
      originalPrequalification: prequalification,
      originalEC1: ec1,
      originalEC2: ec2,
      originalPresentation: presentation,
      originalMission: mission,
      adjustmentsApplied: false,
      adjustmentDetails: []
    };

    // Ajuster EC2 si nécessaire (pour présentation et mission)
    const minEC2Needed = Math.max(presentation, mission);
    if (ec2 < minEC2Needed) {
      adjustmentDetails.push(`EC2 ajusté de ${ec2} à ${minEC2Needed} (min requis pour présentation/mission)`);
      ec2 = minEC2Needed;
      adjustmentsApplied = true;
    }

    // Ajuster EC1 si nécessaire
    if (ec1 < ec2) {
      adjustmentDetails.push(`EC1 ajusté de ${ec1} à ${ec2} (min requis pour EC2)`);
      ec1 = ec2;
      adjustmentsApplied = true;
    }

    // Ajuster préqualification si nécessaire
    if (prequalification < ec1) {
      adjustmentDetails.push(`Préqualification ajustée de ${prequalification} à ${ec1} (min requis pour EC1)`);
      prequalification = ec1;
      adjustmentsApplied = true;
    }

    console.log('Pipeline adjustment:', {
      original: originalNumbers,
      adjusted: { prequalification, ec1, ec2, presentation, mission },
      adjustmentsApplied,
      adjustmentDetails
    });

    return {
      adjustedNumbers: {
        prequalification,
        ec1,
        ec2,
        presentation,
        mission
      },
      adjustmentInfo: {
        ...originalNumbers,
        adjustmentsApplied,
        adjustmentDetails
      }
    };
  }

  private calculateConversionRates(
    prequalification: number,
    ec1: number,
    ec2: number,
    presentation: number,
    mission: number
  ) {
    // Appliquer les ajustements du pipeline
    const { adjustedNumbers, adjustmentInfo } = this.adjustPipelineNumbers(
      prequalification, ec1, ec2, presentation, mission
    );

    const {
      prequalification: adjPrequal,
      ec1: adjEC1,
      ec2: adjEC2,
      presentation: adjPresentation,
      mission: adjMission
    } = adjustedNumbers;

    // Calculer les taux de conversion avec les nombres ajustés
    const conversionPrequalToEC1 = adjPrequal > 0 
      ? Math.round((adjEC1 / adjPrequal) * 100) 
      : 0;
    
    const conversionEC1ToEC2 = adjEC1 > 0 
      ? Math.round((adjEC2 / adjEC1) * 100) 
      : 0;
    
    const conversionEC2ToPresentation = adjEC2 > 0 
      ? Math.round((adjPresentation / adjEC2) * 100) 
      : 0;
    
    const conversionEC2ToMission = adjEC2 > 0 
      ? Math.round((adjMission / adjEC2) * 100) 
      : 0;

    console.log('Conversion rates calculated with adjustments:', {
      originalNumbers: { prequalification, ec1, ec2, presentation, mission },
      adjustedNumbers,
      conversionRates: {
        conversionPrequalToEC1,
        conversionEC1ToEC2,
        conversionEC2ToPresentation,
        conversionEC2ToMission
      },
      adjustmentInfo
    });

    return {
      conversionPrequalToEC1,
      conversionEC1ToEC2,
      conversionEC2ToPresentation,
      conversionEC2ToMission,
      adjustedNumbers: adjustmentInfo
    };
  }

  async getAllRecruitersKPIs(period: 'current_month' | 'last_month' | 'quarter' | 'custom' = 'current_month', customStartDate?: Date, customEndDate?: Date): Promise<RecruiterKPI[]> {
    try {
      // Récupérer tous les profils (recruteurs) avec leurs infos auth
      const { data: profiles, error: profilesError } = await supabase
        .rpc('get_all_profiles_secure');
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log(`Found ${profiles?.length || 0} profiles`);
      console.log(`Calculating KPIs for period: ${period}`, { customStartDate, customEndDate });

      const recruiterKPIs: RecruiterKPI[] = [];

      // Pour chaque profil, récupérer ses candidats et calculer les KPI avec ajustements
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

          const periodCandidates = this.filterCandidatesByPeriod(candidates || [], period, customStartDate, customEndDate);

          console.log(`User ${profile.id} has ${periodCandidates.length} candidates in period`);

          const candidatesToAnalyze = periodCandidates.length > 0 ? periodCandidates : candidates || [];
          const isUsingAllCandidates = periodCandidates.length === 0 && candidates && candidates.length > 0;

          if (isUsingAllCandidates) {
            console.log(`User ${profile.id}: No candidates in period, using all ${candidatesToAnalyze.length} candidates for KPI calculation`);
          }

          // Compter par statut détaillé
          const prequalification = candidatesToAnalyze.filter(c => c.detailed_status === 'prequalification').length;
          const ec1 = candidatesToAnalyze.filter(c => c.detailed_status === 'ec1').length;
          const ec2 = candidatesToAnalyze.filter(c => c.detailed_status === 'ec2').length;
          const presentation = candidatesToAnalyze.filter(c => c.detailed_status === 'presentation_client').length;
          const mission = candidatesToAnalyze.filter(c => c.detailed_status === 'en_mission').length;

          console.log(`User ${profile.id} status breakdown:`, {
            prequalification,
            ec1,
            ec2,
            presentation,
            mission,
            usingAllCandidates: isUsingAllCandidates
          });

          // Calculer les taux de conversion avec ajustements
          const conversionResults = this.calculateConversionRates(
            prequalification,
            ec1,
            ec2,
            presentation,
            mission
          );

          const kpi: RecruiterKPI = {
            recruiterId: profile.id,
            recruiterName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Recruteur',
            recruiterEmail: '',
            totalCVs: candidatesToAnalyze.length,
            candidatesInPrequalification: prequalification,
            candidatesInEC1: ec1,
            candidatesInEC2: ec2,
            candidatesInPresentation: presentation,
            candidatesInMission: mission,
            conversionPrequalToEC1: conversionResults.conversionPrequalToEC1,
            conversionEC1ToEC2: conversionResults.conversionEC1ToEC2,
            conversionEC2ToPresentation: conversionResults.conversionEC2ToPresentation,
            conversionEC2ToMission: conversionResults.conversionEC2ToMission,
            adjustedNumbers: conversionResults.adjustedNumbers,
            period
          };

          if (period === 'custom' && customStartDate && customEndDate) {
            kpi.customPeriod = { startDate: customStartDate, endDate: customEndDate };
          }

          recruiterKPIs.push(kpi);
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

  async getRecruiterKPIs(recruiterId: string, period: 'current_month' | 'last_month' | 'quarter' | 'custom' = 'current_month', customStartDate?: Date, customEndDate?: Date): Promise<RecruiterKPI> {
    try {
      console.log(`Getting KPIs for recruiter ${recruiterId}, period: ${period}`, { customStartDate, customEndDate });

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

      const periodCandidates = this.filterCandidatesByPeriod(candidates || [], period, customStartDate, customEndDate);

      console.log(`${periodCandidates.length} candidates in period`);

      const candidatesToAnalyze = periodCandidates.length > 0 ? periodCandidates : candidates || [];
      const isUsingAllCandidates = periodCandidates.length === 0 && candidates && candidates.length > 0;

      if (isUsingAllCandidates) {
        console.log(`Recruiter ${recruiterId}: No candidates in period, using all ${candidatesToAnalyze.length} candidates for KPI calculation`);
      }

      // Compter par statut détaillé
      const prequalification = candidatesToAnalyze.filter(c => c.detailed_status === 'prequalification').length;
      const ec1 = candidatesToAnalyze.filter(c => c.detailed_status === 'ec1').length;
      const ec2 = candidatesToAnalyze.filter(c => c.detailed_status === 'ec2').length;
      const presentation = candidatesToAnalyze.filter(c => c.detailed_status === 'presentation_client').length;
      const mission = candidatesToAnalyze.filter(c => c.detailed_status === 'en_mission').length;

      console.log('Status breakdown:', {
        prequalification,
        ec1,
        ec2,
        presentation,
        mission,
        usingAllCandidates: isUsingAllCandidates
      });

      // Calculer les taux de conversion avec ajustements
      const conversionResults = this.calculateConversionRates(
        prequalification,
        ec1,
        ec2,
        presentation,
        mission
      );

      // Récupérer les infos du recruteur
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', recruiterId)
        .single();

      const result: RecruiterKPI = {
        recruiterId,
        recruiterName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Recruteur',
        recruiterEmail: '',
        totalCVs: candidatesToAnalyze.length,
        candidatesInPrequalification: prequalification,
        candidatesInEC1: ec1,
        candidatesInEC2: ec2,
        candidatesInPresentation: presentation,
        candidatesInMission: mission,
        conversionPrequalToEC1: conversionResults.conversionPrequalToEC1,
        conversionEC1ToEC2: conversionResults.conversionEC1ToEC2,
        conversionEC2ToPresentation: conversionResults.conversionEC2ToPresentation,
        conversionEC2ToMission: conversionResults.conversionEC2ToMission,
        adjustedNumbers: conversionResults.adjustedNumbers,
        period
      };

      if (period === 'custom' && customStartDate && customEndDate) {
        result.customPeriod = { startDate: customStartDate, endDate: customEndDate };
      }

      console.log('Final KPI result:', result);
      return result;
    } catch (error) {
      console.error('Error fetching recruiter KPIs:', error);
      throw error;
    }
  }
}

export const recruitmentAnalyticsService = new RecruitmentAnalyticsService();
