
// Extracteur de texte PDF simplifié et robuste pour Supabase Edge Functions
// Version corrigée pour Deno avec meilleure compatibilité

import * as pdfjs from "npm:pdfjs-dist@4.0.379";

/**
 * Extraire le texte d'un fichier PDF
 * @param pdfData ArrayBuffer contenant les données PDF
 * @returns Objet avec le texte extrait et le nombre de pages
 */
export async function extractTextFromPDF(pdfData: ArrayBuffer): Promise<{ extractedText: string; pageCount: number }> {
  console.log("🔄 Début de l'extraction PDF");
  console.log(`📊 Taille du fichier: ${(pdfData.byteLength / 1024).toFixed(2)} KB`);
  
  try {
    // Configuration simplifiée pour éviter les problèmes de compatibilité
    const loadingTask = pdfjs.getDocument({
      data: pdfData,
      // Configuration minimale pour éviter les erreurs
      disableFontFace: true,
      useSystemFonts: false,
      verbosity: 0
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    console.log(`📄 PDF chargé avec succès: ${numPages} pages`);
    
    let fullText = '';
    let totalTextItems = 0;
    
    // Traiter chaque page avec gestion d'erreur individuelle
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        console.log(`🔍 Traitement de la page ${pageNum}/${numPages}`);
        const page = await pdfDocument.getPage(pageNum);
        
        // Méthode principale d'extraction
        try {
          const textContent = await page.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false,
            includeMarkedContent: false
          });
          
          console.log(`📝 Page ${pageNum}: ${textContent.items.length} éléments de texte trouvés`);
          
          if (textContent.items && textContent.items.length > 0) {
            let pageText = '';
            let lastY = null;
            
            for (const item of textContent.items) {
              if ('str' in item && item.str && item.str.trim()) {
                // Gestion des sauts de ligne basés sur la position Y
                if (lastY !== null && item.transform && item.transform[5] !== undefined) {
                  const currentY = item.transform[5];
                  if (Math.abs(lastY - currentY) > 5) {
                    pageText += '\n';
                  }
                  lastY = currentY;
                } else if (lastY === null && item.transform && item.transform[5] !== undefined) {
                  lastY = item.transform[5];
                }
                
                pageText += item.str + ' ';
                totalTextItems++;
              }
            }
            
            if (pageText.trim()) {
              fullText += pageText.trim() + '\n\n';
              console.log(`✅ Page ${pageNum}: ${pageText.trim().length} caractères extraits`);
            } else {
              console.warn(`⚠️ Page ${pageNum}: Aucun texte extrait malgré ${textContent.items.length} éléments`);
            }
          } else {
            console.warn(`⚠️ Page ${pageNum}: Aucun élément de texte trouvé`);
          }
          
        } catch (pageError) {
          console.error(`❌ Erreur lors de l'extraction de la page ${pageNum}:`, pageError);
          
          // Méthode de fallback simplifiée pour cette page
          try {
            const fallbackContent = await page.getTextContent();
            const fallbackText = fallbackContent.items
              .filter(item => 'str' in item && item.str)
              .map(item => 'str' in item ? item.str : '')
              .join(' ');
            
            if (fallbackText.trim()) {
              fullText += fallbackText.trim() + '\n\n';
              console.log(`🔄 Page ${pageNum}: ${fallbackText.length} caractères extraits via fallback`);
            }
          } catch (fallbackError) {
            console.error(`❌ Fallback échoué pour la page ${pageNum}:`, fallbackError);
            fullText += `[Erreur d'extraction pour la page ${pageNum}]\n\n`;
          }
        }
        
      } catch (pageLoadError) {
        console.error(`❌ Impossible de charger la page ${pageNum}:`, pageLoadError);
        fullText += `[Impossible de charger la page ${pageNum}]\n\n`;
      }
    }
    
    console.log(`📊 Extraction terminée: ${totalTextItems} éléments de texte traités`);
    
    // Nettoyage du texte extrait
    let cleanedText = fullText
      .replace(/\s+/g, ' ')           // Normaliser les espaces
      .replace(/\n+/g, '\n')          // Normaliser les retours à la ligne
      .replace(/\n /g, '\n')          // Supprimer les espaces après les retours
      .trim();
    
    // Nettoyage avancé pour une meilleure lisibilité
    cleanedText = cleanedText
      .replace(/([.!?])\s+([A-ZÀ-Ÿ])/g, '$1\n$2')  // Retours après phrases
      .replace(/(\w)\s*-\s*(\w)/g, '$1-$2')         // Corriger les mots coupés
      .replace(/\n{3,}/g, '\n\n')                   // Limiter les retours multiples
      .replace(/\s*\n\s*/g, '\n');                  // Nettoyer autour des retours
    
    const finalLength = cleanedText.length;
    console.log(`📋 Texte final: ${finalLength} caractères`);
    
    if (finalLength > 0) {
      console.log(`🎯 Aperçu du texte extrait: "${cleanedText.substring(0, 200)}..."`);
    }
    
    // Validation du résultat
    if (finalLength < 10) {
      console.warn(`⚠️ Texte extrait très court (${finalLength} caractères)`);
      
      // Tentative de diagnostic
      if (totalTextItems === 0) {
        throw new Error("Aucun élément de texte trouvé dans le PDF - le document pourrait être basé sur des images ou protégé");
      } else {
        console.warn(`🔍 ${totalTextItems} éléments trouvés mais texte final court - possibles caractères spéciaux ou formatage complexe`);
      }
    }
    
    return {
      extractedText: cleanedText,
      pageCount: numPages
    };
    
  } catch (error) {
    console.error("💥 Échec de l'extraction PDF principale:", error);
    
    // Méthode de fallback globale ultra-simplifiée
    try {
      console.log("🔄 Tentative de fallback avec configuration minimale");
      
      const fallbackTask = pdfjs.getDocument({
        data: pdfData,
        verbosity: 0
      });
      
      const fallbackDoc = await fallbackTask.promise;
      let fallbackText = '';
      
      for (let i = 1; i <= fallbackDoc.numPages; i++) {
        try {
          const page = await fallbackDoc.getPage(i);
          const content = await page.getTextContent();
          
          const pageText = content.items
            .filter(item => 'str' in item && item.str)
            .map(item => 'str' in item ? item.str : '')
            .join(' ');
          
          fallbackText += pageText + '\n\n';
        } catch (pageError) {
          console.error(`Erreur fallback page ${i}:`, pageError);
        }
      }
      
      const cleanedFallback = fallbackText.trim();
      console.log(`🔄 Fallback réussi: ${cleanedFallback.length} caractères`);
      
      if (cleanedFallback.length > 0) {
        return {
          extractedText: cleanedFallback,
          pageCount: fallbackDoc.numPages
        };
      }
      
    } catch (fallbackError) {
      console.error("💥 Fallback également échoué:", fallbackError);
    }
    
    throw new Error(`Impossible d'extraire le texte du PDF: ${error.message}`);
  }
}
