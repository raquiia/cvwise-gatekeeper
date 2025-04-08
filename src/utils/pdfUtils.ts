
/**
 * Utilitaires pour l'extraction de texte des fichiers PDF côté client
 */
import * as pdfjs from 'pdfjs-dist';

// Configurer le worker PDF.js
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Maximum de texte à extraire (pour éviter les problèmes de limite de tokens)
const MAX_EXTRACTED_TEXT_LENGTH = 100000;

/**
 * Extrait le texte d'un fichier PDF
 * @param file Le fichier PDF à analyser
 * @returns Le texte extrait du PDF
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    console.log('Starting client-side PDF text extraction for file:', file.name);
    
    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log(`File loaded, size: ${Math.round(uint8Array.length / 1024)} KB`);
    
    // Extraire le texte avec la méthode principale
    const { extractedText, pageCount } = await extractTextFromPDFBuffer(uint8Array);
    
    console.log(`Text extracted successfully: ${extractedText.length} characters from ${pageCount} pages`);
    
    return extractedText;
  } catch (error: any) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Échec de l'extraction du texte du PDF: ${error.message}`);
  }
};

/**
 * Extrait le texte d'un PDF à partir d'un ArrayBuffer
 * Utilisé à la fois côté client et dans l'edge function
 */
export const extractTextFromPDFBuffer = async (pdfData: Uint8Array): Promise<{ extractedText: string, pageCount: number }> => {
  try {
    console.log('PDF.js loading document...');
    
    // Charger le document PDF avec PDF.js
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    console.log(`PDF loaded successfully. Number of pages: ${numPages}`);
    
    // Extraire le texte de chaque page
    const textContent: string[] = [];
    let totalExtractedLength = 0;
    
    for (let i = 1; i <= numPages; i++) {
      try {
        if (totalExtractedLength > MAX_EXTRACTED_TEXT_LENGTH) {
          console.log(`Reached maximum text extraction limit (${MAX_EXTRACTED_TEXT_LENGTH} characters). Stopping.`);
          textContent.push(`[EXTRACTION LIMITÉE - Pages ${i} à ${numPages} non extraites pour respecter les limites]`);
          break;
        }
        
        console.log(`Processing page ${i}/${numPages}`);
        
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        // Récupérer le texte avec sa position pour une meilleure mise en forme
        const textItems = content.items
          .filter((item: any) => 'str' in item && item.str.trim().length > 0)
          .map((item: any) => ({
            text: item.str,
            x: item.transform ? item.transform[4] : 0,
            y: item.transform ? item.transform[5] : 0,
            height: item.height || 0,
            fontName: item.fontName || ''
          }));
          
        if (textItems.length === 0) {
          console.log(`No text items found on page ${i}`);
          continue;
        }
        
        // Trier les éléments par position pour conserver la structure du document
        // D'abord regrouper par lignes (éléments ayant à peu près la même coordonnée y)
        const lineHeight = estimateLineHeight(textItems);
        const lines: { [key: number]: any[] } = {};
        
        // Regrouper les items par ligne
        textItems.forEach(item => {
          // Arrondir la position y pour regrouper les éléments sur la même ligne
          const lineY = Math.round(item.y / lineHeight) * lineHeight;
          if (!lines[lineY]) lines[lineY] = [];
          lines[lineY].push(item);
        });
        
        // Trier les lignes de haut en bas (y décroissant car l'origine est en bas dans PDF.js)
        const sortedLineKeys = Object.keys(lines).map(Number).sort((a, b) => b - a);
        
        // Construire le texte de la page
        let pageText = '';
        
        sortedLineKeys.forEach(lineY => {
          // Trier les éléments de la ligne de gauche à droite
          const sortedItems = lines[lineY].sort((a: any, b: any) => a.x - b.x);
          
          // Convertir les éléments en texte
          const lineText = sortedItems.map((item: any) => item.text).join(' ');
          
          // Ajouter le texte de la ligne au texte de la page
          if (lineText.trim()) {
            pageText += lineText + '\n';
          }
        });
        
        console.log(`Extracted ${pageText.length} chars from page ${i}`);
        
        textContent.push(pageText);
        totalExtractedLength += pageText.length;
      } catch (pageError) {
        console.warn(`Error extracting text from page ${i}:`, pageError);
        textContent.push(`[Échec d'extraction - page ${i}]`);
      }
    }
    
    // Joindre toutes les pages avec des sauts de ligne
    let extractedText = textContent.join('\n');
    
    console.log(`PDF.js extraction complete. Total text length: ${extractedText.length} chars`);
    
    // Limiter la taille totale du texte extrait
    if (extractedText.length > MAX_EXTRACTED_TEXT_LENGTH) {
      console.log(`Truncating extracted text from ${extractedText.length} to ${MAX_EXTRACTED_TEXT_LENGTH} characters`);
      extractedText = extractedText.substring(0, MAX_EXTRACTED_TEXT_LENGTH) + 
        "\n\n[TEXTE TRONQUÉ - Le fichier est trop volumineux pour être analysé en entier]";
    }
    
    // Nettoyer le texte extrait
    extractedText = cleanExtractedText(extractedText);
    
    // Si l'extraction principale donne peu de résultats, utiliser une méthode de secours
    if (extractedText.trim().length < 100 && numPages > 0) {
      console.log('Primary extraction yielded insufficient text, trying fallback method');
      try {
        const fallbackResult = await fallbackExtraction(pdfData, numPages);
        
        // Si la méthode de secours donne un meilleur résultat, l'utiliser
        if (fallbackResult.length > extractedText.length) {
          console.log('Using fallback extraction result which yielded more text');
          extractedText = fallbackResult;
        }
      } catch (fallbackError) {
        console.warn('Fallback extraction failed:', fallbackError);
        // Continuer avec le résultat de la méthode principale même si le secours échoue
      }
    }
    
    // Améliorer la structure du texte pour le rendre plus lisible
    extractedText = improveTextStructure(extractedText);
    
    console.log(`PDF.js succeeded with ${extractedText.length} characters`);
    
    return { extractedText, pageCount: numPages };
  } catch (error) {
    console.error('Error in extractTextFromPDFBuffer:', error);
    throw error;
  }
};

/**
 * Estime la hauteur de ligne moyenne
 */
function estimateLineHeight(textItems: any[]): number {
  // Utiliser une hauteur par défaut pour les PDF avec peu d'éléments
  if (textItems.length < 5) return 12;
  
  // Récupérer toutes les positions verticales
  const yPositions = textItems.map(item => item.y);
  
  // Trier les positions en ordre décroissant
  yPositions.sort((a, b) => b - a);
  
  // Calculer les différences entre positions adjacentes
  const differences: number[] = [];
  for (let i = 0; i < yPositions.length - 1; i++) {
    const diff = yPositions[i] - yPositions[i + 1];
    if (diff > 0 && diff < 100) { // Ignorer les écarts trop grands
      differences.push(diff);
    }
  }
  
  // Calculer la moyenne des différences
  if (differences.length === 0) return 12;
  
  const sum = differences.reduce((acc, val) => acc + val, 0);
  return Math.max(1, Math.round(sum / differences.length));
}

/**
 * Type pour les métadonnées PDF (correction des erreurs TypeScript)
 */
interface PDFMetadataInfo {
  Title?: string;
  Author?: string;
  Subject?: string;
  Keywords?: string;
  [key: string]: any;
}

/**
 * Méthode d'extraction de secours pour les PDFs problématiques
 * Tente d'extraire le texte en analysant directement les données brutes du PDF
 */
const fallbackExtraction = async (pdfData: Uint8Array, numPages: number): Promise<string> => {
  try {
    console.log('Attempting fallback extraction for PDF');
    
    // Essayer d'extraire avec une méthode simplifiée de PDF.js
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    
    // Limiter le nombre de pages pour les PDF volumineux
    const pagesToProcess = Math.min(numPages, 50);
    let combinedText = '';
    
    for (let i = 1; i <= pagesToProcess; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extraire simplement le texte brut
        const pageText = textContent.items
          .filter((item: any) => 'str' in item)
          .map((item: any) => item.str)
          .join(' ');
          
        combinedText += pageText + '\n\n';
      } catch (e) {
        console.warn(`Fallback error on page ${i}:`, e);
      }
    }
    
    if (combinedText.trim().length > 100) {
      console.log(`Fallback extracted ${combinedText.length} characters`);
      return combinedText;
    }
    
    // Si le PDF est toujours illisible, essayer d'extraire du texte des métadonnées
    try {
      const metadata = await pdf.getMetadata();
      let metaText = '';
      
      if (metadata && metadata.info) {
        // Typer correctement les métadonnées pour éviter les erreurs TypeScript
        const info = metadata.info as PDFMetadataInfo;
        
        if (info.Title) metaText += `Titre: ${info.Title}\n`;
        if (info.Author) metaText += `Auteur: ${info.Author}\n`;
        if (info.Subject) metaText += `Sujet: ${info.Subject}\n`;
        if (info.Keywords) metaText += `Mots-clés: ${info.Keywords}\n`;
      }
      
      if (metaText) {
        console.log(`Extracted metadata: ${metaText.length} characters`);
        combinedText = metaText + '\n\n' + combinedText;
      }
    } catch (metaError) {
      console.warn('Metadata extraction failed:', metaError);
    }
    
    return combinedText || "[Extraction de texte difficile sur ce document]";
  } catch (error) {
    console.error('Fallback extraction failed:', error);
    return "[Échec de l'extraction du texte par la méthode de secours]";
  }
};

/**
 * Nettoie le texte extrait pour le rendre plus utilisable
 */
const cleanExtractedText = (text: string): string => {
  if (!text) return '';
  
  return text
    // Supprimer les caractères non imprimables
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Supprimer séquences répétitives qui ressemblent à des artefacts
    .replace(/(.)\1{10,}/g, '$1$1$1')
    // Normaliser les espaces
    .replace(/\s+/g, ' ')
    // Normaliser les sauts de ligne
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Améliore la structure du texte pour le rendre plus lisible
 */
function improveTextStructure(text: string): string {
  if (!text) return '';
  
  // Supprimer les séquences de caractères qui ressemblent à des métadonnées PDF
  let improved = text
    // Supprimer les lignes qui semblent être des en-têtes PDF
    .replace(/^.*PDF.*$/mg, '')
    // Supprimer les lignes qui semblent être des numéros de page isolés
    .replace(/^\s*\d+\s*$/mg, '')
    // Nettoyer les séquences d'espaces multiples
    .replace(/\s{3,}/g, '\n')
    // Remplacer les tirets isolés en début de ligne par des puces
    .replace(/^\s*-\s+/mg, '• ');
  
  // Détecter et améliorer la mise en forme des sections courantes de CV
  const sections = [
    "EXPÉRIENCE", "EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EXPÉRIENCE PROFESSIONNELLE",
    "ÉDUCATION", "EDUCATION", "FORMATION", "ÉTUDES", "ETUDES",
    "COMPÉTENCES", "COMPETENCES", "SKILLS", "SAVOIR-FAIRE",
    "LANGUES", "LANGUAGES", "CERTIFICATIONS", "PROJETS", "PROJECTS",
    "CENTRES D'INTÉRÊT", "INTERESTS", "HOBBIES", "LOISIRS"
  ];
  
  // Mettre en évidence les sections
  sections.forEach(section => {
    const regex = new RegExp(`(\\b${section}\\b)`, 'gi');
    improved = improved.replace(regex, '\n\n$1\n');
  });
  
  // Supprimer les lignes vides consécutives
  improved = improved.replace(/\n{3,}/g, '\n\n');
  
  return improved.trim();
}

/**
 * Extract text from a PDF URL with better error handling
 * @param pdfUrl The URL of the PDF to extract text from
 * @returns The extracted text
 */
export const extractTextFromPdfUrl = async (pdfUrl: string): Promise<string> => {
  try {
    console.log('Extracting text from PDF URL:', pdfUrl);
    
    // Ajouter un paramètre de cache-busting pour éviter les problèmes de cache
    const cacheBustedUrl = new URL(pdfUrl);
    cacheBustedUrl.searchParams.append('_', Date.now().toString());
    
    console.log('Using cache-busted URL:', cacheBustedUrl.toString());
    
    // Télécharger le PDF en mode blob pour le traiter localement
    const response = await fetch(cacheBustedUrl.toString(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });
    
    if (!response.ok) {
      throw new Error(`Échec du téléchargement: ${response.status} ${response.statusText}`);
    }
    
    // Convertir le blob en ArrayBuffer
    const pdfBlob = await response.blob();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log(`PDF downloaded, size: ${Math.round(uint8Array.length / 1024)} KB`);
    
    // Utiliser notre extracteur existant avec le buffer
    const { extractedText } = await extractTextFromPDFBuffer(uint8Array);
    
    return extractedText;
  } catch (error: any) {
    console.error('Error in extractTextFromPdfUrl:', error);
    throw new Error(`Échec de l'extraction de texte: ${error.message}`);
  }
};

// Fonction simplifiée qui maintient la compatibilité avec l'ancienne API
export const cleanResumeText = (rawText: string): string => {
  if (!rawText || typeof rawText !== 'string') {
    return "Aucun texte disponible";
  }
  
  return cleanExtractedText(rawText);
};
