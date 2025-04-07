
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js";

// Configurer le worker PDF.js - mais on peut s'en passer côté serveur avec le mode "legacy"
const workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js";

export async function extractTextFromPDF(pdfData: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Démarrage de l'extraction PDF avec PDF.js...");
    
    // Configurer PDF.js pour fonctionner sans worker (mode legacy pour Deno)
    const loadingTask = await pdfjs.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    console.log(`PDF chargé, ${numPages} page(s)`);
    
    // Extraire le texte page par page
    const textContent = [];
    
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        const pageText = content.items
          .filter((item: any) => item.str && item.str.trim().length > 0)
          .map((item: any) => item.str)
          .join(' ');
          
        textContent.push(pageText);
        console.log(`Page ${i}: ${pageText.substring(0, 50)}...`);
      } catch (pageError) {
        console.error(`Erreur extraction page ${i}:`, pageError);
        textContent.push(`[Erreur extraction page ${i}]`);
      }
    }
    
    // Joindre tout le texte
    const extractedText = textContent.join('\n\n');
    
    // Si l'extraction principale a échoué, essayer une méthode de secours
    if (extractedText.length < 100 && numPages > 0) {
      console.log("Extraction principale insuffisante, tentative de méthode de secours...");
      return await fallbackExtraction(pdfData, numPages);
    }
    
    return { extractedText, pageCount: numPages };
  } catch (error) {
    console.error("Erreur avec PDF.js:", error);
    
    // Essayer méthode de secours basée sur le texte brut
    return await rawTextExtraction(pdfData);
  }
}

/**
 * Méthode de secours pour les PDFs problématiques
 */
async function fallbackExtraction(pdfData: ArrayBuffer, numPages: number): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Démarrage extraction de secours...");
    
    // Convertir ArrayBuffer en string
    const decoder = new TextDecoder('utf-8');
    const pdfString = decoder.decode(pdfData);
    
    // Rechercher du texte entre stream et endstream
    const textBlocks = [];
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
    
    const extractedText = textBlocks.join('\n\n');
    console.log(`Extraction de secours: ${extractedText.substring(0, 100)}...`);
    
    return { 
      extractedText: extractedText || "[Aucun texte extrait]", 
      pageCount: numPages 
    };
  } catch (error) {
    console.error("Extraction de secours échouée:", error);
    return { 
      extractedText: "[Échec de l'extraction du texte]", 
      pageCount: numPages 
    };
  }
}

/**
 * Méthode d'extraction basée sur le texte brut
 */
async function rawTextExtraction(pdfData: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  try {
    console.log("Tentative d'extraction du texte brut...");
    
    // Convertir ArrayBuffer en string
    const decoder = new TextDecoder('utf-8');
    const rawText = decoder.decode(pdfData);
    
    // Nettoyer et extraire du texte lisible
    const cleanedText = rawText
      .replace(/[^\x20-\x7E\r\n]/g, ' ')  // Garder uniquement les caractères ASCII imprimables
      .replace(/\s+/g, ' ')               // Normaliser les espaces
      .trim();
      
    const textBlocks = [];
    
    // Rechercher des blocs de texte d'au moins 20 caractères
    const textRegex = /[A-Za-z0-9\s.,;:'"(){}\[\]-]{20,}/g;
    let match;
    
    while ((match = textRegex.exec(cleanedText)) !== null) {
      if (match[0] && match[0].trim().length > 20) {
        textBlocks.push(match[0].trim());
      }
    }
    
    const extractedText = textBlocks.join('\n\n');
    console.log(`Extraction texte brut: ${extractedText.substring(0, 100)}...`);
    
    // Estimer un nombre de pages basé sur la quantité de texte
    const estimatedPages = Math.max(1, Math.ceil(extractedText.length / 3000));
    
    return { 
      extractedText: extractedText || "[Aucun texte lisible extrait]", 
      pageCount: estimatedPages 
    };
  } catch (error) {
    console.error("Extraction texte brut échouée:", error);
    return { 
      extractedText: "[Échec de l'extraction du texte brut]", 
      pageCount: 1 
    };
  }
}
