
// PDF Text extraction utility for Edge Function

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
    
    // Vérifier si le résultat est vide
    if (!extractedText || extractedText.trim().length < 100) {
      console.log("Résultat d'extraction insuffisant, utilisation de l'extraction de secours");
      extractedText = fallbackExtraction(rawText);
    }
    
    // Si l'extraction échoue complètement, retourner un message explicite
    if (!extractedText || extractedText.trim().length < 50) {
      return {
        extractedText: "L'extraction du texte a échoué. Le PDF est peut-être protégé, scanné ou dans un format non pris en charge.",
        pageCount: pageCount || 1
      };
    }
    
    return {
      extractedText: extractedText || "PDF text extraction failed",
      pageCount: pageCount || 1
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return {
      extractedText: "Error extracting text from PDF: " + (error instanceof Error ? error.message : String(error)),
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
    
    return cleanedText || fallbackExtraction(pdfText);
  } catch (error) {
    console.error("Error in basic text extraction:", error);
    return fallbackExtraction(pdfText);
  }
}

/**
 * Fallback text extraction using regex - plus agressive
 */
function fallbackExtraction(pdfText: string): string {
  try {
    // Look for any readable text in the PDF
    let extractedTexts: string[] = [];
    
    // Method 1: Extract text between parentheses that might be content
    const textRegex = /\(([^)]{3,})\)/g;
    let match;
    while ((match = textRegex.exec(pdfText)) !== null) {
      if (match[1] && /[a-zA-Z0-9]/.test(match[1])) {
        extractedTexts.push(match[1]);
      }
    }
    
    // Method 2: Extract ASCII text sections - useful for some PDF formats
    const asciiTextChunks = pdfText.match(/[a-zA-Z0-9 .,;:'\-+()[\]{}?!@#$%^&*=\/\\|<>"]{5,}/g);
    if (asciiTextChunks) {
      extractedTexts = extractedTexts.concat(asciiTextChunks);
    }
    
    // Method 3: Look for metadata in the PDF
    const titleMatch = pdfText.match(/\/Title\s*\(([^)]+)\)/);
    const authorMatch = pdfText.match(/\/Author\s*\(([^)]+)\)/);
    const subjectMatch = pdfText.match(/\/Subject\s*\(([^)]+)\)/);
    
    if (titleMatch && titleMatch[1]) extractedTexts.push("Titre: " + titleMatch[1]);
    if (authorMatch && authorMatch[1]) extractedTexts.push("Auteur: " + authorMatch[1]);
    if (subjectMatch && subjectMatch[1]) extractedTexts.push("Sujet: " + subjectMatch[1]);
    
    // Combine and clean the extracted text
    let combinedText = extractedTexts
      .filter(text => text.length > 3) // Remove very short extractions
      .join("\n")
      .replace(/\\([()])/g, "$1") // Handle escaped parentheses
      .replace(/\\n/g, "\n") // Handle newlines
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
      
    // Apply additional cleaning - remove sequences that are likely not real text
    combinedText = combinedText
      .replace(/[^\w\s.,;:'\-+()[\]{}?!@#$%^&*=\/\\|<>"éèêëàâäôöûüùïîçÉÈÊËÀÂÄÔÖÛÜÙÏÎÇ]/g, ' ') // Keep only valid characters and French accents
      .replace(/(\s{2,})/g, ' ') // Normalize spaces
      .replace(/(.)\1{5,}/g, '$1$1$1') // Remove character repetitions (like "aaaaaaaa")
      .trim();
    
    return combinedText || "Aucun texte n'a pu être extrait de ce document.";
  } catch (error) {
    console.error("Error in fallback text extraction:", error);
    return "L'extraction du texte a échoué. Le PDF est peut-être protégé ou dans un format non supporté.";
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
    
    // Method 3: Count occurrences of "stream" and "endstream" pairs (rough approximation)
    const streamMatches = pdfText.match(/stream[\s\S]*?endstream/g);
    if (streamMatches && streamMatches.length > 0) {
      // Divide by typical number of streams per page (rough estimate)
      return Math.ceil(streamMatches.length / 4);
    }
    
    // Default to 1 if we can't determine
    return 1;
  } catch (error) {
    console.error("Error counting pages:", error);
    return 1;
  }
}
