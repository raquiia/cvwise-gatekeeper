/**
 * Utilitaires pour l'extraction de texte des fichiers PDF côté client
 */
import * as pdfjs from 'pdfjs-dist';

// Configurer le worker PDF.js
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extrait le texte d'un fichier PDF
 * @param file Le fichier PDF à analyser
 * @returns Le texte extrait du PDF
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    console.log('Starting client-side PDF text extraction');
    
    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Extraire le texte avec la méthode principale
    const { extractedText, pageCount } = await extractTextFromPDFBuffer(uint8Array);
    
    console.log(`Text extracted successfully: ${extractedText.length} characters from ${pageCount} pages`);
    
    return extractedText;
  } catch (error) {
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
    // Charger le document PDF avec PDF.js
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    console.log(`PDF loaded with ${numPages} pages`);
    
    // Extraire le texte de chaque page
    const textContent: string[] = [];
    
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => 'str' in item ? item.str : '')
          .join(' ');
        
        textContent.push(pageText);
      } catch (pageError) {
        console.warn(`Error extracting text from page ${i}:`, pageError);
        textContent.push(`[Échec d'extraction - page ${i}]`);
      }
    }
    
    // Joindre toutes les pages avec des sauts de ligne
    let extractedText = textContent.join('\n\n');
    
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
    
    return { extractedText, pageCount: numPages };
  } catch (error) {
    console.error('Error in extractTextFromPDFBuffer:', error);
    throw error;
  }
};

/**
 * Méthode d'extraction de secours pour les PDFs problématiques
 * Tente d'extraire le texte en analysant directement les données brutes du PDF
 */
const fallbackExtraction = async (pdfData: Uint8Array, numPages: number): Promise<string> => {
  try {
    // Convertir Uint8Array en string pour l'analyse
    const pdfString = new TextDecoder().decode(pdfData);
    
    // Utiliser regex pour extraire le texte entre les balises stream et endstream
    const textBlocks: string[] = [];
    const streamRegex = /stream([\s\S]*?)endstream/g;
    let match;
    
    while ((match = streamRegex.exec(pdfString)) !== null) {
      if (match[1] && match[1].length > 10) {
        // Nettoyer les caractères non imprimables
        const cleanedText = match[1]
          .replace(/[^\x20-\x7E\r\n]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
          
        if (cleanedText.length > 20) {
          textBlocks.push(cleanedText);
        }
      }
    }
    
    let extractedText = textBlocks.join('\n\n');
    
    // Appliquer le nettoyage standard
    extractedText = cleanExtractedText(extractedText);
    
    return extractedText || "[Aucun texte extrait via la méthode de secours]";
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
    // Normaliser les espaces et sauts de ligne
    .replace(/\s+/g, ' ')
    .replace(/(\n\s*){3,}/g, '\n\n')
    // Supprimer les caractères non imprimables
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Nettoyer les artefacts PDF courants
    .replace(/[^\w\s.,;:'\-+()[\]{}?!@#$%^&*=\/\\|<>"éèêëàâäôöûüùïîçÉÈÊËÀÂÄÔÖÛÜÙÏÎÇ]/g, '')
    .trim();
};

/**
 * Nettoie le texte brut extrait d'un CV pour le rendre plus lisible
 * Version améliorée pour les CV spécifiquement
 */
export const cleanResumeText = (rawText: string): string => {
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
};

/**
 * Extract text from a PDF URL
 * @param pdfUrl The URL of the PDF to extract text from
 * @returns The extracted text
 */
export const extractTextFromPdfUrl = async (pdfUrl) => {
  try {
    console.log('Extracting text from PDF URL:', pdfUrl);
    
    // No need to reimport PDF.js library as we already imported it at the top level
    try {
      // Load the PDF document using the already configured pdfjs
      const loadingTask = pdfjs.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      let textContent = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => 'str' in item ? item.str : '');
        textContent += strings.join(' ') + '\n';
      }
      
      if (!textContent || textContent.trim().length < 50) {
        throw new Error('PDF extraction produced insufficient text');
      }
      
      return textContent;
    } catch (pdfError) {
      console.error('Error extracting text from PDF URL:', pdfError);
      throw new Error(`Échec de l'extraction de texte: ${pdfError.message}`);
    }
  } catch (error) {
    console.error('Error in extractTextFromPdfUrl:', error);
    throw new Error(`Échec de l'extraction de texte: ${error.message}`);
  }
};
