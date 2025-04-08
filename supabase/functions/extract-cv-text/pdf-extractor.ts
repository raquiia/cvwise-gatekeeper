
// A simplified PDF text extractor for Supabase Edge Functions
// Uses the pdf.js library with Deno-compatible imports

import * as pdfjs from "npm:pdfjs-dist@3.11.174/legacy/build/pdf.js";

// Configure PDF.js for Deno environment
const CMAP_URL = "npm:pdfjs-dist@3.11.174/cmaps/";
const CMAP_PACKED = true;

// Create a dummy global worker to avoid errors
// PDF.js expects a browser environment, but we're in Deno
const GlobalWorkerOptions = {
  workerSrc: ''
};

// Assign our dummy worker options to the library
if (!pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions = GlobalWorkerOptions;
}

/**
 * Extract text from a PDF file
 * @param pdfData ArrayBuffer containing the PDF data
 * @returns Object with extracted text and page count
 */
export async function extractTextFromPDF(pdfData: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  console.log("Starting PDF extraction process");
  
  try {
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({
      data: pdfData,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
      disableFontFace: true,
      useSystemFonts: false,
    });
    
    const pdfDocument = await loadingTask.promise;
    console.log(`PDF loaded successfully, contains ${pdfDocument.numPages} pages`);
    
    let fullText = '';
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      try {
        console.log(`Processing page ${pageNum}/${pdfDocument.numPages}`);
        const page = await pdfDocument.getPage(pageNum);
        
        try {
          // Extract text content with detailed options
          const textContent = await page.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false,
          });
          
          // Process text items with position information
          let lastY = null;
          let pageText = '';
          
          for (const item of textContent.items) {
            if ('str' in item && item.str) {
              // Check if we need to add a new line based on Y position
              if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
                pageText += '\n';
              }
              
              // Add the text content
              pageText += item.str + ' ';
              
              // Update lastY position
              lastY = item.transform[5];
            }
          }
          
          fullText += pageText + '\n\n';
        } catch (textExtractionError) {
          console.error(`Error extracting text from page ${pageNum}:`, textExtractionError);
          // Try fallback method for this page
          const textContent = await page.getTextContent();
          const strings = textContent.items.map(item => 'str' in item ? item.str : '');
          fullText += strings.join(' ') + '\n\n';
        }
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        fullText += `[Error extracting page ${pageNum}]\n\n`;
      }
    }
    
    // Clean up extracted text
    let cleanedText = fullText
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/\n+/g, '\n')          // Normalize line breaks
      .replace(/\n /g, '\n')          // Remove spaces after line breaks
      .trim();
    
    // Additional cleaning for better readability
    cleanedText = cleanedText
      .replace(/([.!?]) ([A-Z])/g, '$1\n$2')  // Add line breaks after sentences
      .replace(/(\w) - (\w)/g, '$1-$2')       // Fix hyphenated words
      .replace(/\n{3,}/g, '\n\n');            // Limit consecutive line breaks
    
    console.log(`Extraction complete. Extracted ${cleanedText.length} characters`);
    
    return {
      extractedText: cleanedText,
      pageCount: pdfDocument.numPages
    };
  } catch (error) {
    console.error("PDF extraction failed:", error);
    
    // Try a simpler fallback method if the main extraction fails
    try {
      console.log("Attempting fallback extraction method");
      const loadingTask = pdfjs.getDocument({
        data: pdfData,
        disableFontFace: true,
      });
      
      const pdfDocument = await loadingTask.promise;
      let fallbackText = '';
      
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter(item => 'str' in item)
          .map(item => 'str' in item ? item.str : '')
          .join(' ');
        
        fallbackText += pageText + '\n\n';
      }
      
      return {
        extractedText: fallbackText.trim(),
        pageCount: pdfDocument.numPages
      };
    } catch (fallbackError) {
      console.error("Fallback extraction also failed:", fallbackError);
      throw new Error("Impossible d'extraire le texte du PDF: " + error.message);
    }
  }
}
