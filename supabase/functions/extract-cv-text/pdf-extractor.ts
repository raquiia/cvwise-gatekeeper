
// PDF Text extraction utility for Edge Function
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm";

// Configure the worker
const pdfjsWorker = { url: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js" };
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker.url;

/**
 * Extract text from a PDF file using server-side techniques
 */
export async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Starting text extraction from PDF buffer");
    
    // Charger le document PDF avec PDF.js
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) });
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
        
        // Extraire et concaténer le texte de la page
        const pageText = content.items
          .filter((item: any) => 'str' in item && item.str.trim().length > 0)
          .map((item: any) => item.str)
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
    
    console.log(`PDF.js succeeded with ${extractedText.length} characters`);
    
    return { extractedText, pageCount: numPages };
  } catch (error) {
    console.error("Error in extractTextFromPDF:", error);
    
    // Try fallback method
    try {
      console.log("Attempting fallback extraction approach");
      return await fallbackExtraction(pdfBuffer);
    } catch (fallbackError) {
      console.error("Fallback extraction also failed:", fallbackError);
      return {
        extractedText: "Error extracting text from PDF: " + (error instanceof Error ? error.message : String(error)),
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
    // Remove strange character sequences that are likely PDF encoding
    .replace(/\\(\d{3}|n|r|t|f|\\|\(|\))/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove repetitive character sequences (like "AAAAAAAA")
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
 * Fallback extraction method
 */
async function fallbackExtraction(pdfBuffer: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Using fallback extraction method");
    
    // Just try a simple approach with fewer options
    const loadingTask = pdfjs.getDocument({ 
      data: new Uint8Array(pdfBuffer),
      disableFontFace: true,
      ignoreErrors: true,
      cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
      cMapPacked: true
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pagesToProcess = Math.min(numPages, 20);
    const textContent: string[] = [];
    
    for (let i = 1; i <= pagesToProcess; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => 'str' in item ? item.str : '')
          .join(' ');
          
        textContent.push(pageText);
      } catch (e) {
        console.warn(`Fallback error on page ${i}:`, e);
      }
    }
    
    const extractedText = textContent.join('\n\n');
    
    return {
      extractedText: extractedText || "Failed to extract text with fallback method",
      pageCount: numPages
    };
  } catch (error) {
    console.error("Fallback extraction failed:", error);
    return {
      extractedText: "Failed to extract text from PDF",
      pageCount: 0
    };
  }
}
