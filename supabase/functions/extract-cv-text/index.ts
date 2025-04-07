
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractTextFromPDF } from "./pdf-extractor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
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
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const requestData = await req.json();
    const { pdfUrl, resumeId } = requestData;
    
    if (!pdfUrl) {
      throw new Error("L'URL du PDF est requise");
    }
    
    console.log("Démarrage de l'extraction de texte pour:", pdfUrl);

    // Vérifier si l'URL est publique/accessible
    try {
      const checkResponse = await fetch(pdfUrl, { method: 'HEAD' });
      if (!checkResponse.ok) {
        throw new Error(`PDF non accessible, code: ${checkResponse.status}`);
      }
    } catch (urlError) {
      console.error("Erreur lors de la vérification d'accessibilité:", urlError);
      throw new Error(`URL inaccessible: ${urlError.message}`);
    }

    // Récupérer le PDF avec une meilleure gestion des erreurs et retry
    let response = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(pdfUrl, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
        });
        
        if (response.ok) break;
        
        console.log(`Tentative ${retryCount + 1}/${maxRetries} a échoué avec le status ${response.status}. Réessai...`);
        retryCount++;
        
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (fetchError) {
        console.error(`Erreur de fetch (tentative ${retryCount + 1}):`, fetchError);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!response || !response.ok) {
      throw new Error(`Échec du téléchargement du PDF après ${maxRetries} tentatives: ${response?.status || 'Erreur réseau'}`);
    }
    
    // Convertir en ArrayBuffer
    let pdfData: ArrayBuffer;
    try {
      pdfData = await response.arrayBuffer();
    } catch (convError) {
      console.error("Erreur lors de la conversion en ArrayBuffer:", convError);
      throw new Error("Impossible de lire les données du PDF");
    }
    
    if (!pdfData || pdfData.byteLength === 0) {
      throw new Error("Le fichier PDF est vide ou corrompu");
    }
    
    console.log(`PDF téléchargé, taille: ${(pdfData.byteLength / 1024).toFixed(2)} KB`);
    
    // Limiter la taille du PDF pour éviter les timeouts
    const maxSizeKB = 10 * 1024; // 10 MB
    if (pdfData.byteLength > maxSizeKB * 1024) {
      console.log(`PDF trop volumineux (${(pdfData.byteLength / 1024 / 1024).toFixed(2)} MB), extraction limitée`);
    }
    
    // Extraction du texte avec notre méthode simplifiée
    let extractedText = "";
    let pageCount = 0;
    
    try {
      const result = await extractTextFromPDF(pdfData);
      extractedText = result.extractedText;
      pageCount = result.pageCount;
    } catch (extractError) {
      console.error("Erreur lors de l'extraction:", extractError);
      throw new Error(`Erreur d'extraction: ${extractError.message}`);
    }
    
    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error("Aucun texte n'a pu être extrait du PDF");
    }
    
    console.log(`Extraction réussie, ${pageCount} page(s), longueur du texte: ${extractedText.length} caractères`);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          text: extractedText,
          pageCount: pageCount,
          resumeId: resumeId,
          fileSize: pdfData.byteLength
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'extraction du texte:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Une erreur est survenue lors de l'extraction du texte"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
