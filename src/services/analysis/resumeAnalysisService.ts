import { supabase } from '@/integrations/supabase/client';
import { calculateOverallMatch, MatchResult } from './matchingUtils';
import { toast } from '@/hooks/use-toast';
import { extractTextFromPDF } from '@/utils/pdfUtils';

/**
 * Service responsable de l'analyse des CV
 * Cette couche d'abstraction facilitera une migration future vers une API REST
 */
export const resumeAnalysisService = {
  /**
   * Déclenche l'analyse d'un CV
   */
  analyzeResume: async (resumeId: string, pdfFile?: File): Promise<{ success: boolean; message?: string; candidateId?: string; rawText?: string }> => {
    try {
      console.log(`Démarrage de l'analyse pour le CV ID: ${resumeId}`);
      toast({
        title: "Analyse en cours",
        description: "L'extraction des informations du CV peut prendre jusqu'à 30 secondes...",
      });
      
      let extractedText = "";
      
      // Extraction du texte, priorité à l'extraction côté client si le fichier est fourni
      if (pdfFile) {
        try {
          // Utiliser l'extraction côté client
          console.log("Tentative d'extraction côté client...");
          extractedText = await extractTextFromPDF(pdfFile);
          console.log(`Extraction côté client réussie: ${extractedText.length} caractères`);
        } catch (clientError) {
          console.error("Échec de l'extraction côté client:", clientError);
          toast({
            title: "Extraction côté client échouée",
            description: "Tentative d'extraction côté serveur...",
            variant: "default",
          });
          
          // Repli sur l'extraction côté serveur
          const { data: extractionData, error: extractionError } = await supabase.functions.invoke('analyze-resume', {
            body: { 
              resumeId,
              extractDetails: false,
              includeRawText: true
            }
          });
          
          if (extractionError || !extractionData?.rawText) {
            throw new Error("Échec de l'extraction du texte");
          }
          
          extractedText = extractionData.rawText;
        }
      } else {
        // Pas de fichier fourni, utiliser l'extraction côté serveur
        const { data: extractionData, error: extractionError } = await supabase.functions.invoke('analyze-resume', {
          body: { 
            resumeId,
            extractDetails: false,
            includeRawText: true
          }
        });
        
        if (extractionError || !extractionData?.rawText) {
          throw new Error("Échec de l'extraction du texte");
        }
        
        extractedText = extractionData.rawText;
      }
      
      if (!extractedText || extractedText.length < 50) {
        console.error('Texte extrait insuffisant');
        throw new Error("Impossible d'extraire suffisamment de texte du CV");
      }
      
      // Nettoyer le texte extrait
      const cleanedText = cleanRawResumeText(extractedText);
      console.log("Texte brut nettoyé:", cleanedText);
      
      // Afficher une prévisualisation du texte extrait (optionnel)
      displayExtractedTextPreview(cleanedText);
      
      // Analyse IA du texte extrait
      toast({
        title: "Analyse IA en cours",
        description: "Traitement par intelligence artificielle du contenu du CV...",
        duration: 5000,
      });
      
      const { data: aiAnalysisData, error: aiAnalysisError } = await supabase.functions.invoke('resume-ai-analysis', {
        body: { 
          resumeId,
          resumeText: cleanedText
        }
      });
      
      if (aiAnalysisError) {
        console.error('Erreur lors de l\'analyse IA du CV:', aiAnalysisError);
        toast({
          title: "Erreur d'analyse IA",
          description: aiAnalysisError.message || "Une erreur s'est produite lors de l'analyse IA du CV",
          variant: "destructive",
        });
        throw aiAnalysisError;
      }
      
      console.log('Réponse de l\'analyse IA:', aiAnalysisData);
      
      if (aiAnalysisData.success) {
        toast({
          title: "Analyse terminée",
          description: "Le CV a été analysé avec succès par notre IA",
          variant: "default",
        });
        return { 
          success: true, 
          candidateId: aiAnalysisData.candidate?.id,
          rawText: cleanedText
        };
      } else {
        toast({
          title: "Analyse incomplète",
          description: aiAnalysisData.message || "L'analyse a rencontré des difficultés. Vérifiez le candidat créé.",
          variant: "default",
        });
        return { 
          success: false, 
          message: aiAnalysisData.message || "Une erreur inconnue s'est produite",
          rawText: cleanedText
        };
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'analyse du CV:', error);
      toast({
        title: "Échec de l'analyse",
        description: error.message || "Une erreur s'est produite lors de l'analyse du CV",
        variant: "destructive",
      });
      return { 
        success: false, 
        message: error.message || "Une erreur s'est produite lors de l'analyse du CV" 
      };
    }
  },
  
  /**
   * Analyze a resume using its URL rather than downloading it
   */
  analyzeResumeWithUrl: async (resumeId: string, fileUrl: string): Promise<{ success: boolean; message: string; candidateId?: string }> => {
    try {
      console.log('Starting client-side analysis with URL:', resumeId);
      
      // Extract text from PDF URL using client-side pdfjs
      const extractedText = await extractTextFromPdfUrl(fileUrl);
      
      if (!extractedText || extractedText.length < 50) {
        throw new Error('Impossible d\'extraire suffisamment de texte du CV');
      }
      
      console.log('Text extracted successfully on client-side, length:', extractedText.length);
      
      // Send text to OpenAI for analysis via the edge function
      const { data: analysisData, error: analysisError } = await supabase
        .functions
        .invoke('resume-ai-analysis', {
          body: {
            resumeId,
            resumeText: extractedText
          }
        });
        
      if (analysisError) {
        console.error('Error in AI analysis on client-side:', analysisError);
        throw new Error(analysisError.message);
      }
      
      if (!analysisData.success) {
        throw new Error(analysisData.message || 'Échec de l\'analyse du CV');
      }
      
      return {
        success: true,
        message: 'Analyse réussie (extraction côté client)',
        candidateId: analysisData.candidate?.id
      };
    } catch (error: any) {
      console.error('Error in client-side analysis:', error);
      return {
        success: false, 
        message: error.message || 'Échec de l\'analyse du CV côté client'
      };
    }
  },
  
  /**
   * Nettoie le texte brut extrait d'un CV
   */
  cleanRawResumeText,
  
  /**
   * Compare un candidat à une offre d'emploi
   */
  compareToJobPosition: async (candidateId: string, jobPositionId: string): Promise<MatchResult> => {
    try {
      console.log(`Comparaison du candidat ${candidateId} avec l'offre d'emploi ${jobPositionId}`);
      
      // Get candidate data
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
        
      if (candidateError || !candidateData) {
        console.error('Error fetching candidate:', candidateError);
        throw new Error('Impossible de récupérer les données du candidat');
      }
      
      // Get job position data
      const { data: jobPosition, error: jobError } = await supabase
        .from('job_positions')
        .select('*')
        .eq('id', jobPositionId)
        .single();
        
      if (jobError || !jobPosition) {
        console.error('Error fetching job position:', jobError);
        throw new Error("Impossible de récupérer les données de l'offre d'emploi");
      }
      
      // Calculate match score
      const matchResult = calculateOverallMatch(candidateData, jobPosition);
      console.log('Match result:', matchResult);
      
      return matchResult;
    } catch (error: any) {
      console.error('Error comparing candidate to job position:', error);
      // Return a default match result with a zero score in case of error
      return {
        score: 0,
        details: {
          skillsMatch: 0,
          experienceMatch: 0,
          otherFactorsMatch: 0,
          matchedSkills: [],
          missingSkills: []
        }
      };
    }
  },
  
  /**
   * Trouve des profils similaires à un candidat
   */
  findSimilarProfiles: async (candidateId: string, limit: number = 5): Promise<any[]> => {
    try {
      console.log(`Finding ${limit} profiles similar to candidate ${candidateId}`);
      
      // Get the candidate data
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
        
      if (candidateError || !candidateData) {
        console.error('Error fetching candidate:', candidateError);
        throw new Error('Impossible de récupérer les données du candidat');
      }
      
      // Get all other candidates
      const { data: allCandidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .neq('id', candidateId); // Exclude the current candidate
        
      if (candidatesError || !allCandidates) {
        console.error('Error fetching candidates:', candidatesError);
        throw new Error('Impossible de récupérer les autres candidats');
      }
      
      // Calculate similarity scores
      const similarCandidates = allCandidates.map(candidate => {
        // For simplicity, we'll reuse our matching algorithm
        // We treat the original candidate as a "job position" with skills requirements
        const similarity = calculateOverallMatch(
          candidate, 
          { skills: candidateData.skills, required_years_experience: candidateData.years_experience }
        );
        
        return {
          ...candidate,
          similarityScore: similarity.score,
          matchDetails: similarity.details
        };
      });
      
      // Sort by similarity score and limit the results
      return similarCandidates
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
    } catch (error: any) {
      console.error('Error finding similar profiles:', error);
      return [];
    }
  }
};

/**
 * Nettoie le texte brut extrait d'un CV pour le rendre plus lisible
 */
function cleanRawResumeText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') {
    return "Aucun texte disponible";
  }
  
  // Supprimer les balises PDF et autres métadonnées inutiles
  let cleanedText = rawText
    // Supprimer les marqueurs de début/fin de fichier PDF
    .replace(/%PDF-[0-9.]+[\s\S]*?obj/gi, '')
    .replace(/endobj/gi, '')
    .replace(/startxref[\s\S]*?%%EOF/gi, '')
    
    // Supprimer codes hexadécimaux et nombres non pertinents
    .replace(/[0-9a-f]{6,}/gi, '')
    .replace(/\b[0-9]{4,}\b/g, '')
    
    // Supprimer métadonnées et références
    .replace(/\/Type\s*\/[A-Za-z]+/g, '')
    .replace(/\/MediaBox\s*\[[^\]]+\]/g, '')
    .replace(/\/Contents\s*[0-9]+\s*[0-9]+\s*R/g, '')
    .replace(/\/Parent\s*[0-9]+\s*[0-9]+\s*R/g, '')
    .replace(/\/Resources[\s\S]*?>>/g, '')
    
    // Supprimer caractères spéciaux et non-imprimables
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F\uFEFF\uFFFE\uFFFF]/g, '')
    
    // Supprimer lignes courtes (souvent du bruit)
    .split('\n')
    .filter(line => line.trim().length > 3)
    .join('\n');
    
  return cleanedText;
}

/**
 * Affiche une prévisualisation du texte extrait dans une fenêtre modale
 */
function displayExtractedTextPreview(text: string): void {
  // Créer une modal temporaire avec une meilleure mise en forme
  const dialogContainer = document.createElement('div');
  dialogContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  dialogContainer.style.zIndex = '9999';
  
  const dialogContent = document.createElement('div');
  dialogContent.className = 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl max-h-[80vh] overflow-hidden flex flex-col';
  
  const dialogHeader = document.createElement('div');
  dialogHeader.className = 'flex justify-between items-center mb-4';
  
  const dialogTitle = document.createElement('h3');
  dialogTitle.className = 'text-lg font-semibold dark:text-white';
  dialogTitle.textContent = 'Texte extrait du CV';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100';
  closeButton.textContent = '×';
  closeButton.style.fontSize = '24px';
  closeButton.onclick = () => document.body.removeChild(dialogContainer);
  
  dialogHeader.appendChild(dialogTitle);
  dialogHeader.appendChild(closeButton);
  
  const dialogBody = document.createElement('div');
  dialogBody.className = 'overflow-y-auto flex-grow';
  
  // Créer un conteneur pour le texte brut avec une meilleure mise en forme
  const textDisplay = document.createElement('div');
  textDisplay.className = 'max-h-[60vh] overflow-y-auto mt-2 p-4 border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-200';
  
  // Formater le texte pour une meilleure lisibilité
  textDisplay.innerHTML = `<div class="whitespace-pre-wrap text-sm font-mono">${formatResumeText(text)}</div>`;
  
  dialogBody.appendChild(textDisplay);
  
  // Ajouter un bouton pour copier le texte
  const copyButton = document.createElement('button');
  copyButton.className = 'mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700';
  copyButton.textContent = 'Copier le texte';
  copyButton.onclick = () => {
    navigator.clipboard.writeText(text)
      .then(() => {
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copié!';
        setTimeout(() => {
          copyButton.textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('Erreur lors de la copie:', err);
        toast({
          title: "Erreur",
          description: "Impossible de copier le texte. Veuillez réessayer.",
          variant: "destructive",
        });
      });
  };
  
  dialogBody.appendChild(copyButton);
  
  dialogContent.appendChild(dialogHeader);
  dialogContent.appendChild(dialogBody);
  dialogContainer.appendChild(dialogContent);
  
  // Ajouter à la page
  document.body.appendChild(dialogContainer);
  
  // Définir un timeout pour supprimer automatiquement après 2 minutes
  setTimeout(() => {
    if (document.body.contains(dialogContainer)) {
      document.body.removeChild(dialogContainer);
    }
  }, 120000);
}

/**
 * Formate le texte du CV pour l'affichage HTML
 */
function formatResumeText(text: string): string {
  // Diviser en paragraphes
  const paragraphs = text.split(/\n\s*\n/);
  
  // Formater chaque paragraphe
  return paragraphs.map(para => {
    if (para.trim() === '') return '';
    
    // Détecter les sections à mettre en évidence
    if (para.includes('trouvés:') || 
        para.includes('trouvée:') || 
        para.includes('détectées:') ||
        para.includes('Section "') && para.includes('" trouvée:')) {
      return `<h4 class="font-bold text-blue-600 dark:text-blue-400 mt-4 mb-2">${para}</h4>`;
    }
    
    // Formater les listes
    if (para.split('\n').some(line => /^[-•*]\s/.test(line.trim()))) {
      const listItems = para.split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (/^[-•*]\s/.test(trimmed)) {
            return `<li>${trimmed.substring(2)}</li>`;
          }
          return trimmed ? `<p class="mb-1">${trimmed}</p>` : '';
        })
        .join('');
      
      return `<ul class="list-disc pl-5 mb-3">${listItems}</ul>`;
    }
    
    // Paragraphe normal
    return `<p class="mb-3">${para.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}
