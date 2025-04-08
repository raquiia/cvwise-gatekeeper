
// PDF Text extraction utility for Edge Function
// Using PDF.js compatible with Deno environment
import * as pdfjs from "npm:pdfjs-dist@3.11.174";

/**
 * Extract text from a PDF file using server-side techniques
 */
export async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Starting text extraction from PDF buffer");
    
    // Configure PDF.js to use no worker - important for Deno environment
    const pdfjsLib = pdfjs;
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";  // Don't use worker in Deno
    
    // Load the PDF document with PDF.js
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true
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
    
    console.log(`Text cleaning complete. Final text length: ${extractedText.length} chars`);
    
    return { extractedText, pageCount: numPages };
  } catch (error) {
    console.error("Error in extractTextFromPDF:", error);
    // Try with PDF TextExtractor module
    return await extractWithTextExtractor(pdfBuffer);
  }
}

/**
 * Clean the extracted text to make it more readable
 */
function cleanExtractedText(text: string): string {
  if (!text) return "";
  
  // Basic cleaning
  let cleaned = text
    // Remove non-printable characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove PDF specific artifacts
    .replace(/(obj|endobj|stream|endstream|xref|trailer|startxref)/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove repetitive character sequences
    .replace(/(.)\1{5,}/g, '$1$1$1')
    .trim();
    
  // Improve structure with line breaks
  // Add line breaks at potential section boundaries
  cleaned = cleaned.replace(/([.!?]) ([A-Z])/g, '$1\n\n$2');
  
  // Identify common CV section headers and add formatting
  const sectionHeaders = [
    "EXPÉRIENCE", "EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EXPÉRIENCE PROFESSIONNELLE",
    "ÉDUCATION", "EDUCATION", "FORMATION", "ÉTUDES", "ETUDES",
    "COMPÉTENCES", "COMPETENCES", "SKILLS", "SAVOIR-FAIRE",
    "LANGUES", "LANGUAGES", "CERTIFICATIONS", "PROJETS", "PROJECTS",
    "CENTRES D'INTÉRÊT", "INTERESTS", "HOBBIES", "LOISIRS"
  ];
  
  // Improve section headers visibility
  for (const header of sectionHeaders) {
    const regex = new RegExp(`\\b${header}\\b`, 'gi');
    cleaned = cleaned.replace(regex, match => `\n\n${match.toUpperCase()}\n`);
  }
  
  // Format bullet points
  cleaned = cleaned.replace(/[•●⟐◦⦾◆■▪︎]( +)/g, '\n• ');
  
  // Remove excessive line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned;
}

/**
 * Fallback extraction method using text extraction approach
 */
async function extractWithTextExtractor(pdfBuffer: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Using fallback text extraction method");
    
    // Basic text extraction - get the text representation from PDF bytes
    const text = new TextDecoder().decode(pdfBuffer);
    
    // Try to extract readable text using simple patterns
    let extractedText = '';
    
    // Look for text between common PDF text markers
    const textMatches = text.match(/BT\s+(.*?)\s+ET/gs);
    if (textMatches && textMatches.length > 0) {
      extractedText = textMatches.join(' ');
    } else {
      // Try to extract readable text chunks
      const chunks = text.match(/[A-Za-z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ]{2,}[\s.,;:!?-]*/g);
      if (chunks && chunks.length > 0) {
        extractedText = chunks.join(' ');
      } else {
        extractedText = "Impossible d'extraire du texte lisible de ce PDF.";
      }
    }
    
    // Clean the extracted text
    extractedText = cleanExtractedText(extractedText);
    
    return {
      extractedText: extractedText || "Texte extrait par méthode de secours - qualité réduite",
      pageCount: 0 // Cannot determine page count in this method
    };
  } catch (error) {
    console.error("Fallback extraction failed:", error);
    return {
      extractedText: "L'extraction de texte a échoué avec toutes les méthodes disponibles.",
      pageCount: 0
    };
  }
}
