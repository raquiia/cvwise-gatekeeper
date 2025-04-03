
import { supabase } from '@/integrations/supabase/client';
import { calculateOverallMatch, MatchResult } from './matchingUtils';
import { toast } from '@/hooks/use-toast';

/**
 * Service responsable de l'analyse des CV
 * Cette couche d'abstraction facilitera une migration future vers une API REST
 */
export const resumeAnalysisService = {
  /**
   * Déclenche l'analyse d'un CV
   */
  analyzeResume: async (resumeId: string): Promise<{ success: boolean; message?: string; candidateId?: string; rawText?: string }> => {
    try {
      console.log(`Démarrage de l'analyse pour le CV ID: ${resumeId}`);
      toast({
        title: "Analyse en cours",
        description: "L'extraction des informations du CV peut prendre jusqu'à 30 secondes...",
      });
      
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { 
          resumeId,
          extractDetails: true,    // Extraction complète des détails
          fullExtraction: true,    // Force l'extraction complète
          forceCompletion: true,   // Génère des données même en cas d'échec partiel
          includeRawText: true     // Demande d'inclure le texte brut extrait
        }
      });
      
      if (error) {
        console.error('Erreur lors de l\'appel de la fonction analyze-resume:', error);
        toast({
          title: "Erreur d'analyse",
          description: error.message || "Une erreur s'est produite lors de l'analyse du CV",
          variant: "destructive",
        });
        throw error;
      }
      
      console.log('Réponse de l\'analyse:', data);
      
      // Afficher le texte brut extrait dans une popup temporaire
      if (data.rawText) {
        // Nettoyer et formater le texte brut avant affichage
        const cleanedText = cleanRawResumeText(data.rawText);
        
        // Affichage dans la console pour le débogage
        console.log("Texte brut nettoyé:", cleanedText);
        
        // Créer une modal ou dialogue temporaire avec une meilleure mise en forme
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
        textDisplay.innerHTML = `<div class="whitespace-pre-wrap text-sm font-mono">${formatResumeText(cleanedText)}</div>`;
        
        dialogBody.appendChild(textDisplay);
        
        // Ajouter un bouton pour copier le texte
        const copyButton = document.createElement('button');
        copyButton.className = 'mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700';
        copyButton.textContent = 'Copier le texte';
        copyButton.onclick = () => {
          navigator.clipboard.writeText(cleanedText)
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
        
        // Notification toast pour informer l'utilisateur
        toast({
          title: "Texte extrait du CV",
          description: "Une fenêtre avec le texte extrait et nettoyé du CV est maintenant disponible",
          duration: 5000,
        });
        
        // Définir un timeout pour supprimer automatiquement après 2 minutes
        setTimeout(() => {
          if (document.body.contains(dialogContainer)) {
            document.body.removeChild(dialogContainer);
          }
        }, 120000);
      }
      
      if (data.success) {
        toast({
          title: "Analyse terminée",
          description: "Le CV a été analysé avec succès",
          variant: "default",
        });
        return { 
          success: true, 
          candidateId: data.candidate?.id,
          rawText: data.rawText ? cleanRawResumeText(data.rawText) : undefined
        };
      } else {
        toast({
          title: "Analyse incomplète",
          description: data.message || "L'analyse a rencontré des difficultés. Vérifiez le candidat créé.",
          variant: "default",
        });
        return { 
          success: false, 
          message: data.message || "Une erreur inconnue s'est produite",
          rawText: data.rawText ? cleanRawResumeText(data.rawText) : undefined
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
  
  // Extraire les sections importantes et pertinentes avec une expression régulière plus flexible
  const importantContent = [];
  
  // Extraire les coordonnées (email, téléphone)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = cleanedText.match(emailRegex) || [];
  if (emails.length > 0) {
    importantContent.push("Emails trouvés:", ...new Set(emails));
  }
  
  const phoneRegex = /(\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}/g;
  const phones = cleanedText.match(phoneRegex) || [];
  if (phones.length > 0) {
    importantContent.push("Téléphones trouvés:", ...new Set(phones));
  }
  
  // Extraire les noms potentiels (séquences de mots capitalisés)
  const nameRegex = /([A-Z][a-zàáâäãåèéêëìíîïòóôöõùúûüÿýñç]+\s+[A-Z][a-zàáâäãåèéêëìíîïòóôöõùúûüÿýñç]+)/g;
  const names = cleanedText.match(nameRegex) || [];
  if (names.length > 0) {
    importantContent.push("Noms potentiels:", ...new Set(names));
  }
  
  // Extraire les compétences communes
  const skills = [
    "JavaScript", "React", "Vue", "Angular", "TypeScript", "Node.js", 
    "Python", "Java", "C#", "C++", "PHP", "Ruby", "Go", "Rust",
    "HTML", "CSS", "SASS", "LESS", "Bootstrap", "Tailwind",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "DevOps", "CI/CD", "Jenkins", "GitHub Actions", "CircleCI",
    "Agile", "Scrum", "Kanban", "Project Management", "Jira", "Confluence",
    "Machine Learning", "AI", "Data Science", "Data Analysis", "BigData"
  ];
  
  const foundSkills = skills.filter(skill => 
    cleanedText.toLowerCase().includes(skill.toLowerCase())
  );
  
  if (foundSkills.length > 0) {
    importantContent.push("Compétences détectées:", foundSkills.join(", "));
  }
  
  // Extraire les sections courantes d'un CV
  const sections = [
    "expérience", "experience", "éducation", "education", "formation",
    "compétences", "competences", "skills", "langues", "languages",
    "projets", "projects", "certifications", "intérêts", "interests"
  ];
  
  sections.forEach(section => {
    // Rechercher la section et le contenu qui suit
    const sectionRegex = new RegExp(`(${section}s?)[:\\s]+([^\\n]*(?:\\n(?!${sections.join('|')})[^\\n]+){0,10})`, 'gi');
    const matches = [...cleanedText.matchAll(sectionRegex)];
    
    if (matches.length > 0) {
      for (const match of matches) {
        if (match[2] && match[2].trim().length > 10) {
          importantContent.push(`Section "${match[1].trim()}" trouvée:`, match[2].trim());
        }
      }
    }
  });
  
  // Si des sections importantes ont été trouvées, utiliser celles-ci
  // Sinon, garder le texte nettoyé mais filtré
  if (importantContent.length > 0) {
    return importantContent.join('\n\n');
  }
  
  // Si aucune section spécifique n'a été trouvée, filtrer davantage le texte brut
  // pour ne garder que les lignes significatives
  return cleanedText
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      // Garder uniquement les lignes qui contiennent du texte significatif
      return trimmed.length > 10 && 
             /[a-zA-Z]{3,}/.test(trimmed) && // Au moins 3 lettres consécutives
             !/^[\d\s.,;:()[\]{}]+$/.test(trimmed); // Pas seulement des caractères spéciaux
    })
    .join('\n');
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
    
    // Déterminer si c'est un titre de section
    if (para.includes('trouvés:') || 
        para.includes('trouvée:') || 
        para.includes('détectées:') ||
        para.includes('Section "') && para.includes('" trouvée:')) {
      return `<h4 class="font-bold text-blue-600 dark:text-blue-400 mt-4 mb-2">${para}</h4>`;
    }
    
    // Formater les listes (éléments commençant par - ou •)
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
