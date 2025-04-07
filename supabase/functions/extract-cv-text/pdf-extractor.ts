
// PDF Text extraction utility for Edge Function
import { load as cheerioLoad } from "https://esm.sh/cheerio@1.0.0-rc.12";

/**
 * Extract text from a PDF file using server-side techniques
 */
export async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Starting text extraction from PDF buffer");
    
    // Convert the ArrayBuffer to a string (works for text-based PDFs)
    const decoder = new TextDecoder("utf-8");
    let rawText = decoder.decode(pdfBuffer);
    
    // Basic PDF text extraction (for simple PDFs)
    let extractedText = extractBasicText(rawText);
    
    // Calculate approximate page count
    const pageCount = countPages(rawText);
    
    console.log(`Extraction complete: ~${pageCount} pages, ${extractedText.length} chars`);
    
    return {
      extractedText: extractedText || "PDF text extraction failed",
      pageCount: pageCount || 1
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return {
      extractedText: "Error extracting text from PDF",
      pageCount: 0
    };
  }
}

/**
 * Basic PDF text extraction
 */
function extractBasicText(pdfText: string): string {
  try {
    // Find text blocks between BT and ET tags (basic PDF text extraction)
    const textBlocks: string[] = [];
    const btEtRegex = /BT\s*(.*?)\s*ET/gs;
    let match;
    
    while ((match = btEtRegex.exec(pdfText)) !== null) {
      if (match[1]) {
        textBlocks.push(match[1]);
      }
    }
    
    // Extract text content from TJ and Tj operators
    let extractedText = "";
    for (const block of textBlocks) {
      // Extract text from TJ operators: [(...)Tj] format
      const tjMatches = block.match(/\[([^\]]+)\]\s*TJ/g);
      if (tjMatches) {
        for (const tjMatch of tjMatches) {
          const contentMatch = tjMatch.match(/\[(.*?)\]\s*TJ/);
          if (contentMatch && contentMatch[1]) {
            const content = contentMatch[1]
              .replace(/\(([^)]*)\)/g, "$1") // Extract content from parentheses
              .replace(/\\(\d{3})/g, (m, p) => String.fromCharCode(parseInt(p, 8))) // Convert octal escapes
              .replace(/\\n/g, "\n") // Handle newlines
              .replace(/\\r/g, "\r") // Handle carriage returns
              .replace(/\\t/g, "\t") // Handle tabs
              .replace(/\\(.)/g, "$1"); // Remove backslash escapes
            
            extractedText += content + " ";
          }
        }
      }
      
      // Extract text from Tj operators: (...)Tj format
      const tjSingleMatches = block.match(/\([^)]+\)\s*Tj/g);
      if (tjSingleMatches) {
        for (const tjMatch of tjSingleMatches) {
          const contentMatch = tjMatch.match(/\(([^)]*)\)\s*Tj/);
          if (contentMatch && contentMatch[1]) {
            extractedText += contentMatch[1] + " ";
          }
        }
      }
    }
    
    // Clean up the extracted text
    const cleanedText = extractedText
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
    
    return cleanedText || fallbackTextExtraction(pdfText);
  } catch (error) {
    console.error("Error in basic text extraction:", error);
    return fallbackTextExtraction(pdfText);
  }
}

/**
 * Fallback text extraction using regex
 */
function fallbackTextExtraction(pdfText: string): string {
  try {
    // Look for any readable text in the PDF
    let text = "";
    
    // Extract text between parentheses that might be content
    const textRegex = /\(([^)]{3,})\)/g;
    let match;
    while ((match = textRegex.exec(pdfText)) !== null) {
      if (match[1] && /[a-zA-Z0-9]/.test(match[1])) {
        text += match[1] + " ";
      }
    }
    
    // Clean up the text
    return text
      .replace(/\\([()])/g, "$1") // Handle escaped parentheses
      .replace(/\\n/g, "\n") // Handle newlines
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  } catch (error) {
    console.error("Error in fallback text extraction:", error);
    return "Text extraction failed";
  }
}

/**
 * Count pages in the PDF
 */
function countPages(pdfText: string): number {
  try {
    // Method 1: Count "/Page" objects
    const pageObjMatches = pdfText.match(/\/Type\s*\/Page[^s]/g);
    if (pageObjMatches && pageObjMatches.length > 0) {
      return pageObjMatches.length;
    }
    
    // Method 2: Look for "Count" in the page tree
    const countMatch = pdfText.match(/\/Count\s+(\d+)/);
    if (countMatch && countMatch[1]) {
      return parseInt(countMatch[1], 10);
    }
    
    // Default to 1 if we can't determine
    return 1;
  } catch (error) {
    console.error("Error counting pages:", error);
    return 1;
  }
}

/**
 * Extract text from HTML content
 * Used as a fallback for PDFs that are actually HTML
 */
function extractTextFromHTML(htmlContent: string): string {
  try {
    const $ = cheerioLoad(htmlContent);
    return $("body").text().replace(/\s+/g, " ").trim();
  } catch (error) {
    console.error("Error extracting text from HTML:", error);
    return "";
  }
}
