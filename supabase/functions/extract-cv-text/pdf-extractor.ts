
// PDF Text extraction utility for Edge Function
import pdfjs from "npm:pdfjs-dist@3.11.174";
import { TextItem } from "npm:pdfjs-dist@3.11.174/types/src/display/api";

// Configure PDF.js for server environment
const pdfjsVersion = '3.11.174';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;

/**
 * Extract text from a PDF file using server-side techniques
 */
export async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Starting text extraction from PDF buffer");
    
    // Load the PDF document with PDF.js
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      disableWorker: true,
      isEvalSupported: false,
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    console.log(`PDF loaded successfully. Number of pages: ${numPages}`);
    
    // Process each page
    const textContent: string[] = [];
    const maxPages = Math.min(numPages, 50); // Limit to 50 pages for performance
    
    for (let i = 1; i <= maxPages; i++) {
      try {
        console.log(`Processing page ${i}/${numPages}`);
        
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        // Extract and concatenate text from the page with better structure
        const pageText = content.items
          .filter((item: TextItem) => 'str' in item && item.str.trim().length > 0)
          .map((item: TextItem) => item.str)
          .join(' ');
          
        const pageChars = pageText.length;
        console.log(`Extracted ${pageChars} chars from page ${i}`);
        textContent.push(pageText);
        
      } catch (pageError) {
        console.warn(`Error extracting text from page ${i}:`, pageError);
        textContent.push(`[Échec d'extraction - page ${i}]`);
      }
    }
    
    // Combine all pages with line breaks
    let extractedText = textContent.join('\n\n');
    console.log(`PDF.js extraction complete. Total text length: ${extractedText.length} chars`);
    
    // Clean up the extracted text
    extractedText = cleanExtractedText(extractedText);
    extractedText = improveTextStructure(extractedText);
    
    console.log(`Text cleaning complete. Final text length: ${extractedText.length} chars`);
    
    return { extractedText, pageCount: numPages };
  } catch (error) {
    console.error("Error in extractTextFromPDF:", error);
    
    // Try simplified approach
    try {
      console.log("Attempting simplified extraction approach");
      return await simplifiedExtraction(pdfBuffer);
    } catch (fallbackError) {
      console.error("Simplified extraction also failed:", fallbackError);
      return {
        extractedText: "Failed to extract text from PDF. Error: " + (error instanceof Error ? error.message : String(error)),
        pageCount: 0
      };
    }
  }
}

/**
 * Clean the extracted text to make it more readable
 */
function cleanExtractedText(text: string): string {
  if (!text) return "";
  
  return text
    // Remove non-printable characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove PDF specific artifacts
    .replace(/(obj|endobj|stream|endstream|xref|trailer|startxref)/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove repetitive character sequences
    .replace(/(.)\1{5,}/g, '$1$1$1')
    .trim();
}

/**
 * Améliore la structure du texte pour le rendre plus lisible
 */
function improveTextStructure(text: string): string {
  // Supprimer les séquences de caractères qui ressemblent à des métadonnées PDF
  let improved = text
    // Supprimer les lignes qui semblent être des en-têtes PDF
    .replace(/^.*PDF.*$/mg, '')
    // Supprimer les lignes qui contiennent majoritairement des symboles
    .replace(/^[^a-zA-Z0-9àéèêëîïôùûç]{5,}$/mg, '')
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
 * Approche simplifiée d'extraction pour les cas où l'extraction principale échoue
 */
async function simplifiedExtraction(pdfBuffer: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Using simplified extraction method");
    
    // Charger le PDF avec des options minimales
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      disableWorker: true,
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pagesToProcess = Math.min(numPages, 20);
    const textContents: string[] = [];
    
    for (let i = 1; i <= pagesToProcess; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        const pageText = content.items
          .map((item: any) => 'str' in item ? item.str : '')
          .join(' ');
          
        textContents.push(pageText);
      } catch (e) {
        console.warn(`Simplified extraction error on page ${i}:`, e);
      }
    }
    
    const extractedText = textContents.join('\n\n');
    
    return {
      extractedText: cleanExtractedText(extractedText) || "Aucun texte extrait (méthode simplifiée)",
      pageCount: numPages
    };
  } catch (error) {
    console.error("Simplified extraction failed:", error);
    return {
      extractedText: "L'extraction de texte a échoué avec toutes les méthodes disponibles.",
      pageCount: 0
    };
  }
}
