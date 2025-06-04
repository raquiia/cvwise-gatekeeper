
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractTextFromPDF } from "./pdf-extractor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gestion des requêtes CORS preflight
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}

serve(async (req) => {
  // Gestion CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    console.log("🚀 Fonction d'extraction PDF invoquée");
    
    const requestData = await req.json();
    const { pdfUrl, resumeId } = requestData;
    
    if (!pdfUrl) {
      console.error("❌ URL du PDF manquante dans la requête");
      return new Response(
        JSON.stringify({
          success: false,
          error: "L'URL du PDF est requise"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
    console.log(`📥 Début de l'extraction pour le PDF: ${resumeId || 'ID inconnu'}`);
    console.log(`🔗 URL du PDF: ${pdfUrl}`);
    
    try {
      // Téléchargement du PDF avec cache busting et timeout amélioré
      const timestamp = Date.now();
      const urlWithCache = new URL(pdfUrl);
      urlWithCache.searchParams.set('_', timestamp.toString());
      urlWithCache.searchParams.set('t', 'extract');
      
      console.log(`📡 Téléchargement depuis: ${urlWithCache.toString()}`);
      
      // Configuration de timeout plus robuste
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error("⏰ Timeout lors du téléchargement du PDF");
        controller.abort();
      }, 120000); // 2 minutes de timeout
      
      try {
        const response = await fetch(urlWithCache.toString(), {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'User-Agent': 'Supabase-Functions/1.0'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorMsg = `Échec du téléchargement: ${response.status} ${response.statusText}`;
          console.error(`❌ ${errorMsg}`);
          throw new Error(errorMsg);
        }
        
        // Vérifier le type de contenu
        const contentType = response.headers.get('content-type');
        console.log(`📋 Type de contenu: ${contentType}`);
        
        if (contentType && !contentType.includes('pdf')) {
          console.warn(`⚠️ Type de contenu inattendu: ${contentType}`);
        }
        
        // Convertir en ArrayBuffer
        const pdfData = await response.arrayBuffer();
        
        if (!pdfData || pdfData.byteLength === 0) {
          console.error("❌ Données PDF vides");
          throw new Error("Le fichier PDF téléchargé est vide");
        }
        
        console.log(`📦 PDF téléchargé: ${(pdfData.byteLength / 1024).toFixed(2)} KB`);
        
        // Validation basique du format PDF
        const uint8Array = new Uint8Array(pdfData);
        const header = Array.from(uint8Array.slice(0, 4)).map(b => String.fromCharCode(b)).join('');
        
        if (!header.startsWith('%PDF')) {
          console.error(`❌ En-tête PDF invalide: ${header}`);
          throw new Error("Le fichier téléchargé n'est pas un PDF valide");
        }
        
        console.log(`✅ En-tête PDF valide détecté: ${header}`);
        
        // Extraction du texte avec la nouvelle méthode améliorée
        const result = await extractTextFromPDF(pdfData);
        const extractedText = result.extractedText;
        const pageCount = result.pageCount;
        
        console.log(`🎯 Extraction terminée:`);
        console.log(`  - Pages traitées: ${pageCount}`);
        console.log(`  - Caractères extraits: ${extractedText.length}`);
        console.log(`  - Échantillon: "${extractedText.substring(0, 100)}..."`);
        
        // Validation finale du résultat
        if (!extractedText || extractedText.trim().length < 5) {
          console.error("❌ Texte extrait insuffisant");
          throw new Error("Aucun texte significatif n'a pu être extrait du PDF");
        }
        
        // Statistiques pour le debugging
        const words = extractedText.trim().split(/\s+/).length;
        const lines = extractedText.split('\n').length;
        
        console.log(`📊 Statistiques d'extraction:`);
        console.log(`  - Mots: ${words}`);
        console.log(`  - Lignes: ${lines}`);
        console.log(`  - Densité: ${(words / pageCount).toFixed(1)} mots/page`);
        
        // Retourner le succès avec des métadonnées détaillées
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              text: extractedText,
              pageCount: pageCount,
              resumeId: resumeId,
              fileSize: pdfData.byteLength,
              stats: {
                words: words,
                lines: lines,
                density: Math.round(words / pageCount)
              }
            }
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
          }
        );
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error("Le téléchargement du PDF a expiré (timeout)");
        }
        throw fetchError;
      }
      
    } catch (extractionError: any) {
      console.error("💥 Erreur pendant le processus d'extraction:", extractionError);
      
      // Diagnostic détaillé pour le debugging
      const errorDetails = {
        message: extractionError.message,
        name: extractionError.name,
        stack: extractionError.stack?.substring(0, 500)
      };
      
      console.error("🔍 Détails de l'erreur:", JSON.stringify(errorDetails, null, 2));
      
      return new Response(
        JSON.stringify({
          success: false,
          error: extractionError.message || "Erreur lors de l'extraction du texte",
          details: errorDetails,
          resumeId: resumeId
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
  } catch (requestError: any) {
    console.error("💥 Erreur lors du traitement de la requête:", requestError);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: requestError.message || "Erreur lors du traitement de la requête"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
