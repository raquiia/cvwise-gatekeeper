
// PDF Text extraction utility for Edge Function
// Using PDF.js compatible with Deno environment
import * as pdfjs from "npm:pdfjs-dist@3.11.174/build/pdf.mjs";

/**
 * Extract text from a PDF file using server-side techniques
 */
export async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Starting text extraction from PDF buffer");
    
    // Load the PDF document with PDF.js configured for Deno environment
    const pdfjsLib = pdfjs;
    
    // Important: For Deno environment, we can't use workers
    // Disable worker explicitly for Deno compatibility
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    
    // Load the PDF document with PDF.js
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
      standardFontDataUrl: null // This line helps prevent font-related errors
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    console.log(`PDF loaded successfully. Number of pages: ${numPages}`);
    
    // Process each page to extract text with proper formatting
    const textContent: string[] = [];
    const maxPages = Math.min(numPages, 50); // Limit to 50 pages for performance
    
    for (let i = 1; i <= maxPages; i++) {
      try {
        console.log(`Processing page ${i}/${maxPages}`);
        
        const page = await pdf.getPage(i);
        const content = await page.getTextContent({ normalizeWhitespace: true });
        
        // Process text items with improved positioning logic
        // This approach uses relative positioning to maintain document structure
        let lastY = null;
        let lastX = null;
        let text = "";
        let lineTexts: string[] = [];
        
        // Sort items by vertical position (top to bottom)
        const sortedItems = [...content.items].sort((a, b) => {
          if (!('transform' in a) || !('transform' in b)) return 0;
          return b.transform[5] - a.transform[5]; // Reverse Y-coordinate sorting
        });
        
        // Group text by lines based on Y position
        let currentLineY = null;
        let currentLineItems: any[] = [];
        
        for (const item of sortedItems) {
          if (!('str' in item) || item.str.trim().length === 0) continue;
          
          const y = Math.round(item.transform[5]);
          
          // If this is a new line or the first line
          if (currentLineY === null || Math.abs(y - currentLineY) > 2) {
            // Process previous line if it exists
            if (currentLineItems.length > 0) {
              // Sort by X position (left to right)
              currentLineItems.sort((a, b) => a.transform[4] - b.transform[4]);
              
              // Add all items in the line with proper spacing
              const lineText = currentLineItems.map(item => item.str).join(' ');
              lineTexts.push(lineText);
            }
            
            // Start a new line
            currentLineY = y;
            currentLineItems = [item];
          } else {
            // Add to current line
            currentLineItems.push(item);
          }
        }
        
        // Process the last line
        if (currentLineItems.length > 0) {
          currentLineItems.sort((a, b) => a.transform[4] - b.transform[4]);
          const lineText = currentLineItems.map(item => item.str).join(' ');
          lineTexts.push(lineText);
        }
        
        // Join lines with proper newlines
        text = lineTexts.join('\n');
        
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
      const result = await extractWithAdvancedFallback(pdfBuffer);
      return result;
    } catch (fallbackError) {
      console.error("Simplified extraction failed:", fallbackError);
      // Try one more extremely simple method
      return { 
        extractedText: await lastResortExtraction(pdfBuffer), 
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
    // Remove non-printable characters except newlines
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove PDF specific artifacts
    .replace(/(obj|endobj|stream|endstream|xref|trailer|startxref)/g, ' ')
    // Normalize spaces
    .replace(/[ \t]+/g, ' ')
    // Remove repeated newlines
    .replace(/\n{3,}/g, '\n\n')
    // Clean up empty lines
    .replace(/^\s*[\r\n]/gm, '')
    .trim();
  
  // Detect section headings (usually in uppercase or bold)
  const sectionRegex = /\b(FORMATION|EXPÉRIENCE|EDUCATION|ÉDUCATION|COMPÉTENCES|COMPETENCES|SKILLS|CONTACT|PROFIL|LANGUES|PROJETS)\b/gi;
  cleaned = cleaned.replace(sectionRegex, match => `\n\n${match.toUpperCase()}\n`);
  
  // Preserve bullet points and improve their formatting
  cleaned = cleaned.replace(/[•·⋅‣⁃◦∙◘○◙◉]/g, '\n• ');
  
  // Fix common spacing issues
  cleaned = cleaned
    // Fix space after period
    .replace(/\.(\w)/g, '. $1')
    // Fix space after comma
    .replace(/,(\w)/g, ', $1')
    // Clean up invalid date formats (e.g., missing spaces)
    .replace(/(\d{4})-(\d{4})/g, '$1 - $2')
    // Remove excessive spaces at the beginning of lines
    .replace(/^\s+/gm, '')
    // Remove non-useful duplicate text (often found in PDFs)
    .replace(/(.{30,})\1+/g, '$1');
    
  return cleaned;
}

/**
 * Advanced fallback extraction method that tries multiple approaches
 */
async function extractWithAdvancedFallback(pdfBuffer: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Using advanced fallback text extraction method");
    
    // Approach 1: Extract text patterns
    const text = new TextDecoder().decode(pdfBuffer);
    
    // Try to find text content between common PDF markers
    const contentRegex = /BT\s*([^]*?)\s*ET/g;
    const contentMatches = Array.from(text.matchAll(contentRegex))
      .map(match => match[1])
      .join(' ');
    
    // Try to extract text using common patterns
    const textRegex = /\(((?:[^\\()]*|\\.)+)\)/g;
    const matches = Array.from(text.matchAll(textRegex))
      .map(match => {
        // Decode PDF string encodings
        let decoded = match[1]
          .replace(/\\(\d{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\');
        return decoded;
      })
      .filter(match => match.length > 2) // Filter out very short matches
      .join(' ');
    
    // Approach 2: Extract unicode sequences
    const unicodeRegex = /\<([0-9A-Fa-f]{4,})\>/g;
    const unicodeMatches = Array.from(text.matchAll(unicodeRegex))
      .map(match => {
        // Convert hex to text
        const hex = match[1];
        let result = '';
        for (let i = 0; i < hex.length; i += 4) {
          const chunk = hex.substring(i, i + 4);
          if (chunk.length === 4) {
            const charCode = parseInt(chunk, 16);
            if (!isNaN(charCode) && charCode > 0) {
              result += String.fromCharCode(charCode);
            }
          }
        }
        return result;
      })
      .filter(match => match.length > 0)
      .join(' ');
    
    // Combine all extraction methods
    let extractedText = matches + ' ' + unicodeMatches + ' ' + contentMatches;
    
    // Clean up the extracted text
    extractedText = cleanExtractedText(extractedText);
    
    console.log(`Advanced fallback extraction complete, text length: ${extractedText.length}`);
    
    return {
      extractedText: extractedText || "Extraction de texte limitée - méthode alternative",
      pageCount: 0
    };
  } catch (error) {
    console.error("Advanced fallback extraction failed:", error);
    throw error;
  }
}

/**
 * Last resort extraction for when all else fails
 */
async function lastResortExtraction(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log("Using last resort extraction method");
    
    // Convert to string and extract anything that looks like text
    const text = new TextDecoder().decode(pdfBuffer);
    
    // Extract anything that looks like text (3+ consecutive letters)
    const wordRegex = /[A-Za-zÀ-ÖØ-öø-ÿ]{3,}/g;
    const words = text.match(wordRegex) || [];
    
    // Reconstruct meaningful text
    let result = '';
    let wordCount = 0;
    let lineLength = 0;
    
    for (const word of words) {
      // Skip PDF-specific terms and very long strings (likely garbage)
      if (/^(obj|endobj|stream|xref|startxref|trailer)$/i.test(word) || word.length > 30) {
        continue;
      }
      
      result += word + ' ';
      wordCount++;
      lineLength += word.length + 1;
      
      // Add line breaks to make it more readable
      if (lineLength > 60) {
        result += '\n';
        lineLength = 0;
      }
      
      // Group words into paragraphs
      if (wordCount % 15 === 0) {
        result += '\n\n';
      }
    }
    
    return result.trim() || "L'extraction du texte a échoué avec toutes les méthodes disponibles.";
  } catch (error) {
    console.error("Last resort extraction failed:", error);
    return "L'extraction du texte a complètement échoué.";
  }
}
