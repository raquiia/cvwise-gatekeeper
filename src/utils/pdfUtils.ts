
/**
 * Utilitaires pour l'extraction de texte des fichiers PDF côté client
 */
import * as pdfjs from 'pdfjs-dist';

// Configurer le worker pour PDF.js
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
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
    
    // Charger le document PDF avec PDF.js
    const loadingTask = pdfjs.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    // Extraire le texte de chaque page
    let extractedText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      extractedText += pageText + '\n\n';
    }
    
    console.log(`Text extracted successfully: ${extractedText.length} characters`);
    
    // Nettoyer le texte extrait
    const cleanedText = cleanExtractedText(extractedText);
    
    return cleanedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Échec de l'extraction du texte du PDF: ${error.message}`);
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
