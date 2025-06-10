
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { checkResumeAlreadyAnalyzed } from './resumeValidationService';
import { validateAndCorrectAddressData, suggestAddressCorrections, extractMissingDataFromText, detectMissingCriticalData } from './addressValidationService';

/**
 * Analyser un CV avec l'IA et créer automatiquement un candidat avec score de complétude
 * Version ULTRA améliorée avec extraction complète et validation intelligente
 */
export const analyzeResume = async (resumeId: string, resumeText: string, overwriteExisting: boolean = false): Promise<{ success: boolean; message?: string; candidateId?: string }> => {
  try {
    console.log('🚀 Starting ULTRA ENHANCED resume analysis with comprehensive data extraction for:', resumeId);
    console.log('📊 Resume text length:', resumeText?.length || 0);
    console.log('🔄 Overwrite existing:', overwriteExisting);
    
    if (!resumeText || resumeText.trim() === '') {
      throw new Error('Le texte du CV est vide ou non défini');
    }
    
    // Vérifier si le CV a déjà été analysé (si overwriteExisting est false)
    if (!overwriteExisting) {
      try {
        const { analyzed, candidateId } = await checkResumeAlreadyAnalyzed(resumeId);
        if (analyzed) {
          console.log('✅ Resume has already been analyzed, returning existing candidateId:', candidateId);
          return { 
            success: true, 
            message: "Ce CV a déjà été analysé",
            candidateId: candidateId
          };
        }
      } catch (checkError) {
        console.warn("⚠️ Error checking resume analysis status, proceeding with analysis:", checkError);
      }
    }
    
    console.log(`📝 Text length being sent to AI: ${resumeText.length} characters`);
    console.log('📋 Sample of the text being sent:', resumeText.substring(0, 500) + '...');
    
    // Appel à l'edge function d'analyse de CV ultra améliorée
    try {
      console.log('🔗 Calling ULTRA ENHANCED resume-ai-analysis edge function...');
      
      const { data, error } = await supabase.functions.invoke('resume-ai-analysis', {
        body: { 
          resumeId: resumeId,
          resumeText: resumeText,
          overwriteExisting: overwriteExisting,
          fullAnalysis: true,
          validateAddress: true,
          extractMissingData: true, // Nouveau flag pour extraction complète
          comprehensiveValidation: true // Nouveau flag pour validation complète
        }
      });
      
      console.log('📡 Ultra enhanced edge function response:', { data, error });
      
      if (error) {
        console.error('❌ Error invoking resume-ai-analysis function:', error);
        throw new Error(`Erreur lors de l'analyse du CV: ${error.message}`);
      }
      
      if (!data || !data.success) {
        console.error('❌ Resume analysis failed:', data?.error || 'Raison inconnue');
        console.error('📊 Full response data:', data);
        throw new Error(data?.error || 'Analyse du CV échouée');
      }
      
      console.log('✅ ULTRA ENHANCED analysis successful, candidate created:', data.candidate?.id);
      console.log('🎯 AI score calculated:', data.scoring?.overall_score);
      
      // Validation supplémentaire côté client des données d'adresse et données manquantes
      if (data.candidate) {
        console.log('🔍 Client-side comprehensive validation...');
        
        // Validation et correction des données d'adresse
        const correctedCandidate = validateAndCorrectAddressData(data.candidate);
        
        // Extraction des données manquantes
        const enhancedCandidate = extractMissingDataFromText(resumeText, correctedCandidate);
        
        // Détection des données critiques manquantes
        const missingData = detectMissingCriticalData(enhancedCandidate, resumeText);
        
        // Suggestions de correction
        const suggestions = suggestAddressCorrections(enhancedCandidate, resumeText);
        
        if (missingData.length > 0) {
          console.warn('⚠️ Critical data potentially missing:', missingData);
          // Vous pourriez afficher ces avertissements à l'utilisateur
        }
        
        if (suggestions.length > 0) {
          console.log('💡 Data correction suggestions found:', suggestions);
          // On pourrait afficher ces suggestions à l'utilisateur si nécessaire
        }
        
        console.log('📊 Comprehensive validation completed on client side');
      }
      
      // Vérifier les structures de données retournées pour le débogage
      if (data.candidate) {
        console.log('📊 Enhanced candidate data structure validation:');
        console.log('  - Email extracted:', !!data.candidate.email, data.candidate.email);
        console.log('  - Phone extracted:', !!data.candidate.phone, data.candidate.phone);
        console.log('  - Address extracted:', !!data.candidate.address, data.candidate.address);
        console.log('  - Postal code extracted:', !!data.candidate.postal_code, data.candidate.postal_code);
        console.log('  - City extracted:', !!data.candidate.city, data.candidate.city);
        console.log('  - Country extracted:', !!data.candidate.country, data.candidate.country);
        
        console.log('  - Experiences:', typeof data.candidate.experiences, 
          Array.isArray(data.candidate.experiences) ? 
          `Array with ${data.candidate.experiences.length} items` : 
          'Not an array or empty');
        
        console.log('  - Education:', typeof data.candidate.education, 
          Array.isArray(data.candidate.education) ? 
          `Array with ${data.candidate.education.length} items` : 
          'Not an array or empty');
        
        console.log('  - Languages:', typeof data.candidate.languages, 
          Array.isArray(data.candidate.languages) ? 
          `Array with ${data.candidate.languages.length} items` : 
          'Not an array or empty');
        
        console.log('  - Skills:', typeof data.candidate.skills, 
          Array.isArray(data.candidate.skills) ? 
          `Array with ${data.candidate.skills.length} items` : 
          'Not an array or empty');
        
        console.log('  - Comprehensive address data:', {
          address: data.candidate.address,
          postal_code: data.candidate.postal_code,
          city: data.candidate.city,
          country: data.candidate.country,
          location: data.candidate.location
        });
      } else {
        console.warn('⚠️ No candidate data returned from analysis');
      }

      if (data.scoring) {
        console.log('📊 Scoring data validation:');
        console.log('  - Overall score:', data.scoring.overall_score);
        console.log('  - Explanation length:', data.scoring.explanation?.length || 0);
        console.log('  - Breakdown keys:', Object.keys(data.scoring.breakdown || {}));
      }
      
      const successMessage = overwriteExisting 
        ? "Le CV a été ré-analysé avec succès et les données du candidat ont été mises à jour avec extraction complète et validation intelligente" 
        : "Le CV a été analysé avec succès, un candidat a été créé avec extraction complète des données et validation intelligente";
      
      toast({
        title: "Analyse terminée",
        description: successMessage,
      });
      
      return { 
        success: true, 
        message: successMessage,
        candidateId: data.candidate?.id
      };
      
    } catch (apiError: any) {
      console.error('💥 API invoke error:', apiError);
      
      // Analyser le type d'erreur pour donner un message plus précis
      if (apiError.message && apiError.message.includes('rate_limit')) {
        throw new Error("Limite de taux OpenAI atteinte. Veuillez réessayer dans quelques minutes.");
      }
      
      if (apiError.message && apiError.message.includes('API key')) {
        throw new Error("Clé API OpenAI invalide ou manquante. Veuillez vérifier la configuration.");
      }
      
      // Si l'erreur est liée à la récursion dans les politiques, essayons une approche alternative
      if (apiError.message && apiError.message.includes('recursion')) {
        console.warn('⚠️ Detected recursion error, using alternative approach');
        
        // Utiliser une méthode alternative pour l'analyse en cas d'erreur de récursion
        const { data: directData, error: directError } = await supabase
          .from('candidates')
          .select('id')
          .eq('resume_id', resumeId)
          .single();
          
        if (directError || !directData) {
          throw new Error("Échec de l'analyse du CV: impossible de retrouver le candidat");
        }
        
        console.log("✅ Récupération alternative du candidat réussie:", directData.id);
        
        toast({
          title: "Analyse effectuée",
          description: "L'analyse a été effectuée, mais en raison d'une limitation technique, veuillez rafraîchir la page pour voir toutes les données",
        });
        
        return { 
          success: true, 
          message: "Analyse effectuée avec succès, mais des limitations techniques requièrent un rafraîchissement de la page",
          candidateId: directData.id
        };
      }
      
      throw apiError;
    }
    
  } catch (error: any) {
    console.error('💥 Ultra enhanced resume analysis error:', error);
    
    // Log détaillé de l'erreur pour le débogage
    console.error('📊 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    toast({
      title: "Échec de l'analyse",
      description: error.message || "Une erreur est survenue lors de l'analyse du CV",
      variant: "destructive",
    });
    
    return { 
      success: false, 
      message: error.message || "Échec de l'analyse du CV"
    };
  }
};
