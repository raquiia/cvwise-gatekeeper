
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
    
    // Process each page to extract human-readable text
    const textContent: string[] = [];
    const maxPages = Math.min(numPages, 50); // Limit to 50 pages for performance
    
    for (let i = 1; i <= maxPages; i++) {
      try {
        console.log(`Processing page ${i}/${maxPages}`);
        
        const page = await pdf.getPage(i);
        const content = await page.getTextContent({ normalizeWhitespace: true });
        
        // Get text items and respect their positioning
        let lastY = null;
        let text = "";
        
        for (const item of content.items) {
          if (!('str' in item) || item.str.trim().length === 0) continue;
          
          // Add line breaks when Y position changes significantly
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            text += "\n";
            // Add an extra line break for larger gaps (likely new sections)
            if (Math.abs(item.transform[5] - lastY) > 15) {
              text += "\n";
            }
          }
          
          text += item.str + " ";
          lastY = item.transform[5];
        }
        
        console.log(`Extracted text from page ${i}, length: ${text.length} chars`);
        textContent.push(text);
        
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        textContent.push(`[Échec d'extraction - page ${i}]`);
      }
    }
    
    // Combine all pages with proper formatting
    let extractedText = textContent.join('\n\n');
    console.log(`PDF.js extraction complete. Total text length: ${extractedText.length} chars`);
    
    // Clean up the extracted text
    extractedText = cleanExtractedText(extractedText);
    
    return { extractedText, pageCount: numPages };
  } catch (error) {
    console.error("Error in extractTextFromPDF:", error);
    
    // Try with simplified extractor as fallback
    try {
      console.log("Trying simplified extraction method");
      const result = await extractWithTextExtractor(pdfBuffer);
      return result;
    } catch (fallbackError) {
      console.error("Simplified extraction failed:", fallbackError);
      return { 
        extractedText: "L'extraction du texte a échoué. Le PDF pourrait être protégé ou ne contenir que des images.", 
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
  
  // Basic cleaning
  let cleaned = text
    // Remove non-printable characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove PDF specific artifacts
    .replace(/(obj|endobj|stream|endstream|xref|trailer|startxref)/g, ' ')
    // Fix spacing around punctuation
    .replace(/\s+([.,;:!?])/g, '$1')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    // Fix space after period
    .replace(/\.(\w)/g, '. $1')
    .trim();
  
  // Improve readability with proper line breaks
  cleaned = cleaned
    // Add line breaks at periods followed by uppercase letters (likely new sentences)
    .replace(/\.\s+([A-Z])/g, '.\n$1')
    // Add line breaks at common section headers
    .replace(/\b(EXPÉRIENCE|EXPERIENCE|EDUCATION|ÉDUCATION|FORMATION|COMPÉTENCES|COMPETENCES|SKILLS)\b/gi, 
             match => `\n\n${match.toUpperCase()}\n`)
    // Preserve bullet points with line breaks
    .replace(/•\s+/g, '\n• ')
    // Remove excessive whitespace
    .replace(/\n{3,}/g, '\n\n');
  
  // Final cleanup
  cleaned = cleaned
    // Restore natural paragraph breaks
    .replace(/([a-z])\n([a-z])/g, '$1 $2')
    // Restore bullet point formatting
    .replace(/([.:;])\n•/g, '$1\n\n•')
    // Fix common PDF extraction artifacts
    .replace(/([A-Z])\s+([a-z])/g, (_, p1, p2) => {
      // Don't join if it's likely a new line
      return /[.!?]/.test(p1) ? p1 + '\n' + p2 : p1 + ' ' + p2;
    });
  
  return cleaned;
}

/**
 * Fallback extraction method
 */
async function extractWithTextExtractor(pdfBuffer: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Using fallback text extraction method");
    
    // Convert PDF buffer to string and try to extract text
    const text = new TextDecoder().decode(pdfBuffer);
    
    // Try to extract text using regex patterns for text content
    const textRegex = /\(([\w\s.,;:!?&'"-]+)\)/g;
    const matches = Array.from(text.matchAll(textRegex))
      .map(match => match[1])
      .filter(match => match.length > 3) // Filter out very short matches
      .join(' ');
    
    let extractedText = matches || "Extraction de texte limitée - méthode de secours";
    extractedText = cleanExtractedText(extractedText);
    
    return {
      extractedText, 
      pageCount: 0
    };
  } catch (error) {
    console.error("Fallback extraction failed:", error);
    return {
      extractedText: "L'extraction de texte a échoué avec toutes les méthodes disponibles.",
      pageCount: 0
    };
  }
}
