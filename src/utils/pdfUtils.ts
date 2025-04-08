
/**
 * Utilitaires pour l'extraction de texte des fichiers PDF côté client
 */
import * as pdfjs from 'pdfjs-dist';

// Configurer le worker PDF.js
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Maximum de texte à extraire (pour éviter les problèmes de limite de tokens)
const MAX_EXTRACTED_TEXT_LENGTH = 50000;

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
    // Charger le document PDF avec PDF.js
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    console.log(`PDF loaded with ${numPages} pages`);
    
    // Limiter le nombre de pages pour les PDF volumineux
    const pagesToProcess = Math.min(numPages, 50); // Limiter à 50 pages maximum
    
    // Extraire le texte de chaque page
    const textContent: string[] = [];
    let totalExtractedLength = 0;
    
    for (let i = 1; i <= pagesToProcess; i++) {
      try {
        if (totalExtractedLength > MAX_EXTRACTED_TEXT_LENGTH) {
          console.log(`Reached maximum text extraction limit (${MAX_EXTRACTED_TEXT_LENGTH} characters). Stopping.`);
          textContent.push(`[EXTRACTION LIMITÉE - Pages ${i} à ${numPages} non extraites pour respecter les limites]`);
          break;
        }
        
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => 'str' in item ? item.str : '')
          .join(' ');
        
        textContent.push(pageText);
        totalExtractedLength += pageText.length;
      } catch (pageError) {
        console.warn(`Error extracting text from page ${i}:`, pageError);
        textContent.push(`[Échec d'extraction - page ${i}]`);
      }
    }
    
    // Joindre toutes les pages avec des sauts de ligne
    let extractedText = textContent.join('\n\n');
    
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
    
    // Extraire le texte des balises ()Tj qui peuvent contenir du texte
    const tjRegex = /\(([^)]{3,})\)\s*Tj/g;
    let tjMatch;
    
    while ((tjMatch = tjRegex.exec(pdfString)) !== null) {
      if (tjMatch[1] && /[a-zA-Z0-9]/.test(tjMatch[1])) {
        // Decode escaped chars
        const text = tjMatch[1]
          .replace(/\\(\d{3})/g, (m, p) => String.fromCharCode(parseInt(p, 8)))
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\(.)/g, "$1");
        
        textBlocks.push(text);
      }
    }
    
    // Extraire les potentielles sections de texte "pur" dans le PDF
    const textRegex = /[a-zA-Z0-9 .,;:'\-+()[\]{}?!@#$%^&*=\/\\|<>"éèêëàâäôöûüùïîçÉÈÊËÀÂÄÔÖÛÜÙÏÎÇ]{10,}/g;
    const textMatches = pdfString.match(textRegex);
    
    if (textMatches) {
      textBlocks.push(...textMatches);
    }
    
    let extractedText = textBlocks.join('\n\n');
    
    // Limiter la taille du texte extrait
    if (extractedText.length > MAX_EXTRACTED_TEXT_LENGTH) {
      extractedText = extractedText.substring(0, MAX_EXTRACTED_TEXT_LENGTH) + 
        "\n\n[TEXTE TRONQUÉ - Le fichier est trop volumineux pour être analysé en entier]";
    }
    
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
    // Supprimer les balises PDF et autres métadonnées inutiles
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
    
    // Normaliser les espaces et sauts de ligne
    .replace(/\s+/g, ' ')
    .replace(/(\n\s*){3,}/g, '\n\n')
    
    // Supprimer les caractères non imprimables
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    
    // Nettoyer les artefacts PDF courants
    .replace(/[^\w\s.,;:'\-+()[\]{}?!@#$%^&*=\/\\|<>"éèêëàâäôöûüùïîçÉÈÊËÀÂÄÔÖÛÜÙÏÎÇ]/g, '')
    
    // Remplacer les répétitions de caractères (comme "AAAAAAAA")
    .replace(/(.)\1{5,}/g, '$1$1$1')
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
  
  // Version améliorée du nettoyage spécifiquement pour les CV
  let cleanedText = rawText
    // Supprimer les balises PDF et autres métadonnées inutiles
    .replace(/%PDF-[0-9.]+[\s\S]*?obj/gi, '')
    .replace(/endobj/gi, '')
    .replace(/startxref[\s\S]*?%%EOF/gi, '')
    
    // Supprimer codes hexadécimaux et nombres non pertinents
    .replace(/[0-9a-f]{6,}/gi, '')
    
    // Supprimer métadonnées et références
    .replace(/\/Type\s*\/[A-Za-z]+/g, '')
    .replace(/\/MediaBox\s*\[[^\]]+\]/g, '')
    .replace(/\/Contents\s*[0-9]+\s*[0-9]+\s*R/g, '')
    .replace(/\/Resources[\s\S]*?>>/g, '')
    
    // Supprimer caractères spéciaux et non-imprimables
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F\uFEFF\uFFFE\uFFFF]/g, '')
    
    // Nettoyer les lignes courtes (souvent du bruit)
    .split('\n')
    .filter(line => line.trim().length > 3)
    .join('\n');
    
  // Détecter et conserver les sections importantes (expérience, formation, etc.)
  const experienceRegex = /exp[ée]rience|travail|emploi|professionnel/i;
  const educationRegex = /[ée]ducation|formation|[ée]tudes|dipl[ôo]me/i;
  const skillsRegex = /comp[ée]tences|savoir|connaissance|technique/i;
  
  // Segmenter le texte pour mieux gérer les sections
  const lines = cleanedText.split('\n');
  const sections: string[] = [];
  let currentSection = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Nouveau titre de section potentiel (ligne courte en majuscules ou avec certains mots-clés)
    if ((trimmedLine.length < 30 && trimmedLine.toUpperCase() === trimmedLine && trimmedLine.length > 3) || 
        experienceRegex.test(trimmedLine) || 
        educationRegex.test(trimmedLine) || 
        skillsRegex.test(trimmedLine)) {
      
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = trimmedLine + '\n';
    } else if (trimmedLine) {
      currentSection += trimmedLine + '\n';
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  // Recombiner les sections avec une séparation claire
  return sections.join('\n\n')
    // Nettoyage final
    .replace(/\s+/g, ' ')
    .replace(/(\n\s*){3,}/g, '\n\n')
    .replace(/[^\w\s.,;:'\-+()[\]{}?!@#$%^&*=\/\\|<>"éèêëàâäôöûüùïîçÉÈÊËÀÂÄÔÖÛÜÙÏÎÇ]/g, '')
    .trim();
};

/**
 * Extract text from a PDF URL with better error handling
 * @param pdfUrl The URL of the PDF to extract text from
 * @returns The extracted text
 */
export const extractTextFromPdfUrl = async (pdfUrl: string): Promise<string> => {
  try {
    console.log('Extracting text from PDF URL:', pdfUrl);
    
    // Vérifier que l'URL est valide
    if (!pdfUrl || typeof pdfUrl !== 'string' || !pdfUrl.startsWith('http')) {
      throw new Error('URL PDF invalide ou non fournie');
    }
    
    try {
      // Vérifier que le PDF est accessible en faisant une requête HEAD avec retry
      let checkResponse = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          checkResponse = await fetch(pdfUrl, { 
            method: 'HEAD',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
          });
          
          if (checkResponse.ok) break;
          
          console.log(`Attempt ${retryCount + 1}: HEAD request failed with status ${checkResponse.status}. Retrying...`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        } catch (headError) {
          console.warn(`HEAD request attempt ${retryCount + 1} failed:`, headError);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!checkResponse || !checkResponse.ok) {
        throw new Error(`Le PDF n'est pas accessible après ${maxRetries} tentatives: ${checkResponse?.status || 'Error'}`);
      }
      
      // Télécharger le PDF en mode blob pour le traiter localement
      const response = await fetch(pdfUrl, {
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
      
      console.log(`Text extracted successfully from URL, length: ${extractedText.length}`);
      
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Extraction a produit un texte insuffisant');
      }
      
      return extractedText;
    } catch (pdfError: any) {
      console.error('Error extracting text from PDF URL:', pdfError);
      throw new Error(`Échec de l'extraction de texte: ${pdfError.message}`);
    }
  } catch (error: any) {
    console.error('Error in extractTextFromPdfUrl:', error);
    throw new Error(`Échec de l'extraction de texte: ${error.message}`);
  }
};
